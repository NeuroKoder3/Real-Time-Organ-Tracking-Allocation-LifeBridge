// ✅ Lifebridge Server — Final CORS-Stable Build + Health Route Fix

import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch";
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
import openaiRouter from "./routes/openai.js";
import cors, { CorsOptions } from "cors";

if (fs.existsSync(".env")) dotenv.config();
else console.warn("⚠️  .env file not found.");

import "./config/env.js";

const requiredEnv = [
  "DATABASE_URL",
  "JWT_SECRET",
  "REFRESH_SECRET",
  "COOKIE_SECRET",
  "OPENAI_API_KEY",
];
for (const key of requiredEnv) {
  if (!process.env[key]) throw new Error(`❌ Missing env var: ${key}`);
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app: Express = express();
const isProd = process.env.NODE_ENV === "production";

/* ---------------------------------------------------------
   🛡️ UNIVERSAL CORS FIX — Always First
--------------------------------------------------------- */
const allowedOrigins = [
  "https://lifebridge.online",
  "https://www.lifebridge.online",
  "https://api.lifebridge.online",
  "https://lifebridge-opotracking.netlify.app",
  "https://real-time-organ-tracking-allocation.onrender.com",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) callback(null, true);
    else {
      console.warn(`🚫 [CORS] Blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
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
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader("Vary", "Origin");
  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token"
  );
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS"
  );
  res.setHeader("Access-Control-Max-Age", "7200");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));

/* ---------------------------------------------------------
   ✅ Security Middleware
--------------------------------------------------------- */
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

/* ---------------------------------------------------------
   ✅ Parsers
--------------------------------------------------------- */
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser(process.env.COOKIE_SECRET));

/* ---------------------------------------------------------
   ✅ Health Endpoints (moved above static + routes)
--------------------------------------------------------- */
app.get("/api/health", (_req: Request, res: Response) =>
  res.status(200).json({
    ok: true,
    env: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  })
);

app.get("/health", (_req: Request, res: Response) => res.send("ok"));

/* ---------------------------------------------------------
   ✅ CSRF Protection
--------------------------------------------------------- */
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
    "/api/openai/analyze",
  ];

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (csrfExempt.includes(req.path)) return next();
    return csrfMiddleware(req, res, next);
  });

  app.get("/api/csrf-token", (req: Request, res: Response) => {
    try {
      const token = (req as any).csrfToken?.();
      if (!token) throw new Error("CSRF token missing");
      res.status(200).json({ csrfToken: token });
    } catch (err) {
      console.error("[CSRF] Failed to generate token:", err);
      res.status(500).json({ error: "Failed to generate CSRF token" });
    }
  });
}

/* ---------------------------------------------------------
   ✅ Logging
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
   ✅ API Routes
--------------------------------------------------------- */
await registerRoutes(app);
app.use("/api/openai", openaiRouter);

/* ---------------------------------------------------------
   ✅ Error + Final CORS Patch
--------------------------------------------------------- */
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const origin = req.headers.origin || "";
  if (allowedOrigins.includes(origin))
    res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  next(err);
});
app.use(errorHandler);

/* ---------------------------------------------------------
   ✅ Server Boot
--------------------------------------------------------- */
(async () => {
  try {
    const port = parseInt(process.env.PORT || "5000", 10);
    if (!isProd) {
      const http = await import("http");
      const server = http.createServer(app);
      await setupVite(app, server);
      server.listen(port, "0.0.0.0", async () => {
        log(`[Server] 🚀 Dev server running at http://localhost:${port}`);
      });
    } else {
      serveStatic(app);
      const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
      app.use(limiter);
      app.listen(port, "0.0.0.0", () => {
        log(`[Server] 🌐 Running on port ${port}`);
      });
    }
  } catch (error) {
    console.error("[Server Init] ❌ Failed to start:", error);
    process.exit(1);
  }
})();

export default app;
