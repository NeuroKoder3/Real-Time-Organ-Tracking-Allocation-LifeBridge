import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

router.options("/", (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.sendStatus(204);
});

router.get("/", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const transports = await storage.getTransports();
    res.json(transports);
  } catch (error) {
    console.error("[Transports] GET error:", error);
    res.status(500).json({ message: "Failed to fetch transports" });
  }
});

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { organId, courierId, startLocation, endLocation, status } = req.body;

    if (!organId || !courierId || !startLocation) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const transport = await storage.createTransport({
      organId,
      courierId,
      startLocation,
      endLocation,
      transportMode: "ground",
      status: status ?? "scheduled",
    });

    res.status(201).json({
      message: "Transport record successfully created",
      transport,
    });
  } catch (error) {
    console.error("[Transports] POST error:", error);
    res.status(500).json({ message: "Failed to create transport record" });
  }
});

export default router;
