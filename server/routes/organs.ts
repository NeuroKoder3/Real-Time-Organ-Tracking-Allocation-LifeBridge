import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

/**
 * GET /api/organs
 * → List all organs in storage
 */
router.get("/", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const organs = await storage.getOrgans();
    res.json(organs);
  } catch (error) {
    console.error("[Organs] GET error:", error);
    res.status(500).json({ message: "Failed to fetch organs" });
  }
});

/**
 * POST /api/organs
 * → Register a new organ
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { donorId, organType, bloodType, condition, location } = req.body;
    if (!organType || !donorId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const organ = await storage.createOrgan({
      donorId,
      organType,
      bloodType,
      condition,
      location,
    });

    res.status(201).json(organ);
  } catch (error) {
    console.error("[Organs] POST error:", error);
    res.status(500).json({ message: "Failed to register organ" });
  }
});

export default router;
