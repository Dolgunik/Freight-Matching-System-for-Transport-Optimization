import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const cityData = [
  { name: "Vaasa", country: "Finland", mapX: 16, mapY: 34 },
  { name: "Seinäjoki", country: "Finland", mapX: 28, mapY: 43 },
  { name: "Tampere", country: "Finland", mapX: 45, mapY: 58 },
  { name: "Helsinki", country: "Finland", mapX: 67, mapY: 80 },
  { name: "Turku", country: "Finland", mapX: 39, mapY: 82 },
  { name: "Jyväskylä", country: "Finland", mapX: 58, mapY: 48 },
  { name: "Oulu", country: "Finland", mapX: 63, mapY: 12 }
];

const routeData = [
  ["Vaasa", "Seinäjoki", 80, 75],
  ["Seinäjoki", "Tampere", 180, 135],
  ["Tampere", "Helsinki", 180, 135],
  ["Tampere", "Turku", 165, 120],
  ["Tampere", "Jyväskylä", 150, 90],
  ["Jyväskylä", "Oulu", 340, 240],
  ["Vaasa", "Oulu", 320, 270]
];

const date = (value) => new Date(value);

async function main() {
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "Cargo", "Truck", "CityRoute", "City" RESTART IDENTITY CASCADE');

  const cities = {};

  for (const city of cityData) {
    const created = await prisma.city.create({ data: city });
    cities[city.name] = created;
  }

  for (const [from, to, distanceKm, travelTimeMinutes] of routeData) {
    await prisma.cityRoute.createMany({
      data: [
        {
          fromCityId: cities[from].id,
          toCityId: cities[to].id,
          distanceKm,
          travelTimeMinutes
        },
        {
          fromCityId: cities[to].id,
          toCityId: cities[from].id,
          distanceKm,
          travelTimeMinutes
        }
      ]
    });
  }

  await prisma.cargo.createMany({
    data: [
      {
        name: "Electronics pallets",
        pickupCityId: cities.Vaasa.id,
        destinationCityId: cities.Tampere.id,
        weightKg: 8000,
        pickupWindowStart: date("2026-05-21T10:00:00+03:00"),
        pickupWindowEnd: date("2026-05-21T15:00:00+03:00"),
        deliveryWindowEnd: date("2026-05-21T20:00:00+03:00"),
        status: "ready_for_loading"
      },
      {
        name: "Furniture shipment",
        pickupCityId: cities.Tampere.id,
        destinationCityId: cities.Helsinki.id,
        weightKg: 5000,
        pickupWindowStart: date("2026-05-21T12:00:00+03:00"),
        pickupWindowEnd: date("2026-05-21T18:00:00+03:00"),
        deliveryWindowEnd: date("2026-05-22T12:00:00+03:00"),
        status: "preparing"
      },
      {
        name: "Food delivery",
        pickupCityId: cities["Seinäjoki"].id,
        destinationCityId: cities.Helsinki.id,
        weightKg: 3000,
        pickupWindowStart: date("2026-05-21T11:00:00+03:00"),
        pickupWindowEnd: date("2026-05-21T16:00:00+03:00"),
        deliveryWindowEnd: date("2026-05-21T23:00:00+03:00"),
        status: "ready_for_loading"
      },
      {
        name: "Heavy machinery parts",
        pickupCityId: cities.Turku.id,
        destinationCityId: cities.Tampere.id,
        weightKg: 15000,
        pickupWindowStart: date("2026-05-21T09:00:00+03:00"),
        pickupWindowEnd: date("2026-05-21T17:00:00+03:00"),
        deliveryWindowEnd: date("2026-05-22T10:00:00+03:00"),
        status: "ready_for_loading"
      },
      {
        name: "Northern medical supplies",
        pickupCityId: cities.Vaasa.id,
        destinationCityId: cities.Oulu.id,
        weightKg: 4000,
        pickupWindowStart: date("2026-05-21T09:30:00+03:00"),
        pickupWindowEnd: date("2026-05-21T16:30:00+03:00"),
        deliveryWindowEnd: date("2026-05-21T22:00:00+03:00"),
        status: "ready_for_loading"
      },
      {
        name: "Book cartons",
        pickupCityId: cities.Tampere.id,
        destinationCityId: cities.Helsinki.id,
        weightKg: 4000,
        pickupWindowStart: date("2026-05-21T13:30:00+03:00"),
        pickupWindowEnd: date("2026-05-21T18:30:00+03:00"),
        deliveryWindowEnd: date("2026-05-21T23:00:00+03:00"),
        status: "ready_for_loading"
      },
      {
        name: "Hospital supplies",
        pickupCityId: cities.Helsinki.id,
        destinationCityId: cities["Jyväskylä"].id,
        weightKg: 3500,
        pickupWindowStart: date("2026-05-21T16:00:00+03:00"),
        pickupWindowEnd: date("2026-05-21T20:00:00+03:00"),
        deliveryWindowEnd: date("2026-05-22T01:00:00+03:00"),
        status: "ready_for_loading"
      },
      {
        name: "Paper reels",
        pickupCityId: cities["Jyväskylä"].id,
        destinationCityId: cities.Oulu.id,
        weightKg: 5000,
        pickupWindowStart: date("2026-05-21T19:30:00+03:00"),
        pickupWindowEnd: date("2026-05-21T23:00:00+03:00"),
        deliveryWindowEnd: date("2026-05-22T04:00:00+03:00"),
        status: "ready_for_loading"
      },
      {
        name: "Return components",
        pickupCityId: cities.Oulu.id,
        destinationCityId: cities.Vaasa.id,
        weightKg: 4500,
        pickupWindowStart: date("2026-05-21T23:30:00+03:00"),
        pickupWindowEnd: date("2026-05-22T02:00:00+03:00"),
        deliveryWindowEnd: date("2026-05-22T07:00:00+03:00"),
        status: "ready_for_loading"
      },
      {
        name: "Spare parts",
        pickupCityId: cities.Turku.id,
        destinationCityId: cities.Vaasa.id,
        weightKg: 6000,
        pickupWindowStart: date("2026-05-21T11:00:00+03:00"),
        pickupWindowEnd: date("2026-05-21T19:00:00+03:00"),
        deliveryWindowEnd: date("2026-05-22T03:00:00+03:00"),
        status: "ready_for_loading"
      }
    ]
  });

  await prisma.truck.createMany({
    data: [
      {
        name: "Truck A",
        parkingCityId: cities.Vaasa.id,
        isMoving: false,
        capacityKg: 10000,
        status: "available"
      },
      {
        name: "Truck B",
        parkingCityId: cities["Seinäjoki"].id,
        isMoving: true,
        arrivalCityId: cities.Tampere.id,
        arrivalDatetime: date("2026-05-21T14:00:00+03:00"),
        capacityKg: 12000,
        status: "available"
      },
      {
        name: "Truck C",
        parkingCityId: cities.Turku.id,
        isMoving: false,
        capacityKg: 7000,
        status: "available"
      },
      {
        name: "Truck D",
        parkingCityId: cities.Helsinki.id,
        isMoving: false,
        capacityKg: 20000,
        status: "unavailable"
      }
    ]
  });
}

main()
  .then(async () => {
    console.log("Database seeded successfully.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
