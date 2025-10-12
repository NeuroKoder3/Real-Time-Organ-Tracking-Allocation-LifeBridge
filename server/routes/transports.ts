import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

/**
 * GET /api/transports
 * → Get all transport events (deliveries in progress or completed)
 */
router.get("/", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const transports = await storage.getTransports();
    res.json(transports);
  } catch (error) {
    console.error("[Transports] GET error:", error);
    res.status(500).json({ message: "Failed to fetch transports" });
  }
});

/**
 * POST /api/transports
 * → Create a new transport record
 */
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
      status: status ?? "in_transit",
    });

    res.status(201).json(transport);
  } catch (error) {
    console.error("[Transports] POST error:", error);
    res.status(500).json({ message: "Failed to create transport record" });
  }
});

export default router;
