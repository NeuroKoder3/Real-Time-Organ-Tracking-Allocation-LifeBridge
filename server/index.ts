/* ---------------------------------------------------------
   ✅ Load environment variables FIRST
--------------------------------------------------------- */
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";

if (fs.existsSync(".env")) {
  dotenv.config();
} else {
  console.warn("⚠️  .env file not found.");
}

// Load additional env logic
import "./config/env.js";

/* ---------------------------------------------------------
   ✅ Validate critical environment variables
--------------------------------------------------------- */
const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "REFRESH_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`❌ Missing env var: ${key}`);
  }
}

/* --------------------------------------------------------- */
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import helmet from "helmet";
import cors from "cors";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import registerRoutes from "./routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { log, serveStatic, setupVite } from "./vite.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ---------------------------------------------------------
   ✅ Create Express App
--------------------------------------------------------- */
const app: Express = express();

/* ---------------------------------------------------------
   ✅ CORS Setup
--------------------------------------------------------- */
app.use(
  cors({
    origin: "https://www.lifebridge.online",
    credentials: true,
    methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Origin",
      "X-Requested-With",
      "Content-Type",
      "Accept",
      "Authorization",
      "X-CSRF-Token",
    ],
    exposedHeaders: ["X-CSRF-Token"],
  })
);
app.options("*", cors());

/* ---------------------------------------------------------
   ✅ Security Middleware
--------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cookieParser());

/* ---------------------------------------------------------
   ✅ CSRF Protection
--------------------------------------------------------- */
const isProd = process.env.NODE_ENV === "production";

if (process.env.NODE_ENV !== "test") {
  const csrfMiddleware = csurf({
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    },
  }) as unknown as RequestHandler;

  const csrfExempt = [
    "/api/auth/_seed-demo",
    "/api/auth/_seed-admin",
    "/api/_seed-demo",
    "/api/_seed-admin",
    "/_seed-demo",
    "/_seed-admin",
    "/_debug",
    "/api/csrf-token",
  ];

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (csrfExempt.includes(req.path)) {
      return next();
    }
    return csrfMiddleware(req, res, next);
  });

  app.get("/api/csrf-token", (req: Request, res: Response) => {
    res.json({ csrfToken: (req as any).csrfToken?.() });
  });
}

/* ---------------------------------------------------------
   ✅ Core Body Parsers
--------------------------------------------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

/* ---------------------------------------------------------
   ✅ Logging Middleware
--------------------------------------------------------- */
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    if (req.path.startsWith("/api")) {
      const ms = Date.now() - start;
      log(`[API] ${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

/* ---------------------------------------------------------
   ✅ Health / Basic Routes
--------------------------------------------------------- */
app.get("/api/health", (_req, res) =>
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() })
);
app.get("/healthz", (_req, res) => res.send("ok"));

/* ---------------------------------------------------------
   ✅ Register Your App Routes
--------------------------------------------------------- */
await registerRoutes(app);

/* ---------------------------------------------------------
   ✅ Global Error Handler
--------------------------------------------------------- */
app.use(errorHandler);

/* ---------------------------------------------------------
   ✅ Server Bootstrap
--------------------------------------------------------- */
(async () => {
  try {
    const port = parseInt(process.env.PORT || "5000", 10);

    if (app.get("env") === "development") {
      const http = await import("http");
      const server = http.createServer(app);
      await setupVite(app, server);
      server.listen(port, "0.0.0.0", async () => {
        log(`[Server] 🚀 Dev server at http://localhost:${port}`);
        try {
          const res = await fetch(`http://localhost:${port}/api/auth/_seed-demo`, {
            method: "POST",
          });
          const data = (await res.json()) as { message: string };
          log(`[Server] 🌱 Demo seeded: ${data.message}`);

          const resAdmin = await fetch(`http://localhost:${port}/api/auth/_seed-admin`, {
            method: "POST",
          });
          const adminData = (await resAdmin.json()) as { message: string };
          log(`[Server] 👑 Admin seeded: ${adminData.message}`);
        } catch (err) {
          console.error("[Server] ❌ Seeding failed", err);
        }
      });
    } else {
      serveStatic(app);
      const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
      app.use(limiter);
      app.listen(port, "0.0.0.0", () => {
        log(`[Server] 🌐 Running on port ${port}`);
        log(`[Server] ✅ CORS origin allowed: https://www.lifebridge.online`);
      });
    }
  } catch (error) {
    console.error("[Server Init] ❌ Failed to start:", error);
    process.exit(1);
  }
})();

export default app;
