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
    const allocations = await storage.getAllocations();
    res.json(allocations);
  } catch (error) {
    console.error("[Allocations] GET error:", error);
    res.status(500).json({ message: "Failed to fetch allocations" });
  }
});

router.post("/", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { organId, recipientId, courierId, status } = req.body;

    if (!organId || !recipientId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const allocation = await storage.createAllocation({
      organId,
      recipientId,
      courierId,
      matchScore: "1.0",
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
