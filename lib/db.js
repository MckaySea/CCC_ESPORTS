import { Pool } from "pg";

// Prioritize POSTGRES_PRISMA_URL (the pooler URL), but fall back to DATABASE_URL
const CONNECTION_STRING =
  process.env.POSTGRES_PRISMA_URL || process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  throw new Error(
    "CRITICAL ERROR: POSTGRES_PRISMA_URL or DATABASE_URL is not set in environment variables."
  );
}

// Create a connection pool instance
const pool = new Pool({
  connectionString: CONNECTION_STRING,
  // CRITICAL FIX for Vercel/Supabase PGBouncer SSL issue:
  // This tells the client to use SSL but bypasses the strict
  // certificate chain validation that fails on deployment environments.
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20, // max number of clients in the pool
  idleTimeoutMillis: 30000, // close clients after 30 seconds idle
});

pool
  .connect()
  .then((client) => {
    console.log("✅ Next.js DB connection pool ready.");
    client.release();
  })
  .catch((err) => {
    // Log error using Vercel-friendly logging style
    console.error("❌ Next.js Database Connection Error:", err.message);
    // Throwing the error here allows Next.js build/runtime processes to catch it gracefully
    throw new Error(`Database connection failed: ${err.message}`);
  });

export default pool;
