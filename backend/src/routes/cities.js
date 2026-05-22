import { Router } from "express";

import { prisma } from "../prismaClient.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const cities = await prisma.city.findMany({
      orderBy: { name: "asc" }
    });

    res.json(cities);
  } catch (error) {
    next(error);
  }
});

router.get("/:id/details", async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    const city = await prisma.city.findUnique({
      where: { id },
      include: {
        outgoingRoutes: {
          include: { toCity: true },
          orderBy: { travelTimeMinutes: "asc" }
        },
        pickupCargo: {
          include: { destinationCity: true },
          orderBy: { id: "asc" }
        },
        parkedTrucks: {
          orderBy: { id: "asc" }
        }
      }
    });

    if (!city) {
      res.status(404).json({ error: "City not found" });
      return;
    }

    res.json(city);
  } catch (error) {
    next(error);
  }
});

export default router;

