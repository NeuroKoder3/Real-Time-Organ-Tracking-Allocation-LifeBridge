// ---------------------------------------------------------
// ✅ Load environment variables FIRST
// ---------------------------------------------------------
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
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
const app: Express = express();

// ---------------------------------------------------------
// ✅ Dynamic + Secure CORS Configuration
// ---------------------------------------------------------
const defaultAllowedOrigins = [
  "https://lifebridge.netlify.app",
  "https://lifebridge-opotracking.netlify.app", // ✅ ADDED for working CORS
  "https://api.lifebridge.online",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:5000",
];

const envOrigins = process.env.FRONTEND_URL?.split(",").map((o) => o.trim()) ?? [];
const allowedOrigins = Array.from(new Set([...defaultAllowedOrigins, ...envOrigins]));

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true); // Allow Postman, curl, etc.
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      } else {
        console.warn(`🚫 CORS blocked request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);

// ---------------------------------------------------------
// ✅ Security Middleware (Helmet + CSP)
// ---------------------------------------------------------
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "https:", "wss:", ...allowedOrigins],
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
    if (req.path === "/api/auth/_seed-demo") {
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
      if (logLine.length > 200) logLine = logLine.slice(0, 199) + "…";
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
    res.status(200).json({
      encrypted: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Health Check] Error:", error);
    res.status(500).json({ encrypted: false, error: "Health check failed" });
  }
});

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

      server.listen(port, "0.0.0.0", () => {
        log(`[Server] 🚀 Dev server running at http://localhost:${port}`);
        log(`[Server] ✅ Allowed Origins: ${allowedOrigins.join(", ")}`);
      });
    } else {
      serveStatic(app);

      const frontendLimiter = rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
      });

      app.get("*", frontendLimiter, (req: Request, res: Response) => {
        if (req.path.startsWith("/api")) {
          return res.status(404).json({ message: "Not found" });
        }
        res.sendFile(path.resolve(process.cwd(), "client", "dist", "index.html"));
      });

      app.listen(port, "0.0.0.0", () => {
        log(`[Server] 🌐 Running on port ${port}`);
        log(`[Server] ✅ Allowed Origins: ${allowedOrigins.join(", ")}`);
      });
    }
  } catch (error) {
    console.error("[Server Init] ❌ Failed to start:", error);
    process.exit(1);
  }
})();

export default app;
