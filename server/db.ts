// server/db.ts

// ---------------------------------------------------------
// ✅ Load environment variables FIRST
// ---------------------------------------------------------
import "./config/env";

// ---------------------------------------------------------
// Imports AFTER env is loaded
// ---------------------------------------------------------
import pkg from "pg"; // 👈 Correct import for Pool from pg
import { drizzle } from "drizzle-orm/node-postgres"; // 👈 drizzle adapter for pg
import * as schema from "../shared/schema"; // fixed: removed .js extension

const { Pool } = pkg; // Destructure Pool from pg import

// ---------------------------------------------------------
// ✅ Validate environment variable
// ---------------------------------------------------------
if (!process.env.DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined in environment variables.");
}

// ---------------------------------------------------------
// ✅ Create a connection pool
// ---------------------------------------------------------
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 10,
});

// ---------------------------------------------------------
// ✅ Initialize Drizzle ORM with typed schema
// ---------------------------------------------------------
export const db = drizzle(pool, { schema });

// ---------------------------------------------------------
// ✅ Graceful shutdown (only for local/dev)
// ---------------------------------------------------------
if (process.env.NODE_ENV !== "production") {
  process.on("SIGINT", async () => {
    console.log("🛑 Closing database pool...");
    await pool.end();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    console.log("🛑 Closing database pool...");
    await pool.end();
    process.exit(0);
  });
}

// ---------------------------------------------------------
// ✅ Export (both named + default)
// ---------------------------------------------------------
export default db;
