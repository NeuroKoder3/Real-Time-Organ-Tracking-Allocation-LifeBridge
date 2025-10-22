import { Router } from "express";
import type { Router as ExpressRouter, Request, Response } from "express";
import authenticateToken from "../authMiddleware.js";
import { storage } from "../storage.js";

const router: ExpressRouter = Router();

router.options("/", (req: Request, res: Response) => {
  const origin = req.headers.origin;
  if (origin) res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization"
  );
  res.sendStatus(204);
});

router.get("/", authenticateToken, async (_req: Request, res: Response) => {
  try {
    const recipients = await storage.getRecipients();
    res.json(recipients);
  } catch (error) {
    console.error("[Recipients] GET error:", error);
    res.status(500).json({ message: "Failed to fetch recipients" });
  }
});

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
      location: "Unknown",
      urgencyStatus: "medium",
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
