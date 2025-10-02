// server/vite.ts
import express, { type Express } from "express";
import fs from "fs";
import { resolve } from "path";
import { createServer as createViteServer, createLogger, type InlineConfig } from "vite";
import { type Server } from "http";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

/**
 * Simple timestamped logger
 */
export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}

/**
 * Try to load the root vite config (works for vite.config.ts or .js)
 */
async function loadViteConfig(): Promise<InlineConfig> {
  const root = process.cwd();
  const tsPath = resolve(root, "vite.config.ts");
  const jsPath = resolve(root, "vite.config.js");

  // Prefer TS config
  if (fs.existsSync(tsPath)) {
    try {
      const mod = await import(tsPath);
      return (mod as any).default ?? (mod as any);
    } catch (e) {
      viteLogger.warn(`Could not import ${tsPath}: ${(e as Error)?.message}`);
    }
  }

  if (fs.existsSync(jsPath)) {
    try {
      const mod = await import(jsPath);
      return (mod as any).default ?? (mod as any);
    } catch (e) {
      viteLogger.warn(`Could not import ${jsPath}: ${(e as Error)?.message}`);
    }
  }

  // Fallback: minimal inline config
  viteLogger.warn("No vite.config.ts/js found. Using inline defaults.");
  return {
    root: resolve(root, "client"),
    build: {
      outDir: resolve(root, "client", "dist"),
    },
  };
}

/**
 * Development: attach Vite middlewares
 */
export async function setupVite(app: Express, server: Server) {
  const cfg = await loadViteConfig();

  const vite = await createViteServer({
    ...(cfg as InlineConfig),
    configFile: false, // we already loaded/merged config
    server: {
      ...(cfg as InlineConfig).server,
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as const,
    },
    appType: "custom",
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        // Don't crash dev server; just log
      },
    },
  });

  app.use(vite.middlewares);

  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = resolve(process.cwd(), "client", "index.html");

      // Always reload index.html (so changes are reflected in dev)
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );

      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}

/**
 * Production: serve built static assets
 * NOTE: SPA fallback is handled in index.ts to avoid route order conflicts.
 */
export function serveStatic(app: Express) {
  // Fixed path: client/dist
  const clientDir = resolve(process.cwd(), "client", "dist");

  if (!fs.existsSync(clientDir)) {
    throw new Error(
      `Could not find the build directory: ${clientDir}. Did you run 'pnpm run build:client'?`
    );
  }

  // Cache immutable assets aggressively
  app.use((req, res, next) => {
    if (req.path.startsWith("/assets/")) {
      res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    }
    next();
  });

  // Serve static files with correct MIME types; don't auto-serve index.html here.
  app.use(
    express.static(clientDir, {
      index: false,
      fallthrough: true,
    })
  );

  log(`[Static] Serving client build from ${clientDir}`);
}

// Default export for compatibility
export default { setupVite, serveStatic, log };
