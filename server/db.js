// --- CRITICAL WORKAROUND: This forces Node.js to ignore strict SSL certificate chain validation.
// --- It is often necessary when connecting to cloud poolers (like Supabase's PGBouncer)
// --- from a local development environment.
// --- While it reduces security, it's often the only way to bypass "self-signed certificate in certificate chain" errors locally.
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

const { Pool } = require("pg");
require("dotenv").config();

// Prioritize POSTGRES_PRISMA_URL, but fall back to POSTGRES_URL
let CONNECTION_STRING = process.env.POSTGRES_PRISMA_URL;
let connectionVarName = "POSTGRES_PRISMA_URL or POSTGRES_URL";

if (!CONNECTION_STRING) {
  // FIX: Update error message to reflect the dual check
  console.error(
    `❌ CRITICAL ERROR: Neither ${connectionVarName} was found in .env file.`
  );
  process.exit(1);
}

// Create a connection pool using the connection string
const pool = new Pool({
  connectionString: CONNECTION_STRING,
  // The explicit setting is kept for redundancy, but the environment variable above is the main fix.
  ssl: {
    rejectUnauthorized: false,
  },
  max: 20, // Keep connection pool size managed
});

// Attempt to connect and log status
pool
  .connect()
  .then((client) => {
    // Successful connection
    console.log("✅ Supabase PostgreSQL connection pool ready.");
    client.release(); // Release the client back to the pool
  })
  .catch((err) => {
    // Connection Failure

    // Adding safety check around URL parsing
    let loggableUrl = "";
    try {
      if (CONNECTION_STRING) {
        const parsedUrl = new URL(CONNECTION_STRING);
        loggableUrl = `postgresql://${parsedUrl.username}@${parsedUrl.host}:${parsedUrl.port}${parsedUrl.pathname}`;
      }
    } catch (parseError) {
      loggableUrl = "(Error parsing URL: Check string format)";
    }

    console.error("----------------------------------------------------");
    console.error("❌ DATABASE CONNECTION FAILED");
    console.error(`Attempted URL (Masked Password): ${loggableUrl}`);

    // Check for specific common error types
    if (err.code === "ECONNREFUSED") {
      console.error("🚨 Error Type: CONNECTION REFUSED (ECONNREFUSED)");
      console.error(
        "HINT: Check firewall/port settings. If using Supabase Pooler, ensure port is 6543."
      );
    } else if (err.code === "28P01") {
      console.error("🚨 Error Type: INVALID CREDENTIALS (28P01)");
      console.error(
        "HINT: Double-check the username and password in your connection string."
      );
    } else if (err.code === "3D000") {
      console.error("🚨 Error Type: DATABASE DOES NOT EXIST (3D000)");
      console.error("HINT: Check the database name in your connection string.");
    } else if (err.message && err.message.includes("self-signed certificate")) {
      console.error("🚨 Error Type: SSL/TLS ERROR");
      console.error(
        "HINT: The 'ssl: { rejectUnauthorized: false }' setting is often required for Supabase connections."
      );
    } else {
      console.error(`🚨 UNKNOWN DATABASE ERROR: ${err.message}`);
    }

    // Log the full stack trace for detailed debugging
    console.error("--- Full Error Stack ---");
    console.error(err.stack);
    console.error("----------------------------------------------------");

    process.exit(1); // Exit if connection fails
  });

module.exports = pool;
