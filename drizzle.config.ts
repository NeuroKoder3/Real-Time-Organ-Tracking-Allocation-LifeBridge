import "dotenv/config";
import { defineConfig } from "drizzle-kit";

// --------------------
// ✅ Ensure DATABASE_URL exists
// --------------------
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined. Please check your .env file.");
}

// --------------------
// ✅ Drizzle Config
// --------------------
export default defineConfig({
  out: "./drizzle",              // Folder for generated migrations
  schema: "./shared/schema.ts",  // Path to schema
  dialect: "postgresql",         // Using Neon/Postgres
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,                 // Extra logging for debugging
  strict: true,                  // Strong typing for safety
});
