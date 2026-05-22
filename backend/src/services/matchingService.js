import { prisma } from "../prismaClient.js";
import { getMatchingReferenceTime } from "../config/time.js";

const READY_STATUS = "ready_for_loading";
const AVAILABLE_STATUS = "available";

const addMinutes = (date, minutes) => new Date(date.getTime() + minutes * 60 * 1000);

const iso = (date) => date.toISOString();

const getEffectiveTruckState = (truck, now) => {
  if (truck.isMoving && truck.arrivalCity && truck.arrivalDatetime) {
    return {
      city: truck.arrivalCity,
      time: truck.arrivalDatetime
    };
  }

  return {
    city: truck.parkingCity,
    time: now
  };
};

function findStaticRoute(fromCityId, toCityId, routes) {
  if (fromCityId === toCityId) {
    return {
      distanceKm: 0,
      travelTimeMinutes: 0,
      cityIds: [fromCityId]
    };
  }

  const adjacency = new Map();

  for (const route of routes) {
    if (!adjacency.has(route.fromCityId)) {
      adjacency.set(route.fromCityId, []);
    }

    adjacency.get(route.fromCityId).push(route);
  }

  const queue = [
    {
      cityId: fromCityId,
      distanceKm: 0,
      travelTimeMinutes: 0,
      cityIds: [fromCityId]
    }
  ];
  const bestByCity = new Map([[fromCityId, 0]]);

  while (queue.length > 0) {
    queue.sort((a, b) => a.travelTimeMinutes - b.travelTimeMinutes);
    const current = queue.shift();

    if (current.cityId === toCityId) {
      return current;
    }

    for (const route of adjacency.get(current.cityId) ?? []) {
      const travelTimeMinutes = current.travelTimeMinutes + route.travelTimeMinutes;

      if (travelTimeMinutes >= (bestByCity.get(route.toCityId) ?? Number.POSITIVE_INFINITY)) {
        continue;
      }

      bestByCity.set(route.toCityId, travelTimeMinutes);
      queue.push({
        cityId: route.toCityId,
        distanceKm: current.distanceKm + route.distanceKm,
        travelTimeMinutes,
        cityIds: [...current.cityIds, route.toCityId]
      });
    }
  }

  return null;
}

function buildCargoPayload(cargo, routeToPickup, routeToDestination, pickupArrival, deliveryArrival, isMatch, reasons) {
  return {
    cargoId: cargo.id,
    cargoName: cargo.name,
    isMatch,
    pickupCity: cargo.pickupCity.name,
    destinationCity: cargo.destinationCity.name,
    weightKg: cargo.weightKg,
    status: cargo.status,
    pickupWindowStart: iso(cargo.pickupWindowStart),
    pickupWindowEnd: iso(cargo.pickupWindowEnd),
    deliveryWindowEnd: iso(cargo.deliveryWindowEnd),
    routeToPickupMinutes: routeToPickup?.travelTimeMinutes ?? null,
    routeToDestinationMinutes: routeToDestination?.travelTimeMinutes ?? null,
    routeToPickupCityIds: routeToPickup?.cityIds ?? [],
    routeToDestinationCityIds: routeToDestination?.cityIds ?? [],
    pickupArrivalTime: pickupArrival ? iso(pickupArrival) : null,
    deliveryArrivalTime: deliveryArrival ? iso(deliveryArrival) : null,
    reasons
  };
}

export async function findMatchesForTruck(truckId) {
  const truck = await prisma.truck.findUnique({
    where: { id: truckId },
    include: {
      parkingCity: true,
      arrivalCity: true
    }
  });

  if (!truck) {
    return null;
  }

  const cargoItems = await prisma.cargo.findMany({
    include: {
      pickupCity: true,
      destinationCity: true
    },
    orderBy: { id: "asc" }
  });

  const now = getMatchingReferenceTime();
  const effective = getEffectiveTruckState(truck, now);
  const cityRoutes = await prisma.cityRoute.findMany();
  const matches = [];
  const rejected = [];

  for (const cargo of cargoItems) {
    const reasons = [];
    let isMatch = true;

    if (truck.status === AVAILABLE_STATUS) {
      reasons.push("Truck is available");
    } else {
      isMatch = false;
      reasons.push("Truck status is not available");
    }

    if (cargo.status === READY_STATUS) {
      reasons.push("Cargo is ready for loading");
    } else {
      isMatch = false;
      reasons.push("Cargo status is not ready_for_loading");
    }

    if (truck.capacityKg >= cargo.weightKg) {
      reasons.push("Truck capacity is sufficient");
    } else {
      isMatch = false;
      reasons.push(`Cargo weight ${cargo.weightKg} kg exceeds truck capacity ${truck.capacityKg} kg`);
    }

    const routeToPickup = findStaticRoute(effective.city.id, cargo.pickupCityId, cityRoutes);
    let pickupArrival = null;

    if (routeToPickup) {
      pickupArrival = addMinutes(effective.time, routeToPickup.travelTimeMinutes);

      if (pickupArrival <= cargo.pickupWindowEnd) {
        reasons.push("Truck can reach pickup city before pickup window closes");
      } else {
        isMatch = false;
        reasons.push("Truck cannot reach pickup city before pickup window closes");
      }
    } else {
      isMatch = false;
      reasons.push(`No route from ${effective.city.name} to ${cargo.pickupCity.name}`);
    }

    const routeToDestination = findStaticRoute(cargo.pickupCityId, cargo.destinationCityId, cityRoutes);
    let deliveryArrival = null;

    if (routeToDestination && pickupArrival) {
      const loadingStart = pickupArrival < cargo.pickupWindowStart ? cargo.pickupWindowStart : pickupArrival;
      deliveryArrival = addMinutes(loadingStart, routeToDestination.travelTimeMinutes);

      if (deliveryArrival <= cargo.deliveryWindowEnd) {
        reasons.push("Truck can deliver cargo before delivery window closes");
      } else {
        isMatch = false;
        reasons.push("Truck cannot deliver cargo before delivery window closes");
      }
    } else if (!routeToDestination) {
      isMatch = false;
      reasons.push(`No route from ${cargo.pickupCity.name} to ${cargo.destinationCity.name}`);
    }

    const payload = buildCargoPayload(
      cargo,
      routeToPickup,
      routeToDestination,
      pickupArrival,
      deliveryArrival,
      isMatch,
      reasons
    );

    if (isMatch) {
      matches.push(payload);
    } else {
      rejected.push(payload);
    }
  }

  return {
    matchingReferenceTime: iso(now),
    truck: {
      id: truck.id,
      name: truck.name,
      effectiveCity: effective.city.name,
      effectiveTime: iso(effective.time),
      capacityKg: truck.capacityKg,
      status: truck.status
    },
    matches,
    rejected
  };
}
