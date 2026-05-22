import { Router } from "express";

import { prisma } from "../prismaClient.js";

const router = Router();

router.get("/", async (_req, res, next) => {
  try {
    const routes = await prisma.cityRoute.findMany({
      include: {
        fromCity: true,
        toCity: true
      },
      orderBy: [{ fromCityId: "asc" }, { toCityId: "asc" }]
    });

    res.json(routes);
  } catch (error) {
    next(error);
  }
});

export default router;

