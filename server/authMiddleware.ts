// server/middleware/authMiddleware.ts

import type { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import type { UserRole } from "../shared/schema.js";

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

// ------------------------------------------------------------------
// JWT payload shape
// ------------------------------------------------------------------
export interface JwtPayload {
  sub: string;
  email?: string;
  name?: string;
  role?: UserRole;
  iat?: number;
  exp?: number;
}

// ------------------------------------------------------------------
// Extend Express Request type
// ------------------------------------------------------------------
export interface AuthenticatedRequest extends Request {
  user?: {
    claims: JwtPayload;
    role?: UserRole;
    department?: string;
  };
}

// ------------------------------------------------------------------
// Middleware: Verify access token
// ------------------------------------------------------------------
export function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers["authorization"];
  const token = authHeader?.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : null;

  if (!token) {
    return res.status(401).json({ message: "Missing or invalid token" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;

    if (!decoded?.sub) {
      return res.status(403).json({ message: "Invalid token structure" });
    }

    req.user = {
      claims: decoded,
      role: decoded.role,
    };

    // Optional debug logging (safe in dev only)
    if (process.env.NODE_ENV !== "production") {
      console.log("✅ Authenticated user:", req.user);
    }

    return next();
  } catch (err: any) {
    if (err?.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired" });
    }

    console.warn("❌ JWT verification failed:", err);
    return res.status(403).json({ message: "Invalid token" });
  }
}

// Default export for compatibility with `import foo from ".../authMiddleware"`
export default authenticateToken;
