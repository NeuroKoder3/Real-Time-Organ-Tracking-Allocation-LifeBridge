import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";

import { storage as baseStorage } from "./storage.js";
import { createRBACStorage } from "./rbacStorage.js";
import { createManualAuditLog } from "./auditMiddleware.js";
import { enrichUserWithRole, withPermissions } from "./permissionMiddleware.js";
import type { AuthenticatedRequest } from "./types.js";
import type { UserRole } from "../shared/schema.js";

import { authenticateToken } from "./authMiddleware.js";
import authRoutes from "./authRoutes.js";
import { unosService } from "./integrations/unosService.js";
import complianceReports from "./complianceReports.js";
import complianceStatus from "./complianceStatus.js";

// ---------------------------------------------------------
// Register all routes
// ---------------------------------------------------------
export async function registerRoutes(app: Express): Promise<Server> {
  // -----------------------
  // Auth routes
  // -----------------------
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
          userId,
        );
        const foundUser = await storage.getUser(userId);
        if (foundUser) {
          return res.json(foundUser);
        }

        const minimalUser = {
          id: userId,
          email: user?.claims?.email ?? "unknown@example.com",
          name:
            user?.claims?.name ??
            user?.claims?.email?.split("@")[0] ??
            "User",
          role: (user?.role as UserRole) || "coordinator",
        };
        return res.json(minimalUser);
      } catch (error) {
        console.warn("get /api/auth/user fell back to claims:", error);
        const minimalUser = {
          id: userId,
          email: user?.claims?.email ?? "unknown@example.com",
          name:
            user?.claims?.name ??
            user?.claims?.email?.split("@")[0] ??
            "User",
          role: (user?.role as UserRole) || "coordinator",
        };
        return res.json(minimalUser);
      }
    },
  );

  // -----------------------
  // Encryption status
  // -----------------------
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
          recipients: ["firstName", "lastName", "medicalData", "hlaType", "antibodies", "location"],
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

  // -----------------------
  // Compliance routes
  // -----------------------
  app.use("/api/compliance", complianceReports);
  app.use("/api/compliance", complianceStatus);

  // -----------------------
  // Organ routes
  // -----------------------
  app.get(
    "/api/organs",
    authenticateToken,
    ...withPermissions("organs", "read"),
    async (req: Request, res: Response) => {
      try {
        const { user } = req as AuthenticatedRequest;
        const storage = createRBACStorage(baseStorage, user?.role as UserRole, user?.claims?.sub);
        const organs = await storage.getOrgans();
        res.json(organs);
      } catch (error) {
        console.error("Error fetching organs:", error);
        res.status(500).json({ message: "Failed to fetch organs" });
      }
    },
  );

  app.get(
    "/api/organs/:id",
    authenticateToken,
    ...withPermissions("organs", "read"),
    async (req: Request, res: Response) => {
      try {
        const { user } = req as AuthenticatedRequest;
        const storage = createRBACStorage(baseStorage, user?.role as UserRole, user?.claims?.sub);
        const organ = await storage.getOrgan(req.params.id);
        if (!organ) {
          return res.status(404).json({ message: "Organ not found" });
        }
        res.json(organ);
      } catch (error) {
        console.error("Error fetching organ:", error);
        res.status(500).json({ message: "Failed to fetch organ" });
      }
    },
  );

  app.post(
    "/api/organs",
    authenticateToken,
    ...withPermissions("organs", "create"),
    async (req: Request, res: Response) => {
      try {
        const { user } = req as AuthenticatedRequest;
        const storage = createRBACStorage(baseStorage, user?.role as UserRole, user?.claims?.sub);

        const data = {
          ...req.body,
          viabilityDeadline: new Date(Date.now() + req.body.viabilityHours * 60 * 60 * 1000).toISOString(),
          preservationStartTime: req.body.preservationStartTime || new Date().toISOString(),
        };

        const organ = await storage.createOrgan(data);
        res.json(organ);
      } catch (error) {
        console.error("Error creating organ:", error);
        res.status(500).json({ message: "Failed to create organ" });
      }
    },
  );

  app.put(
    "/api/organs/:id",
    authenticateToken,
    ...withPermissions("organs", "update"),
    async (req: Request, res: Response) => {
      try {
        const { user } = req as AuthenticatedRequest;
        const storage = createRBACStorage(baseStorage, user?.role as UserRole, user?.claims?.sub);
        const organ = await storage.updateOrgan(req.params.id, req.body);
        res.json(organ);
      } catch (error) {
        console.error("Error updating organ:", error);
        res.status(500).json({ message: "Failed to update organ" });
      }
    },
  );

  app.delete(
    "/api/organs/:id",
    authenticateToken,
    ...withPermissions("organs", "delete"),
    async (req: Request, res: Response) => {
      try {
        const { user } = req as AuthenticatedRequest;
        const storage = createRBACStorage(baseStorage, user?.role as UserRole, user?.claims?.sub);
        await storage.updateOrgan(req.params.id, { status: "discarded" });
        res.json({ success: true });
      } catch (error) {
        console.error("Error deleting organ:", error);
        res.status(500).json({ message: "Failed to delete organ" });
      }
    },
  );

  // -----------------------
  // Recipient routes
  // -----------------------
  app.get(
    "/api/recipients",
    authenticateToken,
    ...withPermissions("recipients", "read"),
    async (req: Request, res: Response) => {
      try {
        const { user } = req as AuthenticatedRequest;
        const storage = createRBACStorage(baseStorage, user?.role as UserRole, user?.claims?.sub);
        const recipients = await storage.getRecipients();
        res.json(recipients);
      } catch (error) {
        console.error("Error fetching recipients:", error);
        res.status(500).json({ message: "Failed to fetch recipients" });
      }
    },
  );

  app.post(
    "/api/recipients",
    authenticateToken,
    ...withPermissions("recipients", "create"),
    async (req: Request, res: Response) => {
      try {
        const { user } = req as AuthenticatedRequest;
        const storage = createRBACStorage(baseStorage, user?.role as UserRole, user?.claims?.sub);

        const data = {
          firstName: req.body.name?.split(" ")[0] || req.body.firstName,
          lastName: req.body.name?.split(" ").slice(1).join(" ") || req.body.lastName,
          unosId: req.body.medicalId || req.body.unosId,
          bloodType: req.body.bloodType,
          organNeeded: req.body.organNeeded,
          urgencyStatus: req.body.urgencyLevel || req.body.urgencyStatus || "3",
          waitlistDate: req.body.waitListDate || req.body.waitlistDate || new Date().toISOString(),
          location: req.body.hospital || req.body.location,
          hospitalId: req.body.hospitalId,
          medicalData: {
            conditions: req.body.medicalConditions,
            compatibilityScore: req.body.compatibilityScore,
          },
          hlaType: req.body.hlaMarkers ? { markers: req.body.hlaMarkers } : null,
          status: req.body.status || "waiting",
        };

        const recipient = await storage.createRecipient(data);
        res.json(recipient);
      } catch (error) {
        console.error("Error creating recipient:", error);
        res.status(500).json({ message: "Failed to create recipient" });
      }
    },
  );

  app.put("/api/recipients/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      const recipient = await baseStorage.updateRecipient(req.params.id, req.body);
      res.json(recipient);
    } catch (error) {
      console.error("Error updating recipient:", error);
      res.status(500).json({ message: "Failed to update recipient" });
    }
  });

  app.delete("/api/recipients/:id", authenticateToken, async (req: Request, res: Response) => {
    try {
      await baseStorage.updateRecipient(req.params.id, { status: "inactive" });
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting recipient:", error);
      res.status(500).json({ message: "Failed to delete recipient" });
    }
  });

  // -----------------------
  // Allocation routes
  // -----------------------
  app.get("/api/allocations", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const allocations = await baseStorage.getAllocations();
      res.json(allocations);
    } catch (error) {
      console.error("Error fetching allocations:", error);
      res.status(500).json({ message: "Failed to fetch allocations" });
    }
  });

  app.post("/api/allocations", authenticateToken, async (req: Request, res: Response) => {
    try {
      const data = {
        ...req.body,
        matchScore: req.body.matchScore?.toString() || "0",
        compatibilityData: req.body.compatibilityData || {},
        status: "proposed",
      };

      const allocation = await baseStorage.createAllocation(data);
      await baseStorage.updateOrgan(data.organId, { status: "matched" });

      const unosResponse = await unosService.sendAllocationRequest({
        organId: data.organId,
        recipientId: data.recipientId,
        matchScore: parseFloat(data.matchScore || "0"),
      });

      res.json({ allocation, unosResponse });
    } catch (error) {
      console.error("Error creating allocation:", error);
      res.status(500).json({ message: "Failed to create allocation" });
    }
  });

  // -----------------------
  // Transport routes
  // -----------------------
  app.get("/api/transports", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const transports = await baseStorage.getTransports();
      res.json(transports);
    } catch (error) {
      console.error("Error fetching transports:", error);
      res.status(500).json({ message: "Failed to fetch transports" });
    }
  });

  // -----------------------
  // Messages
  // -----------------------
  app.get("/api/messages", authenticateToken, async (req: Request, res: Response) => {
    try {
      const messages = await baseStorage.getMessages(
        req.query.allocationId as string,
        req.query.transportId as string,
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // -----------------------
  // Metrics
  // -----------------------
  app.get("/api/metrics", authenticateToken, async (req: Request, res: Response) => {
    try {
      const metrics = await baseStorage.getMetrics(req.query.period as string);
      res.json(metrics);
    } catch (error) {
      console.error("Error fetching metrics:", error);
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // -----------------------
  // Donors (legacy)
  // -----------------------
  app.get("/api/donors", authenticateToken, async (_req: Request, res: Response) => {
    try {
      const donors = await baseStorage.getDonors();
      res.json(donors);
    } catch (error) {
      console.error("Error fetching donors:", error);
      res.status(500).json({ message: "Failed to fetch donors" });
    }
  });

  // -----------------------
  // Audit logs
  // -----------------------
  app.get("/api/audit-logs", authenticateToken, async (req: Request, res: Response) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const dbUser = await baseStorage.getUser(user?.claims?.sub || "");
      if (dbUser?.role !== "admin") {
        await createManualAuditLog(
          req as AuthenticatedRequest,
          "unauthorized_access",
          "auditLogs",
          "",
          {
            success: false,
            errorMessage: "Forbidden: Admin access required",
            errorCode: "FORBIDDEN",
            phiAccessed: false,
          },
        );
        return res.status(403).json({ message: "Forbidden: Admin access required" });
      }
      const auditLogs = await baseStorage.getAuditLogs({});
      res.json(auditLogs);
    } catch (error) {
      console.error("Error fetching audit logs:", error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  // -----------------------
  // Return server
  // -----------------------
  const httpServer = createServer(app);
  return httpServer;
}
