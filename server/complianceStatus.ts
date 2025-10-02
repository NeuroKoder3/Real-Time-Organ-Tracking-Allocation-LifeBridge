// server/complianceStatus.ts
// Endpoint to check system readiness

import { Router, type Request, type Response } from "express";

// Be compatible with either a named or default export from ./compliance
import * as complianceModule from "./compliance.js";
const runComplianceChecks: () => Promise<unknown> =
  (complianceModule as any).runComplianceChecks ??
  (complianceModule as any).default;

const router: Router = Router(); // Explicit type

router.get("/status", async (_req: Request, res: Response) => {
  try {
    if (typeof runComplianceChecks !== "function") {
      throw new Error(
        "runComplianceChecks export not found in ./compliance.js (expected named export `runComplianceChecks` or a default function export)."
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
