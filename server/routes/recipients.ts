import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

/**
 * ✅ Handle CORS Preflight Requests
 * Ensures OPTIONS requests from browsers pass before auth checks.
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
 * GET /api/recipients
 * → List all registered recipients
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
 * → Add a new recipient
 */
router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, bloodType, organNeeded, hospital } = req.body;

    // ✅ Basic field validation
    if (!firstName || !lastName || !organNeeded) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Create a new recipient record
    const recipient = await storage.createRecipient({
      firstName,
      lastName,
      bloodType,
      organNeeded,
      hospital,
      location: "Unknown",       // required by schema
      urgencyStatus: "medium",   // required default
      waitlistDate: new Date(),  // required timestamp
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
