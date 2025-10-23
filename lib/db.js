// lib/db.js
import { Pool } from "pg";

// Next.js will use environment variables automatically from .env
// No need for require('dotenv').config() in Next.js projects
const CONNECTION_STRING = process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  throw new Error(
    "CRITICAL ERROR: DATABASE_URL is not set in environment variables."
  );
}

// Create a connection pool instance
const pool = new Pool({
  connectionString: CONNECTION_STRING,
  // Optional: Add a few more connection options for web apps
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
    console.error("❌ Next.js Database Connection Error:", err.stack);
  });

export default pool;
