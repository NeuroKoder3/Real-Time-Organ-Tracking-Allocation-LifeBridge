// server/vite.ts
import express, { Express } from "express";
import rateLimit from "express-rate-limit";
import fs from "fs";
import path, { resolve } from "path";
import { createServer as createViteServer, createLogger, InlineConfig, ViteDevServer } from "vite";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

/**
 * ✅ Timestamped logger
 */
export function log(message: string, source: string = "express"): void {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * ✅ Load vite.config.{ts,js}, or fallback inline config
 */
async function loadViteConfig(): Promise<InlineConfig> {
  const root = process.cwd();
  const tsPath = resolve(root, "vite.config.ts");
  const jsPath = resolve(root, "vite.config.js");

  if (fs.existsSync(tsPath)) {
    try {
      const mod = await import(tsPath);
      return mod.default ?? mod;
    } catch (e: any) {
      viteLogger.warn(`Could not import ${tsPath}: ${e?.message}`);
    }
  }

  if (fs.existsSync(jsPath)) {
    try {
      const mod = await import(jsPath);
      return mod.default ?? mod;
    } catch (e: any) {
      viteLogger.warn(`Could not import ${jsPath}: ${e?.message}`);
    }
  }

  // Fallback
  viteLogger.warn("No vite.config.ts/js found. Using inline defaults.");
  return {
    root: resolve(root, "client"),
    build: {
      outDir: resolve(root, "client", "dist"),
    },
  };
}

/**
 * ✅ Dev mode — attach Vite middleware
 */
export async function setupVite(app: Express, server: any): Promise<void> {
  const cfg = await loadViteConfig();

  const vite: ViteDevServer = await createViteServer({
    ...cfg,
    configFile: false,
    server: {
      ...cfg.server,
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true,
    },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Don’t crash dev server
      },
    },
  });

  app.use(vite.middlewares);

  // Apply rate limiting to dev HTML handler to limit filesystem reads
  const devLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // max 100 requests per window per IP
    standardHeaders: true,
    legacyHeaders: false,
    message: "Too many requests, please try again later.",
  });
  app.use("*", devLimiter);

  app.use("*", async (req, res, next) => {
    try {
      const clientTemplate = resolve(process.cwd(), "client", "index.html");
      let template = await fs.promises.readFile(clientTemplate, "utf-8");

      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const html = await vite.transformIndexHtml(req.originalUrl, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(html);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}

/**
 * ✅ Production mode — serve built static assets
 */
export function serveStatic(app: Express): void {
  const clientDir = resolve(process.cwd(), "client", "dist");

  if (!fs.existsSync(clientDir)) {
    throw new Error(
      `Could not find the build directory: ${clientDir}. Did you run 'pnpm run build:client'?`
    );
  }

  // Cache immutable static assets
  app.use((req, res, next) => {
    if (req.path.startsWith("/assets/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    next();
  });

  // Serve built files
  app.use(
    express.static(clientDir, {
      index: false,
      fallthrough: true,
    })
  );

  log(`[Static] Serving client build from ${clientDir}`);
}

// Export defaults for compatibility
export default {
  setupVite,
  serveStatic,
  log,
};
