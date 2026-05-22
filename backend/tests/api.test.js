import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";

import app from "../src/app.js";
import { prisma } from "../src/prismaClient.js";

afterAll(async () => {
  await prisma.$disconnect();
});

describe("Freight matching API", () => {
  it("returns health status and fixed calculation time", async () => {
    const response = await request(app).get("/api/health").expect(200);

    expect(response.body).toMatchObject({
      status: "ok",
      matchingReferenceTime: "2026-05-21T06:00:00.000Z"
    });
  });

  it("lists cities and includes the static Vaasa to Oulu route", async () => {
    const citiesResponse = await request(app).get("/api/cities").expect(200);
    const routesResponse = await request(app).get("/api/routes").expect(200);

    expect(citiesResponse.body).toHaveLength(7);
    expect(citiesResponse.body.map((city) => city.name)).toEqual(
      expect.arrayContaining(["Vaasa", "Oulu", "Seinäjoki", "Jyväskylä"])
    );

    expect(routesResponse.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          travelTimeMinutes: 270,
          fromCity: expect.objectContaining({ name: "Vaasa" }),
          toCity: expect.objectContaining({ name: "Oulu" })
        }),
        expect.objectContaining({
          travelTimeMinutes: 270,
          fromCity: expect.objectContaining({ name: "Oulu" }),
          toCity: expect.objectContaining({ name: "Vaasa" })
        })
      ])
    );
  });

  it("shows pickup and destination cargo for a selected city", async () => {
    const citiesResponse = await request(app).get("/api/cities").expect(200);
    const vaasa = citiesResponse.body.find((city) => city.name === "Vaasa");

    const detailsResponse = await request(app).get(`/api/cities/${vaasa.id}/details`).expect(200);

    expect(detailsResponse.body.pickupCargo).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: "Electronics pallets",
          destinationCity: expect.objectContaining({ name: "Tampere" })
        }),
        expect.objectContaining({
          name: "Northern medical supplies",
          destinationCity: expect.objectContaining({ name: "Oulu" })
        })
      ])
    );
  });

  it("matches Truck A with feasible cargo and reports reasons", async () => {
    const response = await request(app).get("/api/trucks/1/matches").expect(200);

    expect(response.body.matchingReferenceTime).toBe("2026-05-21T06:00:00.000Z");
    expect(response.body.truck).toMatchObject({
      id: 1,
      name: "Truck A",
      effectiveCity: "Vaasa",
      status: "available"
    });
    expect(response.body.matches.map((match) => match.cargoName)).toEqual(
      expect.arrayContaining(["Electronics pallets", "Food delivery", "Northern medical supplies"])
    );
    expect(response.body.matches).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          cargoName: "Northern medical supplies",
          pickupCity: "Vaasa",
          destinationCity: "Oulu",
          routeToDestinationMinutes: 270,
          reasons: expect.arrayContaining([
            "Cargo is ready for loading",
            "Truck capacity is sufficient",
            "Truck can deliver cargo before delivery window closes"
          ])
        })
      ])
    );
    expect(response.body.rejected.map((rejection) => rejection.cargoName)).toEqual(
      expect.arrayContaining(["Furniture shipment", "Heavy machinery parts"])
    );
  });

  it("rejects all cargo for an unavailable truck", async () => {
    const response = await request(app).get("/api/trucks/4/matches").expect(200);

    expect(response.body.truck).toMatchObject({
      name: "Truck D",
      status: "unavailable"
    });
    expect(response.body.matches).toHaveLength(0);
    expect(response.body.rejected.length).toBeGreaterThan(0);
    expect(response.body.rejected[0].reasons).toContain("Truck status is not available");
  });
});

