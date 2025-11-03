import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import authenticateToken, {
  AuthenticatedRequest,
} from "../authMiddleware.js";
import { storage } from "../storage.js";

// Set up rate limiter: max 100 requests per 15 minutes per IP
const allocationsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true, // Return rate limit info in the RateLimit-* headers
  legacyHeaders: false, // Disable the X-RateLimit-* headers
});

const router: ExpressRouter = Router();

router.use(allocationsLimiter);

// Global CORS middleware
router.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

/**
 * GET /api/allocations
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
 */
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { organId, recipientId, courierId, status } = req.body;

    if (!organId || !recipientId) {
      return res
        .status(400)
        .json({ message: "Missing required fields: organId, recipientId" });
    }

    // Optional: restrict access based on user role
    if (!["admin", "coordinator"].includes(req.user?.role || "")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    console.log("[Allocations] Creating by user:", req.user);

    const allocation = await storage.createAllocation({
      organId,
      recipientId,
      courierId,
      matchScore: "1.0", // Placeholder for future AI logic
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
