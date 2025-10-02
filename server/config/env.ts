// server/config/env.ts
import fs from "fs";
import { join } from "path";
import dotenv from "dotenv";

const envPath = join(process.cwd(), ".env");

// ---------------------------------------------------------
// 1) Read .env as raw text (UTF-8), strip BOM, normalize
// ---------------------------------------------------------
let raw = "";
if (fs.existsSync(envPath)) {
  raw = fs.readFileSync(envPath, "utf8");
  // strip BOM
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1);
} else {
  console.warn(`⚠️  .env file not found at ${envPath}`);
}

// ---------------------------------------------------------
// 2) First: run dotenv normally (loads most keys)
// ---------------------------------------------------------
if (raw) {
  dotenv.config({ path: envPath });
  console.log(`[dotenv] Loaded .env from ${envPath}`);
}

// ---------------------------------------------------------
// 3) Hardened manual parser to inject ANY missing keys
//    - Ignores comments
//    - Supports quoted values
//    - Trims stray/invisible chars
//    - Works around CRLF / weird whitespace
// ---------------------------------------------------------
if (raw) {
  const lines = raw.split(/\r?\n/);
  for (let line of lines) {
    // trim and remove leading BOM / zero-width / NBSP
    line = line.replace(/^\uFEFF/, "").replace(/\u200B|\u00A0/g, "").trim();
    if (!line || line.startsWith("#")) continue;

    // match KEY=VALUE (KEY is A-Z,0-9,_, starting with letter/_)
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;

    const key = m[1];
    let value = m[2];

    // quoted value handling
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      // strip trailing inline comments on unquoted values
      const hashIdx = value.indexOf("#");
      if (hashIdx !== -1) value = value.slice(0, hashIdx).trim();
    }

    value = value.trim();

    // inject ONLY if missing or empty
    if (!process.env[key] || process.env[key]?.trim() === "") {
      process.env[key] = value;
      // console.log(`[dotenv-fallback] Injected ${key}`);
    }
  }
}

// ---------------------------------------------------------
// 4) Validation (prod must throw; dev/test warn & set placeholder)
// ---------------------------------------------------------
const isProd = process.env.NODE_ENV === "production";

function requireEnv(key: string): string {
  const v = process.env[key]?.trim();
  if (v) return v;

  const msg = `Missing env: ${key}`;
  if (isProd) {
    throw new Error(`❌ ${key} must be set in your environment (.env / CI vars)`);
  } else {
    // In non-production, warn and set a safe placeholder to avoid boot crashes.
    console.warn(`⚠️  ${msg} — using development placeholder value.`);
    const placeholder = getDevPlaceholder(key);
    process.env[key] = placeholder;
    return placeholder;
  }
}

function getDevPlaceholder(key: string): string {
  switch (key) {
    case "DATABASE_URL":
      return "postgres://user:password@localhost:5432/lifebridge_dev";
    case "JWT_SECRET":
      return "changeme";
    case "REFRESH_SECRET":
      return "refreshchangeme";
    case "ENCRYPTION_MASTER_KEY":
    case "ENCRYPTION_DETERMINISTIC_KEY":
      // 32 bytes hex (64 chars) – acceptable dev placeholder
      return "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    case "ENCRYPTION_KEY_VERSION":
      return "1";
    case "PORT":
      return "5000";
    default:
      return "";
  }
}

// ---------------------------------------------------------
// 5) Build ENV object
// ---------------------------------------------------------
export const ENV = {
  DATABASE_URL: requireEnv("DATABASE_URL"),
  JWT_SECRET: requireEnv("JWT_SECRET"),
  REFRESH_SECRET: requireEnv("REFRESH_SECRET"),
  ENCRYPTION_MASTER_KEY: requireEnv("ENCRYPTION_MASTER_KEY"),
  ENCRYPTION_DETERMINISTIC_KEY: requireEnv("ENCRYPTION_DETERMINISTIC_KEY"),
  ENCRYPTION_KEY_VERSION: requireEnv("ENCRYPTION_KEY_VERSION"),
  PORT: process.env.PORT || "5000",
};

// Convenience helper if you need to ensure env is loaded elsewhere
export function loadEnv() {
  return ENV;
}

// ---------------------------------------------------------
// 6) Minimal debug (safe preview)
// ---------------------------------------------------------
try {
  const preview =
    ENV.DATABASE_URL && ENV.DATABASE_URL.length > 10
      ? `${ENV.DATABASE_URL.slice(0, 60)}...`
      : "[not set]";
  console.log(`DATABASE_URL loaded (preview): ${preview}`);
} catch {
  // swallow preview errors
}

// Export default for compatibility with default imports
export default ENV;
