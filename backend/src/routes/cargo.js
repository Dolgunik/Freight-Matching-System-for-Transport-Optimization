import { Router } from "express";

import { prisma } from "../prismaClient.js";

const router = Router();

const cargoInclude = {
  pickupCity: true,
  destinationCity: true
};

router.get("/", async (_req, res, next) => {
  try {
    const cargo = await prisma.cargo.findMany({
      include: cargoInclude,
      orderBy: { id: "asc" }
    });

    res.json(cargo);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      pickupCityId,
      destinationCityId,
      weightKg,
      pickupWindowStart,
      pickupWindowEnd,
      deliveryWindowEnd,
      status
    } = req.body;

    const cargo = await prisma.cargo.create({
      data: {
        name,
        pickupCityId: Number(pickupCityId),
        destinationCityId: Number(destinationCityId),
        weightKg: Number(weightKg),
        pickupWindowStart: new Date(pickupWindowStart),
        pickupWindowEnd: new Date(pickupWindowEnd),
        deliveryWindowEnd: new Date(deliveryWindowEnd),
        status
      },
      include: cargoInclude
    });

    res.status(201).json(cargo);
  } catch (error) {
    next(error);
  }
});

export default router;

