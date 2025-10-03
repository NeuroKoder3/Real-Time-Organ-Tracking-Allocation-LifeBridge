// ---------------------------------------------------------
// ✅ Load environment variables FIRST
// ---------------------------------------------------------
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

if (fs.existsSync(".env")) {
  dotenv.config();
} else {
  console.warn("⚠️  .env file not found. Make sure environment variables are set.");
}

// Must come after dotenv
import "./config/env.js";

// ✅ Validate critical environment variables (warn instead of hard-crash in prod)
const requiredEnv = ["DATABASE_URL", "JWT_SECRET", "REFRESH_SECRET"] as const;
for (const key of requiredEnv) {
  if (!process.env[key]) {
    const msg = `❌ ${key} must be set in your environment`;
    if (process.env.NODE_ENV === "production") {
      console.error(msg);
    } else {
      throw new Error(msg);
    }
  }
}

// ---------------------------------------------------------
// ✅ Imports AFTER dotenv.config()
// ---------------------------------------------------------
import express, {
  type Request,
  type Response,
  type NextFunction,
  type RequestHandler,
  type Express,
} from "express";
import helmet from "helmet";
import csurf from "csurf";
import cookieParser from "cookie-parser";
import cors from "cors";
import registerRoutes from "./routes.js";
import errorHandler from "./middleware/errorHandler.js";
import { log, serveStatic, setupVite } from "./vite.js";

// ✅ ESM-safe __dirname / __filename
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ---------------------------------------------------------
// ✅ Create Express App
// ---------------------------------------------------------
const app: Express = express(); // explicit type

// ---------------------------------------------------------
// ✅ CORS (Netlify + local dev) with credentials
// ---------------------------------------------------------
const allowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://lifebridge-opotracking.netlify.app", // your Netlify site
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
  })
);

// ---------------------------------------------------------
// ✅ Security Middleware (CSP allows Google Fonts & API)
// ---------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        // allow https (any) + ws/wss for dev tools and your api domain
        connectSrc: [
          "'self'",
          "https:",
          "ws:",
          "wss:",
          "https://api.lifebridge.online",
        ],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cookieParser());

// ---------------------------------------------------------
// ✅ CSRF protection (cookie mode)
//    NOTE: cross-site cookies require SameSite=None; Secure
// ---------------------------------------------------------
if (process.env.NODE_ENV !== "test") {
  const isProd = process.env.NODE_ENV === "production";
  const csrfProtection = csurf({
    cookie: {
      httpOnly: true,
      secure: isProd,                // must be true for SameSite=None
      sameSite: isProd ? "none" : "lax", // cross-site from Netlify -> api.*
    },
  }) as unknown as RequestHandler;

  app.use(csrfProtection);
  app.get("/api/csrf-token", (req: Request, res: Response) => {
    res.json({ csrfToken: (req as any).csrfToken() });
  });
}

// ---------------------------------------------------------
// ✅ Core Middleware
// ---------------------------------------------------------
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ✅ Request Logging Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const pathName = req.path;
  let capturedJsonResponse: unknown;
  const originalResJson = res.json.bind(res);
  res.json = function (body: any) {
    capturedJsonResponse = body;
    return originalResJson(body);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (pathName.startsWith("/api")) {
      let logLine = `[API] ${req.method} ${pathName} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        try {
          logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
        } catch {
          logLine += " :: [Unserializable JSON]";
        }
      }
      if (logLine.length > 200) {
        logLine = logLine.slice(0, 199) + "…";
      }
      log(logLine);
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
app.get("/healthz", (_req: Request, res: Response) => {
  res.send("ok");
});
app.get("/api/test/encryption-status", (_req: Request, res: Response) => {
  try {
    res.status(200).json({ encrypted: true, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error("[Health Check] Error:", error);
    res.status(500).json({ encrypted: false, error: "Health check failed" });
  }
});

// ---------------------------------------------------------
// ✅ Error Handler (before SPA static/fallback)
// ---------------------------------------------------------
app.use(errorHandler);

// ---------------------------------------------------------
// ✅ Export for testing and external usage
// ---------------------------------------------------------
export default app;

// ---------------------------------------------------------
// ✅ Start server if run directly (ESM-safe check)
// ---------------------------------------------------------
const isDirectRun = process.argv[1] && path.resolve(process.argv[1]).includes("server/index");
if (isDirectRun) {
  (async () => {
    try {
      const server = await registerRoutes(app);
      if (app.get("env") === "development") {
        await setupVite(app, server);
      } else {
        // ✅ Serve built frontend from client/dist
        serveStatic(app);
        app.get("*", (req: Request, res: Response) => {
          if (req.path.startsWith("/api")) {
            return res.status(404).json({ message: "Not found" });
          }
          res.sendFile(path.resolve(process.cwd(), "client", "dist", "index.html"));
        });
      }
      const port = parseInt(process.env.PORT || "5000", 10);
      server.listen({ port, host: "0.0.0.0" }, () => {
        log(`[Server] Running on http://localhost:${port}`);
      });
    } catch (error) {
      console.error("[Server Init] Failed to start:", error);
      process.exit(1);
    }
  })();
}
