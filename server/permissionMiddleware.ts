import type { Response, NextFunction } from "express";
import { parse } from "url";

import type { UserRole } from "../shared/schema.js";
import {
  hasPermission,
  hasSpecialPermission,
  validateUpdateFields,
  type Operation,
  type SpecialOperation,
  type EntityType,
} from "./permissions.js";
import { createManualAuditLog } from "./auditMiddleware.js"; // ✅ FIXED LINE
import type { AuthenticatedRequest } from "./types.js";

// ---------------------------------------------------------
// Extended entity type (local fallback includes "unknown")
// ---------------------------------------------------------
export type ExtendedEntityType = EntityType | "unknown";

// ---------------------------------------------------------
// Path → Entity mapping
// ---------------------------------------------------------
const pathToEntity: Record<string, EntityType> = {
  "/api/organs": "organs",
  "/api/donors": "donors",
  "/api/recipients": "recipients",
  "/api/allocations": "allocations",
  "/api/transports": "transports",
  "/api/messages": "messages",
  "/api/custody-logs": "custodyLogs",
  "/api/metrics": "metrics",
  "/api/users": "users",
  "/api/audit-logs": "auditLogs",
};

// ---------------------------------------------------------
// Method → Operation mapping
// ---------------------------------------------------------
const methodToOperation: Record<string, Operation> = {
  GET: "read",
  POST: "create",
  PUT: "update",
  PATCH: "update",
  DELETE: "delete",
};

// ---------------------------------------------------------
// Role-based field exclusions
// ---------------------------------------------------------
const roleFieldExclusions: Record<
  UserRole,
  Partial<Record<EntityType, string[]>>
> = {
  admin: {},
  coordinator: {},
  transport: {
    recipients: [
      "medicalData",
      "hlaType",
      "antibodies",
      "meldScore",
      "cpcScore",
    ],
    donors: ["medicalHistory", "hlaType"],
    organs: ["biopsyResults", "crossmatchData"],
  },
  surgeon: {
    allocations: ["declineReason"],
  },
};

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function getEntityTypeFromPath(fullPath: string): ExtendedEntityType {
  const pathname = parse(fullPath).pathname || "";
  const basePath = pathname.replace(/\/[a-f0-9-]{36}(\/|$)/, "");
  for (const [pathPattern, entity] of Object.entries(pathToEntity)) {
    if (basePath.startsWith(pathPattern)) {
      return entity as EntityType;
    }
  }
  return "unknown";
}

function extractEntityId(url: string): string | undefined {
  const idMatch = url.match(/\/([a-f0-9-]{36})(\/|$)/);
  return idMatch ? idMatch[1] : undefined;
}

