const pool = require("./db");

// Define the complete SQL schema using the tables you provided
const setupSchemaSQL = `
-- Create the Games Table
CREATE TABLE IF NOT EXISTS Games (
    game_id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    player_count INT NOT NULL
);

-- Create the Teams Table (Linking to a game)
CREATE TABLE IF NOT EXISTS Teams (
    team_id SERIAL PRIMARY KEY,
    game_id INT REFERENCES Games(game_id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    UNIQUE (game_id, team_name)
);

-- Create the Players Table (Linking to a team and a user's Discord ID)
CREATE TABLE IF NOT EXISTS Players (
    player_id SERIAL PRIMARY KEY,
    -- Discord User IDs are stored as BIGINT
    discord_id BIGINT UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    -- ON DELETE SET NULL allows a player to exist even if their team is deleted
    team_id INT REFERENCES Teams(team_id) ON DELETE SET NULL,
    role VARCHAR(50)
);

-- Create the Admin Table (For permission checks)
CREATE TABLE IF NOT EXISTS Admins (
    discord_id BIGINT PRIMARY KEY
);
`;

/**
 * Executes the schema creation SQL against the database pool.
 */
async function setupDatabase() {
  console.log("🚀 Starting database schema setup...");
  try {
    // Execute the multi-statement script via the connection pool
    await pool.query(setupSchemaSQL);

    console.log("----------------------------------------------------");
    console.log(
      "✅ SUCCESS: All four tables (Games, Teams, Players, Admins) have been created or verified."
    );
    console.log("The database is now ready for use by your index.js bot.");
    console.log("----------------------------------------------------");
  } catch (error) {
    console.error("❌ FAILURE: Error executing database setup script.");
    console.error(
      "Check the connection string in your .env and the syntax of the SQL."
    );
    console.error(error.stack);
  } finally {
    // End the pool connection to allow the script to exit cleanly
    pool.end();
  }
}

// Run the setup function
setupDatabase();
