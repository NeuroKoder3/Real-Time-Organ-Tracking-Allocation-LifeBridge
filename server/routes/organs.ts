// server/routes/organs.ts

import { Router, type Request, type Response, type RequestHandler } from "express";
import authenticateToken, { AuthenticatedRequest } from "../authMiddleware.js";
import { storage } from "../storage.js";
import csurf from "csurf";

const router = Router();

/* ---------------------------------------------------------
   ✅ Setup CSRF Protection Middleware
--------------------------------------------------------- */
const csrfProtection = csurf({
  cookie: {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    secure: process.env.NODE_ENV === "production",
  },
}) as unknown as RequestHandler;

// ✅ Apply CSRF protection to all routes in this router
router.use(csrfProtection);

/* ---------------------------------------------------------
   ✅ Global CORS Middleware
--------------------------------------------------------- */
router.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/* ---------------------------------------------------------
   ✅ GET /api/organs
--------------------------------------------------------- */
router.get("/", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const organs = await storage.getOrgans();
    res.json(organs);
  } catch (error) {
    console.error("[Organs] GET error:", error);
    res.status(500).json({ message: "Failed to fetch organs" });
  }
});

/* ---------------------------------------------------------
   ✅ POST /api/organs
--------------------------------------------------------- */
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
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

    if (!donorId || !organType || !bloodType) {
      return res
        .status(400)
        .json({ message: "Missing required fields: donorId, organType, bloodType" });
    }

    // ✅ Fix: pull role from claims fallback if needed
    const userRole = req.user?.role || req.user?.claims?.role;

    if (!["admin", "coordinator"].includes(userRole || "")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    console.log("[Organs] Authenticated user:", req.user);

    const resolvedViabilityHours = viabilityHours ? Number(viabilityHours) : 12;
    const resolvedPreservationStartTime = preservationStartTime
      ? new Date(preservationStartTime)
      : new Date();
    const resolvedViabilityDeadline = viabilityDeadline
      ? new Date(viabilityDeadline)
      : new Date(
          resolvedPreservationStartTime.getTime() +
            resolvedViabilityHours * 60 * 60 * 1000
        );

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

/* ---------------------------------------------------------
   ✅ PUT /api/organs
--------------------------------------------------------- */
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