// ---------------------------------------------------------
// Main permission middleware
// ---------------------------------------------------------
export function requirePermission(
  entityType?: EntityType,
  operation?: Operation,
  specialOp?: SpecialOperation,
) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userRole = req.user?.role;
      const userId = req.user?.claims?.sub;

      if (!userRole) {
        await createManualAuditLog(
          req,
          "unauthorized_access",
          {
            entityType: entityType || getEntityTypeFromPath(req.path),
            entityId: extractEntityId(req.url) || "",
            success: false,
            errorMessage: "User role not found",
            errorCode: "ROLE_NOT_FOUND",
            phiAccessed: false,
          }
        );
        return res.status(403).json({
          message: "Access denied: User role not found",
          code: "ROLE_NOT_FOUND",
        });
      }

      const finalEntityType: ExtendedEntityType =
        entityType || getEntityTypeFromPath(req.path) || "unknown";
      const finalOperation = operation || methodToOperation[req.method];

      if (specialOp && !hasSpecialPermission(userRole, specialOp)) {
        await createManualAuditLog(
          req,
          "unauthorized_special_operation",
          {
            entityType: finalEntityType,
            entityId: extractEntityId(req.url) || "",
            success: false,
            errorMessage: `Special operation ${specialOp} not allowed for role ${userRole}`,
            errorCode: "SPECIAL_OP_DENIED",
            metadata: { specialOperation: specialOp },
            phiAccessed: false,
          }
        );
        return res.status(403).json({
          message: `Access denied: ${specialOp} operation not allowed for your role`,
          code: "SPECIAL_OP_DENIED",
        });
      }

      if (
        finalEntityType !== "unknown" &&
        finalOperation &&
        !hasPermission(userRole, finalEntityType as EntityType, finalOperation)
      ) {
        await createManualAuditLog(
          req,
          "unauthorized_access",
          {
            entityType: finalEntityType,
            entityId: extractEntityId(req.url) || "",
            success: false,
            errorMessage: `Operation ${finalOperation} on ${finalEntityType} not allowed for role ${userRole}`,
            errorCode: "OPERATION_DENIED",
            phiAccessed: false,
          }
        );
        return res.status(403).json({
          message: `Access denied: Cannot ${finalOperation} ${finalEntityType}`,
          code: "OPERATION_DENIED",
        });
      }

      if (
        finalOperation === "update" &&
        finalEntityType !== "unknown" &&
        req.body
      ) {
        const validation = validateUpdateFields(
          req.body,
          userRole,
          finalEntityType as EntityType,
        );
        if (!validation.valid) {
          await createManualAuditLog(
            req,
            "unauthorized_field_update",
            {
              entityType: finalEntityType,
              entityId: extractEntityId(req.url) || "",
              success: false,
              errorMessage: "Unauthorized field update attempt",
              errorCode: "FIELD_UPDATE_DENIED",
              metadata: { unauthorizedFields: validation.unauthorizedFields },
              phiAccessed: false,
            }
          );
          return res.status(403).json({
            message: `Access denied: Cannot update fields: ${validation.unauthorizedFields.join(
              ", ",
            )}`,
            code: "FIELD_UPDATE_DENIED",
            unauthorizedFields: validation.unauthorizedFields,
          });
        }
      }

      next();
    } catch (error) {
      console.error("Permission middleware error:", error);
      res.status(500).json({
        message: "Internal server error during authorization",
        code: "AUTH_ERROR",
      });
    }
  };
}

// ---------------------------------------------------------
// Middleware: filter response fields by role
// ---------------------------------------------------------
export function filterResponseFields() {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalJson = res.json.bind(res);
    res.json = function (data: any) {
      const userRole = req.user?.role;
      const entityType = getEntityTypeFromPath(req.path);

      if (userRole && entityType && data) {
        if (Array.isArray(data)) {
          data = data.map((item) =>
            filterFieldsByRole(item, userRole, entityType as EntityType),
          );
        } else if (typeof data === "object" && !data.message && !data.error) {
          data = filterFieldsByRole(data, userRole, entityType as EntityType);
        }
      }
      return originalJson(data);
    };
    next();
  };
}

function filterFieldsByRole(
  data: any,
  userRole: UserRole,
  entityType: EntityType,
): any {
  if (!data || typeof data !== "object") return data;
  if (userRole === "admin") return data;

  const filtered = { ...data };
  const exclusions = roleFieldExclusions[userRole]?.[entityType];
  if (exclusions) {
    for (const field of exclusions) {
      delete filtered[field];
    }
  }
  return filtered;
}

// ---------------------------------------------------------
// Middleware: enrich user with role from DB
// ---------------------------------------------------------
export async function enrichUserWithRole(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) {
  if (req.user?.claims?.sub) {
    try {
      const { storage } = await import("./storage.js");
      const user = await storage.getUser(req.user.claims.sub);
      if (user) {
        req.user.role = user.role as UserRole;
        req.user.department = user.department || undefined;
      }
    } catch (error) {
      console.error("Error enriching user with role:", error);
    }
  }
  next();
}

// ---------------------------------------------------------
// Combined middleware for routes
// ---------------------------------------------------------
export function withPermissions(
  entityType?: EntityType,
  operation?: Operation,
  specialOp?: SpecialOperation,
) {
  return [
    enrichUserWithRole,
    requirePermission(entityType, operation, specialOp),
    filterResponseFields(),
  ];
}

// auto-fix: provide default export for compatibility with default imports
export default requirePermission;
