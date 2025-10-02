// server/types.ts

import type { Request } from "express";
import type { UserRole } from "../shared/schema.js";

/**
 * Standardized JWT claims used everywhere
 */
export interface CustomJwtClaims {
  sub: string;
  email?: string;
  name?: string;
  [key: string]: any;
}

/**
 * Shared AuthenticatedRequest type used across middleware + routes
 */
export interface AuthenticatedRequest extends Request {
  user?: {
    claims: CustomJwtClaims;
    /**
     * Role is usually populated from JWT or DB. Keep optional at type level
     * to avoid compile errors in places where it isn't attached yet.
     */
    role?: UserRole;
    department?: string;
  };
  /**
   * Express-session exposes `sessionID` on Request; add here for convenience.
   */
  sessionID?: string;
}

/**
 * Express Request augmentation so `req.user` is recognized everywhere
 * without importing AuthenticatedRequest. This is safe and optional.
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

export type { UserRole };
