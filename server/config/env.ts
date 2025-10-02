// server/config/env.ts
import fs from "fs";
import { join } from "path";
import dotenv from "dotenv";

// ---------------------------------------------------------
// 1) Pick env file depending on NODE_ENV
// ---------------------------------------------------------
const envFile =
  process.env.NODE_ENV === "production"
    ? ".env.production"
    : process.env.NODE_ENV === "development"
    ? ".env.development"
    : ".env";

const envPath = join(process.cwd(), envFile);

// ---------------------------------------------------------
// 2) Read env file raw (UTF-8), strip BOM
// ---------------------------------------------------------
let raw = "";
if (fs.existsSync(envPath)) {
  raw = fs.readFileSync(envPath, "utf8");
  if (raw.charCodeAt(0) === 0xfeff) raw = raw.slice(1); // strip BOM
} else {
  console.warn(`⚠️  ${envFile} file not found at ${envPath}`);
}

// ---------------------------------------------------------
// 3) Run dotenv normally (loads most keys)
// ---------------------------------------------------------
if (raw) {
  dotenv.config({ path: envPath });
  console.log(`[dotenv] Loaded ${envFile} from ${envPath}`);
}

// ---------------------------------------------------------
// 4) Hardened manual parser (fills missing keys)
// ---------------------------------------------------------
if (raw) {
  const lines = raw.split(/\r?\n/);
  for (let line of lines) {
    line = line.replace(/^\uFEFF/, "").replace(/\u200B|\u00A0/g, "").trim();
    if (!line || line.startsWith("#")) continue;

    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m) continue;

    const key = m[1];
    let value = m[2];

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    } else {
      const hashIdx = value.indexOf("#");
      if (hashIdx !== -1) value = value.slice(0, hashIdx).trim();
    }

    value = value.trim();

    if (!process.env[key] || process.env[key]?.trim() === "") {
      process.env[key] = value;
    }
  }
}

// ---------------------------------------------------------
// 5) Validation
// ---------------------------------------------------------
const isProd = process.env.NODE_ENV === "production";

function requireEnv(key: string): string {
  const v = process.env[key]?.trim();
  if (v) return v;

  if (isProd) {
    throw new Error(`❌ ${key} must be set in ${envFile} or system environment`);
  } else {
    console.warn(`⚠️ Missing env: ${key} — using development placeholder`);
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
// 6) Build ENV object
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

export function loadEnv() {
  return ENV;
}

// ---------------------------------------------------------
// 7) Debug safe preview
// ---------------------------------------------------------
try {
  const preview =
    ENV.DATABASE_URL && ENV.DATABASE_URL.length > 10
      ? `${ENV.DATABASE_URL.slice(0, 60)}...`
      : "[not set]";
  console.log(`DATABASE_URL loaded (preview): ${preview}`);
} catch {}

// Default export
export default ENV;
