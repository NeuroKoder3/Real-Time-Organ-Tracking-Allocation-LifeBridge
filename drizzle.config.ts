import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// -----------------------------------------------------------------------------
// ✅ Validate DATABASE_URL
// -----------------------------------------------------------------------------
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined. Please add it to your .env file.");
}

// -----------------------------------------------------------------------------
// ✅ Drizzle Configuration for Production
// -----------------------------------------------------------------------------
export default defineConfig({
  schema: "./shared/schema.ts",   // Path to your schema file
  out: "./drizzle",               // Output folder for migrations
  dialect: "postgresql",          // Postgres-compatible database
  dbCredentials: {
    url: process.env.DATABASE_URL!, // Connection URL from environment
  },

  // ---------------------------------------------------------------------------
  // 💡 Recommended Settings
  // ---------------------------------------------------------------------------
  strict: true,                    // Enforce full type-safety
  verbose: process.env.NODE_ENV !== "production", // Reduce noise in production
  casing: "snake_case",            // Ensures DB columns use consistent casing
  breakpoints: true,               // Track migration checkpoints
});
