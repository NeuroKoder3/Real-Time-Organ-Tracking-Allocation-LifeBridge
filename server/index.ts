// ---------------------------------------------------------
// ✅ Load environment variables FIRST
// ---------------------------------------------------------
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import fetch from "node-fetch"; // ✅ used for auto-seed

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
import cors from "cors";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import registerRoutes from "./routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { log, serveStatic, setupVite } from "./vite.js";

// ESM-safe __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------
// ✅ Create Express App
// ---------------------------------------------------------
const app: Express = express();

// ---------------------------------------------------------
// ✅ Allowed Origins
// ---------------------------------------------------------
const allowedOrigins = [
  "https://lifebridge-opotracking.netlify.app",
  "https://lifebridge.online",
  "https://www.lifebridge.online", // ✅ make sure www works
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
];

// ---------------------------------------------------------
// ✅ Log All Origins for Debugging
// ---------------------------------------------------------
app.use((req, res, next) => {
  const origin = req.headers.origin || "NO_ORIGIN_HEADER";
  console.log(`🌐 Incoming request from: ${origin}`);
  next();
});

// ---------------------------------------------------------
// ✅ CORS Middleware (safe, no errors thrown)
// ---------------------------------------------------------
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked origin: ${origin}`);
      callback(null, false); // DO NOT throw error
    }
  },
  credentials: true,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Origin", "X-Requested-With", "Content-Type", "Accept", "Authorization", "X-CSRF-Token"],
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions)); // ✅ Preflight

// ---------------------------------------------------------
// ✅ Security Middleware
// ---------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cookieParser());

// ---------------------------------------------------------
// ✅ CSRF protection (cookie-based) with dev route exemptions
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
    const csrfExempt = [
      "/api/auth/_seed-demo",
      "/api/auth/_seed-admin",
      "/api/_seed-demo",
      "/api/_seed-admin",
      "/_seed-demo",
      "/_seed-admin",
      "/_debug",
    ];

    if (csrfExempt.includes(req.path)) {
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

// Logging
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
app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true, timestamp: new Date().toISOString() });
});
app.get("/healthz", (_req, res) => res.send("ok"));

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

      server.listen(port, "0.0.0.0", async () => {
        log(`[Server] 🚀 Dev server running at http://localhost:${port}`);

        // 🌱 Seed the demo user AFTER server is listening
        try {
          const res = await fetch(`http://localhost:${port}/api/auth/_seed-demo`, {
            method: "POST",
          });
          const data = (await res.json()) as { message: string };
          log(`[Server] 🌱 Demo user seeded: ${data.message}`);

          const resAdmin = await fetch(`http://localhost:${port}/api/auth/_seed-admin`, {
            method: "POST",
          });
          const adminData = (await resAdmin.json()) as { message: string };
          log(`[Server] 👑 Admin user seeded: ${adminData.message}`);
        } catch (err) {
          console.error("[Server] ❌ Failed to seed users", err);
        }
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
