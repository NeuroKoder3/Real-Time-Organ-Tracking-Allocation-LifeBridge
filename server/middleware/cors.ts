// ✅ server/middleware/cors.ts (Hardened CORS Middleware)

import type { Request, Response, NextFunction } from "express";

/**
 * ✅ Centralized Manual CORS Middleware
 * Fixes deployment issues where CORS package may not behave as expected
 * Adds headers directly for both simple and preflight (OPTIONS) requests
 */

const allowedOrigins = [
  "https://lifebridge.online",                            // Production frontend
  "https://www.lifebridge.online",                        // Optional www
  "https://api.lifebridge.online",                        // API subdomain
  "https://lifebridge-opotracking.netlify.app",           // Netlify preview
  "https://real-time-organ-tracking-allocation.onrender.com", // Render frontend
  "http://localhost:5173",                                // Local dev
  "http://127.0.0.1:5173",
];

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin || "";

  // Always include Vary: Origin
  res.setHeader("Vary", "Origin");

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // Optional: Log blocked origin for debugging
    if (process.env.NODE_ENV !== "production" && origin) {
      console.warn(`🚫 [CORS] Blocked origin: ${origin}`);
    }
  }

  // Core CORS headers
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Max-Age", "7200"); // cache preflight 2h

  // ✅ Handle preflight OPTIONS requests cleanly
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  next();
}
