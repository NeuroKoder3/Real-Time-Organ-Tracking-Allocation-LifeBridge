// server/complianceReports.ts
// Endpoint to export reports for auditors

import { Router, type Request, type Response } from "express";

// Be compatible with either `export const storage` or `export default storage`
import * as storageModule from "./storage.js";
const storage = (storageModule as any).storage ?? (storageModule as any).default;

const router: Router = Router(); // Explicit type

router.get("/reports", async (_req: Request, res: Response) => {
  try {
    const [auditLogs, authAuditLogs] = await Promise.all([
      storage.getAuditLogs(),
      storage.getAuthAuditLogs(),
    ]);

    res.json({
      generatedAt: new Date().toISOString(),
      auditLogs,
      authAuditLogs,
    });
  } catch (err) {
    console.error("Error generating compliance report:", err);
    res.status(500).json({ message: "Failed to generate compliance report" });
  }
});

export default router;
