import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

/**
 * ✅ Handle CORS Preflight Requests for this route
 * Allows browsers to complete OPTIONS preflight successfully.
 */
router.options("/", (_req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", _req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

/**
 * GET /api/organs
 * → Retrieve all organs from database
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
 * → Create a new organ record
 * Required fields per schema:
 * - donorId
 * - organType
 * - bloodType
 * - viabilityHours
 * - preservationStartTime
 * - viabilityDeadline
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const {
      donorId,
      organType,
      bloodType,
      condition,
      viabilityHours,
      preservationStartTime,
      viabilityDeadline,
      currentLocation,
      temperature,
      preservationSolution,
      qualityScore,
      biopsyResults,
      crossmatchData,
    } = req.body;

    // ✅ Validate required schema fields
    if (!donorId || !organType || !bloodType) {
      return res
        .status(400)
        .json({ message: "Missing required fields: donorId, organType, bloodType" });
    }

    // ✅ Safe defaults to match non-null constraints
    const resolvedViabilityHours = viabilityHours
      ? Number(viabilityHours)
      : 12;

    const resolvedPreservationStartTime = preservationStartTime
      ? new Date(preservationStartTime)
      : new Date();

    const resolvedViabilityDeadline = viabilityDeadline
      ? new Date(viabilityDeadline)
      : new Date(
          resolvedPreservationStartTime.getTime() +
            resolvedViabilityHours * 60 * 60 * 1000
        );

    // ✅ Create a new organ record (aligned to schema)
    const organ = await storage.createOrgan({
      donorId,
      organType,
      bloodType,
      condition: condition ?? "healthy",
      status: "available",
      viabilityHours: resolvedViabilityHours,
      preservationStartTime: resolvedPreservationStartTime,
      viabilityDeadline: resolvedViabilityDeadline,
      currentLocation: currentLocation ?? "Unknown",
      temperature: temperature ?? 4.0,
      preservationSolution: preservationSolution ?? "UW Solution",
      qualityScore: qualityScore ?? "A",
      biopsyResults: biopsyResults ?? {},
      crossmatchData: crossmatchData ?? {},
    });

    res.status(201).json({
      message: "Organ successfully created",
      organ,
    });
  } catch (error) {
    console.error("[Organs] POST error:", error);
    res.status(500).json({ message: "Failed to create organ" });
  }
});

/**
 * ✅ Handle CORS Preflight for PUT route
 */
router.options("/", (_req: Request, res: Response) => {
  res.setHeader("Access-Control-Allow-Origin", _req.headers.origin || "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,POST,PUT,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.sendStatus(204);
});

/**
 * PUT /api/organs
 * → Update an existing organ
 * Accepts partial updates for any writable field in the schema.
 */
router.put("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { id, ...updates } = req.body;

    if (!id) {
      return res.status(400).json({ message: "Missing organ ID for update" });
    }

    const organ = await storage.updateOrgan(id, updates);
    if (!organ) {
      return res.status(404).json({ message: "Organ not found" });
    }

    res.json({ message: "Organ updated successfully", organ });
  } catch (error) {
    console.error("[Organs] PUT error:", error);
    res.status(500).json({ message: "Failed to update organ" });
  }
});

export default router;
