import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

/**
 * ✅ Handle CORS Preflight Requests
 * Ensures OPTIONS requests from browsers are handled before auth middleware.
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

    // ✅ Required field validation
    if (!organId || !recipientId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Create allocation record
    const allocation = await storage.createAllocation({
      organId,
      recipientId,
      courierId,
      matchScore: "1.0", // required by schema
      status: status ?? "proposed",
    });

    res.status(201).json({
      message: "Allocation successfully created",
      allocation,
    });
  } catch (error) {
    console.error("[Allocations] POST error:", error);
    res.status(500).json({ message: "Failed to create allocation" });
  }
});

export default router;
