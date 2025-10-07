// ---------------------------------------------------------
// ✅ Load environment variables FIRST
// ---------------------------------------------------------
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch"; // ✅ NEW: used for auto-seed

if (fs.existsSync(".env")) {
  dotenv.config();
} else {
  console.warn("⚠️  .env file not found. Make sure environment variables are set.");
}

// Must come after dotenv
import "./config/env.js";

// ---------------------------------------------------------
// ✅ Validate critical environment variables
// ---------------------------------------------------------
const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "REFRESH_SECRET"];
for (const key of requiredEnv) {
  if (!process.env[key]) {
    const msg = `❌ ${key} must be set in your environment`;
    if (process.env.NODE_ENV === "production") console.error(msg);
    else throw new Error(msg);
  }
}

// ---------------------------------------------------------
// ✅ Imports AFTER dotenv.config()
// ---------------------------------------------------------
import express, {
  type Express,
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
} from "express";
import helmet from "helmet";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import registerRoutes from "./routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { log, serveStatic, setupVite } from "./vite.js";

// ✅ ESM-safe __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------
// ✅ Create Express App
// ---------------------------------------------------------
const app: Express = express(); // ✅ Type annotation added (fixes TS2742)

// ---------------------------------------------------------
// ✅ Allowed Origins — cleaned & corrected
// ---------------------------------------------------------
const allowedOrigins = [
  "https://lifebridge-opotracking.netlify.app",
  "https://api.lifebridge.online",
  "https://lifebridge.online",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
];

// ---------------------------------------------------------
// ✅ CORS Middleware — universal & strict-compliant
// ---------------------------------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Vary", "Origin");
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,OPTIONS");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
  );

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ---------------------------------------------------------
// ✅ Security Middleware (Helmet + CSP)
// ---------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cookieParser());

// ---------------------------------------------------------
// ✅ CSRF protection (cookie-based)
// ---------------------------------------------------------
if (process.env.NODE_ENV !== "test") {
  const isProd = process.env.NODE_ENV === "production";

  const csrfMiddleware = csurf({
    cookie: {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? "none" : "lax",
    },
  }) as unknown as RequestHandler;

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.startsWith("/api/auth/_seed-demo")) {
      return next();
    }
    return csrfMiddleware(req, res, next);
  });

  app.get("/api/csrf-token", (req: Request, res: Response) => {
    res.json({ csrfToken: (req as any).csrfToken?.() });
  });
}

// ---------------------------------------------------------
// ✅ Core Middleware
// ---------------------------------------------------------
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// ✅ Logging
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (req.path.startsWith("/api")) {
      log(`[API] ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`);
    }
  });
  next();
});

// ---------------------------------------------------------
// ✅ Health Checks
// ---------------------------------------------------------
app.get("/api/health", (_req: Request, res: Response) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});

app.get("/healthz", (_req: Request, res: Response) => res.send("ok"));

// ---------------------------------------------------------
// ✅ Register API Routes
// ---------------------------------------------------------
await registerRoutes(app);

// ---------------------------------------------------------
// ✅ Global Error Handler
// ---------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------
// ✅ Bootstrapping Server
// ---------------------------------------------------------
(async () => {
  try {
    const port = parseInt(process.env.PORT || "5000", 10);

    if (app.get("env") === "development") {
      const http = await import("http");
      const server = http.createServer(app);
      await setupVite(app, server);

      // 🌱 Seed the demo user automatically
      try {
        const res = await fetch(`http://localhost:${port}/api/auth/_seed-demo`, {
          method: "POST",
        });
        const data = await res.json();
        log(`[Server] 🌱 Demo user seeded: ${data.message}`);
      } catch (err) {
        console.error("[Server] ❌ Failed to seed demo user", err);
      }

      server.listen(port, "0.0.0.0", () => {
        log(`[Server] 🚀 Dev server running at http://localhost:${port}`);
      });
    } else {
      serveStatic(app);
      const limiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
      });
      app.use(limiter);

      app.listen(port, "0.0.0.0", () => {
        log(`[Server] 🌐 Running on port ${port}`);
        log(`[Server] ✅ CORS Origins: ${allowedOrigins.join(", ")}`);
      });
    }
  } catch (error) {
    console.error("[Server Init] ❌ Failed to start:", error);
    process.exit(1);
  }
})();

export default app;
