// server/complianceStatus.ts
import { Router, type Request, type Response } from "express";
import { runComplianceChecks } from "./compliance.js";


const router: Router = Router();

router.get("/status", async (_req: Request, res: Response) => {
  try {
    if (typeof runComplianceChecks !== "function") {
      throw new Error(
        "runComplianceChecks is not a function. Expected a named export."
      );
    }

    const results = await runComplianceChecks();

    res.json({
      timestamp: new Date().toISOString(),
      checks: results,
    });
  } catch (err) {
    console.error("Compliance status error:", err);
    res.status(500).json({ message: "Failed to run compliance checks" });
  }
});

export default router;
