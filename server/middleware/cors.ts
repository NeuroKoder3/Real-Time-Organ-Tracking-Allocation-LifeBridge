// ✅ server/middleware/cors.ts (Manual CORS headers)

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
  "https://real-time-organ-tracking-allocation.onrender.com", // ✅ Render frontend
  "http://localhost:5173",                                // Local dev
  "http://127.0.0.1:5173",
];

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const origin = req.headers.origin || "";

  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }

  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Optional: for Chrome bug workaround and preflight stability
  res.setHeader("Access-Control-Max-Age", "7200");

  // Preflight support
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}
