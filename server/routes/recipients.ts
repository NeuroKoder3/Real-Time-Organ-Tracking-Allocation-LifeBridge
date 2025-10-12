import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

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
    if (!firstName || !lastName || !organNeeded) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const recipient = await storage.createRecipient({
      firstName,
      lastName,
      bloodType,
      organNeeded,
      hospital,
    });

    res.status(201).json(recipient);
  } catch (error) {
    console.error("[Recipients] POST error:", error);
    res.status(500).json({ message: "Failed to add recipient" });
  }
});

export default router;
