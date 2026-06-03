import { getMatchingReferenceTime } from "../config/time.js";
import { prisma } from "../prismaClient.js";

const READY_STATUS = "ready_for_loading";
const AVAILABLE_STATUS = "available";
const MAX_CHAIN_DEPTH = 8;
const MAX_CHAINS_TO_RETURN = 5;

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
    pickupCityId: cargo.pickupCityId,
    destinationCityId: cargo.destinationCityId,
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

function evaluateCargoForState({
  cargo,
  truck,
  currentCity,
  currentTime,
  cityRoutes,
  requirePickupInCurrentCity
}) {
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

  if (requirePickupInCurrentCity && cargo.pickupCityId !== currentCity.id) {
    isMatch = false;
    reasons.push(`Next cargo is not available in ${currentCity.name}`);
  }

  const routeToPickup = findStaticRoute(currentCity.id, cargo.pickupCityId, cityRoutes);
  let pickupArrival = null;

  if (routeToPickup) {
    pickupArrival = addMinutes(currentTime, routeToPickup.travelTimeMinutes);

    if (pickupArrival <= cargo.pickupWindowEnd) {
      reasons.push("Truck can reach pickup city before pickup window closes");
    } else {
      isMatch = false;
      reasons.push("Truck cannot reach pickup city before pickup window closes");
    }
  } else {
    isMatch = false;
    reasons.push(`No route from ${currentCity.name} to ${cargo.pickupCity.name}`);
  }

  const routeToDestination = findStaticRoute(cargo.pickupCityId, cargo.destinationCityId, cityRoutes);
  let loadingStart = null;
  let deliveryArrival = null;

  if (routeToDestination && pickupArrival) {
    loadingStart = pickupArrival < cargo.pickupWindowStart ? cargo.pickupWindowStart : pickupArrival;
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

  return {
    isMatch,
    payload: buildCargoPayload(cargo, routeToPickup, routeToDestination, pickupArrival, deliveryArrival, isMatch, reasons),
    cargo,
    routeToPickup,
    routeToDestination,
    pickupArrival,
    loadingStart,
    deliveryArrival
  };
}

function buildChainSummary({ legs, startingCityId, visitedCityNames, hasCycle = false }) {
  const firstLeg = legs[0];
  const lastLeg = legs.at(-1);
  const totalTravelMinutes = legs.reduce(
    (sum, leg) => sum + (leg.routeToPickupMinutes ?? 0) + (leg.routeToDestinationMinutes ?? 0),
    0
  );
  const totalCargoWeightKg = legs.reduce((sum, leg) => sum + leg.weightKg, 0);
  const cityPath = [firstLeg.pickupCity, ...legs.map((leg) => leg.destinationCity)];
  const cycleCity = hasCycle ? firstLeg.pickupCity : null;

  return {
    id: legs.map((leg) => leg.cargoId).join("-"),
    cargoCount: legs.length,
    totalTravelMinutes,
    totalCargoWeightKg,
    initialEmptyTravelMinutes: firstLeg.routeToPickupMinutes ?? 0,
    startCity: firstLeg.pickupCity,
    endCity: lastLeg.destinationCity,
    startCityId: startingCityId,
    cityPath,
    visitedCityNames,
    hasCycle,
    cycleCity,
    cycleStartsWithCargoId: hasCycle ? firstLeg.cargoId : null,
    cycleStartsWithCargoName: hasCycle ? firstLeg.cargoName : null,
    cycleReason: hasCycle
      ? `Truck returns to ${firstLeg.pickupCity}, so ${firstLeg.cargoName} can start the same cargo sequence again.`
      : null,
    legs
  };
}

function buildChains({ cargoItems, truck, effective, cityRoutes }) {
  const chains = [];
  const cycles = [];

  const walk = ({ currentCity, currentTime, usedCargoIds, visitedCityNames, legs }) => {
    if (legs.length >= MAX_CHAIN_DEPTH) {
      chains.push(buildChainSummary({ legs, startingCityId: effective.city.id, visitedCityNames }));
      return;
    }

    const nextOptions = cargoItems
      .filter((cargo) => !usedCargoIds.has(cargo.id) && cargo.pickupCityId === currentCity.id)
      .map((cargo) =>
        evaluateCargoForState({
          cargo,
          truck,
          currentCity,
          currentTime,
          cityRoutes,
          requirePickupInCurrentCity: true
        })
      )
      .filter((result) => result.isMatch);

    if (nextOptions.length === 0) {
      chains.push(buildChainSummary({ legs, startingCityId: effective.city.id, visitedCityNames }));
      return;
    }

    for (const option of nextOptions) {
      const nextLegs = [...legs, option.payload];
      const nextVisitedCityNames = [...visitedCityNames, option.cargo.destinationCity.name];
      const isCycle = option.cargo.destinationCityId === nextLegs[0].pickupCityId;
      const summary = buildChainSummary({
        legs: nextLegs,
        startingCityId: effective.city.id,
        visitedCityNames: nextVisitedCityNames,
        hasCycle: isCycle
      });

      if (isCycle) {
        chains.push(summary);
        cycles.push(summary);
        continue;
      }

      walk({
        currentCity: option.cargo.destinationCity,
        currentTime: option.deliveryArrival,
        usedCargoIds: new Set([...usedCargoIds, option.cargo.id]),
        visitedCityNames: nextVisitedCityNames,
        legs: nextLegs
      });
    }
  };

  for (const cargo of cargoItems) {
    const firstOption = evaluateCargoForState({
      cargo,
      truck,
      currentCity: effective.city,
      currentTime: effective.time,
      cityRoutes,
      requirePickupInCurrentCity: true
    });

    if (!firstOption.isMatch) {
      continue;
    }

    const visitedCityNames = [effective.city.name, cargo.pickupCity.name, cargo.destinationCity.name];
    const firstLegs = [firstOption.payload];

    if (cargo.destinationCityId === cargo.pickupCityId) {
      const summary = buildChainSummary({
        legs: firstLegs,
        startingCityId: effective.city.id,
        visitedCityNames,
        hasCycle: true
      });
      chains.push(summary);
      cycles.push(summary);
      continue;
    }

    walk({
      currentCity: cargo.destinationCity,
      currentTime: firstOption.deliveryArrival,
      usedCargoIds: new Set([cargo.id]),
      visitedCityNames,
      legs: firstLegs
    });
  }

  const sortChains = (items) =>
    items
      .sort(
        (a, b) =>
          b.cargoCount - a.cargoCount ||
          a.initialEmptyTravelMinutes - b.initialEmptyTravelMinutes ||
          b.totalTravelMinutes - a.totalTravelMinutes
      )
      .slice(0, MAX_CHAINS_TO_RETURN);

  return {
    longestChains: sortChains(chains),
    cycles: sortChains(cycles)
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
    const result = evaluateCargoForState({
      cargo,
      truck,
      currentCity: effective.city,
      currentTime: effective.time,
      cityRoutes,
      requirePickupInCurrentCity: false
    });

    if (result.isMatch) {
      matches.push(result.payload);
    } else {
      rejected.push(result.payload);
    }
  }

  const { longestChains, cycles } = buildChains({ cargoItems, truck, effective, cityRoutes });

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
    longestChains,
    cycles,
    matches,
    rejected
  };
}
