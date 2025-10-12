import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import rateLimit from "express-rate-limit";
import { storage as baseStorage } from "./storage.js";
import { createRBACStorage } from "./rbacStorage.js";
import { createManualAuditLog } from "./auditMiddleware.js";
import { enrichUserWithRole } from "./permissionMiddleware.js";
import type { AuthenticatedRequest } from "./types.js";
import type { UserRole } from "../shared/schema.js";
import authenticateToken from "./authMiddleware.js";
import authRoutes from "./authRoutes.js";
import unosService from "./integrations/unosService.js";
import complianceReports from "./complianceReports.js";
import complianceStatus from "./complianceStatus.js";

// ✅ Newly added imports for missing routes
import organRoutes from "./routes/organs.js";
import recipientRoutes from "./routes/recipients.js";
import allocationRoutes from "./routes/allocations.js";
import transportRoutes from "./routes/transports.js";

// ✅ Rate limiter for audit-logs endpoint
const auditLogsRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { message: "Too many requests to audit logs, please try again later." },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // ---------------- AUTH ----------------
  app.use("/api/auth", authRoutes);

  app.get(
    "/api/auth/user",
    authenticateToken,
    enrichUserWithRole,
    async (req: Request, res: Response) => {
      const { user } = req as AuthenticatedRequest;
      const userId = user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      try {
        const storage = createRBACStorage(
          baseStorage,
          (user?.role as UserRole) || "coordinator",
          userId
        );
        const foundUser = await storage.getUser(userId);
        if (foundUser) {
          return res.json(foundUser);
        }

        const minimalUser = {
          id: userId,
          email: user?.claims?.email ?? "unknown@example.com",
          name: user?.claims?.name ?? user?.claims?.email?.split("@")[0] ?? "User",
          role: (user?.role as UserRole) || "coordinator",
        };
        return res.json(minimalUser);
      } catch (error) {
        console.warn("get /api/auth/user fell back to claims:", error);
        const minimalUser = {
          id: userId,
          email: user?.claims?.email ?? "unknown@example.com",
          name: user?.claims?.name ?? user?.claims?.email?.split("@")[0] ?? "User",
          role: (user?.role as UserRole) || "coordinator",
        };
        return res.json(minimalUser);
      }
    }
  );

  // ---------------- ENCRYPTION STATUS ----------------
  app.get("/api/test/encryption-status", async (_req: Request, res: Response) => {
    try {
      const encryptionStatus = {
        encrypted: true,
        algorithm: "AES-256-GCM",
        keyVersion: process.env.ENCRYPTION_KEY_VERSION || "1",
        masterKeyPresent: !!process.env.ENCRYPTION_MASTER_KEY,
        deterministicKeyPresent: !!process.env.ENCRYPTION_DETERMINISTIC_KEY,
        phiFieldsConfigured: {
          donors: ["age", "weight", "height", "medicalHistory", "hlaType", "location"],
          recipients: [
            "firstName",
            "lastName",
            "medicalData",
            "hlaType",
            "antibodies",
            "location",
          ],
          messages: ["content"],
          custodyLogs: ["notes"],
        },
        searchableFields: {
          donors: ["location"],
          recipients: ["firstName", "lastName", "location"],
        },
      };
      res.json(encryptionStatus);
    } catch (error) {
      console.error("Error fetching encryption status:", error);
      res.status(500).json({ message: "Failed to get encryption status" });
    }
  });

  // ---------------- COMPLIANCE ----------------
  app.use("/api/compliance", complianceReports);
  app.use("/api/compliance", complianceStatus);

  // ---------------- CORE FEATURE ROUTES ----------------
  app.use("/api/organs", organRoutes);
  app.use("/api/recipients", recipientRoutes);
  app.use("/api/allocations", allocationRoutes);
  app.use("/api/transports", transportRoutes);

  // ---------------- AUDIT LOGS ----------------
  app.get(
    "/api/audit-logs",
    authenticateToken,
    auditLogsRateLimiter,
    async (req: Request, res: Response) => {
      const { user } = req as AuthenticatedRequest;
      const userId = user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized: Missing user ID" });
      }

      try {
        const storage = createRBACStorage(baseStorage, user.role as UserRole, userId);
        const dbUser = await storage.getUser(userId);
        if (dbUser?.role !== "admin") {
          await createManualAuditLog(req as AuthenticatedRequest, "unauthorized_access", {
            entityType: "auditLogs",
            entityId: "",
            success: false,
            errorMessage: "Forbidden: Admin access required",
            errorCode: "FORBIDDEN",
            phiAccessed: false,
          });
          return res.status(403).json({ message: "Forbidden: Admin access required" });
        }
        const auditLogs = await storage.getAuditLogs({});
        res.json(auditLogs);
      } catch (error) {
        console.error("Error fetching audit logs:", error);
        res.status(500).json({ message: "Failed to fetch audit logs" });
      }
    }
  );

  // ---------------- SERVER ----------------
  const httpServer = createServer(app);
  return httpServer;
}

export default registerRoutes;
