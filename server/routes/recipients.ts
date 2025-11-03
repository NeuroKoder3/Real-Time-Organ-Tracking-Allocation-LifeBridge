import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken, {
  AuthenticatedRequest,
} from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

// CORS middleware for all requests on this router
router.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin;
  // Define a whitelist of allowed origins
  const allowedOrigins = [
    "https://your-frontend.com",
    // Add other allowed origins as needed
  ];
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  // Do not set Access-Control-Allow-Origin if origin is not trusted
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
 * GET /api/recipients
 */
router.get("/", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const recipients = await storage.getRecipients();
    res.json(recipients);
  } catch (error) {
    console.error("[Recipients] GET error:", error);
    res.status(500).json({ message: "Failed to fetch recipients" });
  }
});

/**
 * POST /api/recipients
 */
router.post("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { firstName, lastName, bloodType, organNeeded, hospital } = req.body;

    if (!firstName || !lastName || !organNeeded) {
      return res
        .status(400)
        .json({ message: "Missing required fields: firstName, lastName, organNeeded" });
    }

    // Optional: restrict access based on user role
    if (!["admin", "coordinator"].includes(req.user?.role || "")) {
      return res.status(403).json({ message: "Insufficient permissions" });
    }

    const recipient = await storage.createRecipient({
      firstName,
      lastName,
      bloodType,
      organNeeded,
      hospital,
      location: "Unknown", // can be improved with actual geolocation later
      urgencyStatus: "medium", // default urgency
      waitlistDate: new Date(),
    });

    res.status(201).json({
      message: "Recipient successfully added",
      recipient,
    });
  } catch (error) {
    console.error("[Recipients] POST error:", error);
    res.status(500).json({ message: "Failed to add recipient" });
  }
});

export default router;
