import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

/**
 * GET /api/allocations
 * → Retrieve all organ allocations
 */
router.get("/", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const allocations = await storage.getAllocations();
    res.json(allocations);
  } catch (error) {
    console.error("[Allocations] GET error:", error);
    res.status(500).json({ message: "Failed to fetch allocations" });
  }
});

/**
 * POST /api/allocations
 * → Create a new allocation record
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { organId, recipientId, courierId, status } = req.body;
    if (!organId || !recipientId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const allocation = await storage.createAllocation({
      organId,
      recipientId,
      courierId,
      status: status ?? "pending",
    });

    res.status(201).json(allocation);
  } catch (error) {
    console.error("[Allocations] POST error:", error);
    res.status(500).json({ message: "Failed to create allocation" });
  }
});

export default router;
