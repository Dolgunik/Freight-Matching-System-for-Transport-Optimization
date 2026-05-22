import { Router } from "express";

import { findMatchesForTruck } from "../services/matchingService.js";

const router = Router();

router.get("/:id/matches", async (req, res, next) => {
  try {
    const result = await findMatchesForTruck(Number(req.params.id));

    if (!result) {
      res.status(404).json({ error: "Truck not found" });
      return;
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

export default router;

