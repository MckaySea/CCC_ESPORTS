// db.js
const { Pool } = require("pg");
require("dotenv").config();

const CONNECTION_STRING = process.env.DATABASE_URL;

if (!CONNECTION_STRING) {
  console.error("❌ CRITICAL ERROR: DATABASE_URL not found in .env file.");
  process.exit(1);
}

// Create a connection pool using the connection string
const pool = new Pool({
  connectionString: CONNECTION_STRING,
});

// Attempt to connect and log status
pool
  .connect()
  .then((client) => {
    // Successful connection
    console.log("✅ PostgreSQL connection pool ready.");
    client.release(); // Release the client back to the pool
  })
  .catch((err) => {
    // Connection Failure

    // Log the connection details being used (masked password)
    const parsedUrl = new URL(CONNECTION_STRING);
    const loggableUrl = `postgresql://${parsedUrl.username}@${parsedUrl.host}:${parsedUrl.port}${parsedUrl.pathname}`;

    console.error("----------------------------------------------------");
    console.error("❌ DATABASE CONNECTION FAILED");
    console.error(`Attempted URL (Masked Password): ${loggableUrl}`);

    // Check for specific common error types
    if (err.code === "ECONNREFUSED") {
      console.error("🚨 Error Type: CONNECTION REFUSED (ECONNREFUSED)");
      console.error(
        "HINT: Ensure the PostgreSQL service is actively RUNNING and listening on the specified host/port (localhost:5432)."
      );
    } else if (err.code === "28P01") {
      console.error("🚨 Error Type: INVALID CREDENTIALS (28P01)");
      console.error(
        "HINT: Double-check the DB_USER and DB_PASSWORD in your .env file."
      );
    } else if (err.code === "3D000") {
      console.error("🚨 Error Type: DATABASE DOES NOT EXIST (3D000)");
      console.error("HINT: Check the DB_NAME in your .env file.");
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
