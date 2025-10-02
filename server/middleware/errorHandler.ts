// server/middleware/errorHandler.ts

import type { Request, Response, NextFunction } from "express";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Normalize error into a plain object we can safely log/return
  const e = ((): { message?: string; code?: string; status?: number; statusCode?: number; stack?: string } => {
    if (err && typeof err === "object") return err as any;
    return { message: String(err) };
  })();

  const status = e.status ?? e.statusCode ?? 500;

  const errorResponse: {
    message: string;
    code: string;
    stack?: string;
  } = {
    message: e.message || "Internal Server Error",
    code: e.code || "UNKNOWN_ERROR",
    ...(process.env.NODE_ENV === "development" && e.stack ? { stack: e.stack } : {}),
  };

  // Centralized error logging
  console.error("💥 Unhandled Error:", {
    status,
    message: e.message,
    code: e.code,
    stack: e.stack,
  });

  res.status(status).json(errorResponse);
}

// Default export for compatibility with `import errorHandler from ".../errorHandler"`
export default errorHandler;
