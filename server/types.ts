// server/types.ts

import type { Request } from "express";
import type { UserRole } from "../shared/schema.js";

/**
 * ✅ Standardized JWT claims used across the app
 */
export interface CustomJwtClaims {
  sub: string;              // Subject (usually user ID)
  email?: string;
  name?: string;
  [key: string]: any;       // Allow for additional claims
}

/**
 * ✅ AuthenticatedRequest used in middleware and routes
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    claims: CustomJwtClaims;
    role?: UserRole;         // Optional to prevent strict issues pre-population
    department?: string;
  };
  sessionID?: string;        // Express-session support
}

/**
 * ✅ Global Express type augmentation
 * Enables access to `req.user` and `req.sessionID` without importing AuthenticatedRequest
 */
declare module "express-serve-static-core" {
  interface Request {
    user?: {
      claims: CustomJwtClaims;
      role?: UserRole;
      department?: string;
    };
    sessionID?: string;
  }
}

// ✅ Re-export UserRole for convenience
export type { UserRole };
