import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

/**
 * ✅ Handle CORS Preflight Requests
 * Ensures browser OPTIONS checks pass before hitting auth or logic.
 */
router.options("/", (_req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", _req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

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

    // ✅ Basic validation
    if (!organId || !courierId || !startLocation) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Create transport record
    const transport = await storage.createTransport({
      organId,
      courierId,
      startLocation,
      endLocation,
      transportMode: "ground", // required default
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
