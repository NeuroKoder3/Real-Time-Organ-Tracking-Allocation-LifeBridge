import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// -----------------------------------------------------------------------------
// ✅ Set and Validate DATABASE_URL
// -----------------------------------------------------------------------------
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = "postgres://postgres:postgres@localhost:5433/lifebridge";
  console.warn("⚠️  DATABASE_URL not found in .env — defaulting to local PostgreSQL on port 5433");
}

if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined and no fallback could be set.");
}

// -----------------------------------------------------------------------------
// ✅ Drizzle Configuration
// -----------------------------------------------------------------------------
export default defineConfig({
  schema: "./shared/schema.ts",        // Path to your schema
  out: "./drizzle",                    // Output folder for generated migrations
  dialect: "postgresql",               // Using PostgreSQL dialect
  dbCredentials: {
    url: process.env.DATABASE_URL,     // Use validated/fallback URL
  },

  // ---------------------------------------------------------------------------
  // 💡 Recommended Settings
  // ---------------------------------------------------------------------------
  strict: true,                         // Enforce full type safety
  verbose: process.env.NODE_ENV !== "production", // Enable logs in dev
  casing: "snake_case",                 // Use consistent snake_case
  breakpoints: true,                    // Enable migration checkpoints
});
