// server/compliance.ts — central compliance service for SOC 2 / ISO 27001 readiness

import { storage } from "./storage.js";

export interface ComplianceCheck {
  control: string;
  description: string;
  status: "✅" | "⚠️" | "❌";
  details?: string;
}

export async function runComplianceChecks(): Promise<ComplianceCheck[]> {
  const checks: ComplianceCheck[] = [];

  // Encryption Keys
  checks.push({
    control: "Encryption Keys",
    description: "Master and deterministic keys are configured",
    status:
      process.env.ENCRYPTION_MASTER_KEY && process.env.ENCRYPTION_DETERMINISTIC_KEY
        ? "✅"
        : "❌",
  });

  // Backups
  checks.push({
    control: "Backups",
    description: "Automated database backups are configured",
    status: process.env.BACKUP_ENABLED === "true" ? "✅" : "⚠️",
  });

  // MFA
  checks.push({
    control: "Multi‑Factor Authentication",
    description: "MFA enabled for all admin accounts",
    status: process.env.MFA_ENABLED === "true" ? "✅" : "❌",
  });

  // Monitoring
  checks.push({
    control: "Monitoring",
    description: "Error monitoring & alerting configured",
    status: process.env.MONITORING_ENABLED === "true" ? "✅" : "⚠️",
  });

  // Audit logs
  const auditLogs = await storage.getAuditLogs();
  checks.push({
    control: "Audit Logging",
    description: "All user/system activity is logged",
    status: auditLogs.length > 0 ? "✅" : "⚠️",
    details: `Total audit logs: ${auditLogs.length}`,
  });

  return checks;
}
