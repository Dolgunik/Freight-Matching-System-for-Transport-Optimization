import { Router } from "express";

import { prisma } from "../prismaClient.js";

const router = Router();

const truckInclude = {
  parkingCity: true,
  arrivalCity: true
};

router.get("/", async (_req, res, next) => {
  try {
    const trucks = await prisma.truck.findMany({
      include: truckInclude,
      orderBy: { id: "asc" }
    });

    res.json(trucks);
  } catch (error) {
    next(error);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const {
      name,
      parkingCityId,
      isMoving = false,
      arrivalCityId,
      arrivalDatetime,
      capacityKg,
      status
    } = req.body;

    const truck = await prisma.truck.create({
      data: {
        name,
        parkingCityId: Number(parkingCityId),
        isMoving: Boolean(isMoving),
        arrivalCityId: arrivalCityId ? Number(arrivalCityId) : null,
        arrivalDatetime: arrivalDatetime ? new Date(arrivalDatetime) : null,
        capacityKg: Number(capacityKg),
        status
      },
      include: truckInclude
    });

    res.status(201).json(truck);
  } catch (error) {
    next(error);
  }
});

export default router;

