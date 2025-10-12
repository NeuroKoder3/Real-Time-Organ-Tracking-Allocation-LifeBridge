import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

/**
 * GET /api/organs
 * Returns all registered organs
 */
router.get("/", authenticateToken, async (_req, res) => {
  try {
    const organs = await storage.getOrgans?.() ?? [];
    res.json(organs);
  } catch (error) {
    console.error("Error fetching organs:", error);
    res.status(500).json({ message: "Failed to load organs" });
  }
});

/**
 * POST /api/organs
 * Registers a new organ
 */
router.post("/", authenticateToken, async (req, res) => {
  try {
    const organ = await storage.createOrgan?.(req.body);
    res.status(201).json(organ);
  } catch (error) {
    console.error("Error creating organ:", error);
    res.status(500).json({ message: "Failed to register organ" });
  }
});

export default router;
