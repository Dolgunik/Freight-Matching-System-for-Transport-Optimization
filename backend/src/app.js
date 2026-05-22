import cors from "cors";
import "dotenv/config";
import express from "express";

import { getMatchingReferenceTimeIso } from "./config/time.js";
import cargoRouter from "./routes/cargo.js";
import citiesRouter from "./routes/cities.js";
import matchesRouter from "./routes/matches.js";
import routesRouter from "./routes/routes.js";
import trucksRouter from "./routes/trucks.js";

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    matchingReferenceTime: getMatchingReferenceTimeIso()
  });
});

app.use("/api/cities", citiesRouter);
app.use("/api/cargo", cargoRouter);
app.use("/api/trucks", trucksRouter);
app.use("/api/routes", routesRouter);
app.use("/api/trucks", matchesRouter);

app.use((req, res) => {
  res.status(404).json({ error: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.use((error, _req, res, _next) => {
  console.error(error);
  res.status(500).json({ error: "Internal server error" });
});

export default app;

