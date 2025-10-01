import type { Response, NextFunction } from "express";
import { storage } from "./storage.js";
import type { InsertAuditLog, UserRole } from "../shared/schema.js";
import type { AuthenticatedRequest } from "./types.js";

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------
function isPHIAccessed(endpoint: string): boolean {
  const phiEndpoints = [
    "/api/organs",
    "/api/donors",
    "/api/recipients",
    "/api/allocations",
    "/api/transports",
    "/api/messages",
    "/api/custody-logs",
  ];
  return phiEndpoints.some((path) => endpoint.startsWith(path));
}

function getEntityTypeFromEndpoint(endpoint: string): string | undefined {
  const patterns: Record<string, string> = {
    "/api/organs": "organs",
    "/api/donors": "donors",
    "/api/recipients": "recipients",
    "/api/allocations": "allocations",
    "/api/transports": "transports",
    "/api/messages": "messages",
    "/api/custody-logs": "custodyLogs",
    "/api/auth": "auth",
  };
  return Object.entries(patterns).find(([pattern]) =>
    endpoint.startsWith(pattern),
  )?.[1];
}

function extractEntityId(url: string): string | undefined {
  const idMatch = url.match(/\/([a-f0-9-]{36})(\/|$)/);
  return idMatch ? idMatch[1] : undefined;
}

function determineAction(method: string, endpoint: string): string {
  const lowerMethod = method.toLowerCase();
  if (endpoint.includes("/export")) return "export";
  switch (lowerMethod) {
    case "get":
      return "view";
    case "post":
      return endpoint.includes("/auth/login")
        ? "login"
        : endpoint.includes("/auth/logout")
        ? "logout"
        : "create";
    case "put":
    case "patch":
      return "update";
    case "delete":
      return "delete";
    default:
      return "unknown";
  }
}

function determineActionCategory(action: string): string {
  switch (action) {
    case "view":
      return "data_access";
    case "create":
    case "update":
    case "delete":
      return "data_modification";
    case "login":
    case "logout":
      return "authentication";
    case "export":
      return "export";
    default:
      return "other";
  }
}

function getClientIp(req: AuthenticatedRequest): string {
  const forwardedFor = req.headers["x-forwarded-for"];
  if (forwardedFor) {
    return Array.isArray(forwardedFor)
      ? forwardedFor[0]
      : forwardedFor.split(",")[0].trim();
  }
  return req.socket?.remoteAddress || "unknown";
}

// ---------------------------------------------------------
// Middleware
// ---------------------------------------------------------
export function auditMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) {
  const startTime = Date.now();
  const endpoint = req.path;
  const httpMethod = req.method;
  const action = determineAction(httpMethod, endpoint);
  const actionCategory = determineActionCategory(action);
  const entityType = getEntityTypeFromEndpoint(endpoint);
  const entityId = extractEntityId(req.url);

  let auditLogData: Partial<InsertAuditLog> = {
    userId: req.user?.claims?.sub || null,
    userEmail: req.user?.claims?.email || null,
    userRole: (req.user?.role as UserRole) || null,
    userName: req.user?.claims?.name || null,
    sessionId: req.sessionID || "no-session",
    ipAddress: getClientIp(req),
    userAgent: req.headers["user-agent"] || null,
    httpMethod,
    endpoint,
    action,
    actionCategory,
    entityType,
    entityId,
    phiAccessed: isPHIAccessed(endpoint),
    metadata: {
      timestamp: new Date().toISOString(),
      requestId: Math.random().toString(36).substring(7),
    },
  };

  let responseData: unknown = null;
  const originalJson = res.json;
  res.json = function (this: Response, body: any) {
    responseData = body;
    return originalJson.call(this, body);
  };

  res.on("finish", async () => {
    const duration = Date.now() - startTime;
    auditLogData.success = res.statusCode >= 200 && res.statusCode < 400;

    if (!auditLogData.success) {
      auditLogData.errorCode = res.statusCode.toString();
      if (responseData && typeof responseData === "object") {
        auditLogData.errorMessage =
          (responseData as any).message ||
          (responseData as any).error ||
          JSON.stringify(responseData);
      }
    }

    if (httpMethod === "GET" && auditLogData.success && responseData) {
      if (Array.isArray(responseData)) {
        auditLogData.resultCount = responseData.length;
      } else if (typeof responseData === "object") {
        auditLogData.resultCount = 1;
      }
    }

    auditLogData.metadata = {
      ...(auditLogData.metadata ?? {}),
      duration,
      statusCode: res.statusCode,
    };

    try {
      await storage.createAuditLog(auditLogData as InsertAuditLog);
    } catch (err) {
      console.error("[Audit] Failed to create audit log:", err);
    }
  });

  next();
}

// ---------------------------------------------------------
// Manual audit helper
// ---------------------------------------------------------
export async function createManualAuditLog(
  req: AuthenticatedRequest,
  action: string,
  entityType: string,
  entityId: string,
  additionalData: Partial<InsertAuditLog> = {},
) {
  const auditLogData: InsertAuditLog = {
    userId: req.user?.claims?.sub || null,
    userEmail: req.user?.claims?.email || null,
    userRole: (req.user?.role as UserRole) || null,
    userName: req.user?.claims?.name || null,
    sessionId: req.sessionID || "no-session",
    ipAddress: getClientIp(req),
    userAgent: req.headers["user-agent"] || null,
    httpMethod: req.method,
    endpoint: req.path,
    action,
    actionCategory: determineActionCategory(action),
    entityType,
    entityId,
    phiAccessed: true,
    success: true,
    ...additionalData,
  };
  return storage.createAuditLog(auditLogData);
}
