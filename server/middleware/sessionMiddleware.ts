// server/middleware/sessionMiddleware.ts

import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";

// ------------------------------------------------------------------
// Config
// ------------------------------------------------------------------
export const ACCESS_TOKEN_EXPIRY = "15m"; // short-lived
export const REFRESH_TOKEN_EXPIRY = "7d"; // long-lived

const JWT_SECRET = process.env.JWT_SECRET || "changeme";
const REFRESH_SECRET = process.env.REFRESH_SECRET || "refreshchangeme";

// In-memory store (replace with Redis/DB in production)
const validRefreshTokens = new Set<string>();

// ------------------------------------------------------------------
// Token helpers
// ------------------------------------------------------------------
export function generateTokens(payload: object) {
  const accessToken = jwt.sign(payload, JWT_SECRET, {
    expiresIn: ACCESS_TOKEN_EXPIRY,
  });

  const refreshToken = jwt.sign(payload, REFRESH_SECRET, {
    expiresIn: REFRESH_TOKEN_EXPIRY,
  });

  // Track refresh token (in prod, persist to Redis/DB with TTL)
  validRefreshTokens.add(refreshToken);

  return { accessToken, refreshToken };
}

// ------------------------------------------------------------------
// Middleware: validate & rotate refresh token
// ------------------------------------------------------------------
export function authenticateRefreshToken(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const token = (req as any).cookies?.refreshToken || req.cookies?.refreshToken;

  if (!token) {
    return res.status(401).json({ message: "Missing refresh token" });
  }

  if (!validRefreshTokens.has(token)) {
    return res.status(403).json({ message: "Refresh token revoked or reused" });
  }

  try {
    const payload = jwt.verify(token, REFRESH_SECRET) as JwtPayload;

    // Rotate token: remove old, issue new
    validRefreshTokens.delete(token);

    const { refreshToken, accessToken } = generateTokens(payload);

    // Set new refresh token cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    // Expose for downstream handlers
    (req as any).refreshUser = payload;
    (req as any).newAccessToken = accessToken;

    next();
  } catch {
    return res.status(403).json({ message: "Invalid or expired refresh token" });
  }
}

// ------------------------------------------------------------------
// Logout helper
// ------------------------------------------------------------------
export function revokeRefreshToken(token: string) {
  validRefreshTokens.delete(token);
}

// ------------------------------------------------------------------
// Default export (compat with `import xxx from "./sessionMiddleware"`)
// ------------------------------------------------------------------
export default authenticateRefreshToken;
