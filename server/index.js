const { Client, GatewayIntentBits, REST, Routes } = require("discord.js");
require("dotenv").config();
const express = require("express");
const pool = require("./db"); // Import the database pool

// --- Configuration ---
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = "1430429476583379096"; // Your Bot Client ID
const GUILD_ID = "1275537620935512074"; // Your Guild ID
const WEBHOOK_PORT = process.env.WEBHOOK_PORT || 3001; // Port for the Express server
const ADMIN_CHANNEL_ID = process.env.ADMIN_CHANNEL_ID; // Channel for applications

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// --- Role Definitions (Used for Command Choices) ---

const ROLE_IMAGE_MAP = {
  // MOBA Roles
  Top: true,
  Jungle: true,
  Mid: true,
  ADC: true,
  Support: true,
  // FPS Roles
  AWPer: true,
  Entry_Fragger: true,
  Controller: true,
  Sentinel: true,
  Duelist: true,
  // General/Fallback Roles
  Captain: true,
  Flex: true,
  Striker: true,
  Midfielder: true,
  Goalkeeper: true,
  Tank: true,
  Damage: true,
  Heals: true,
  Fragger: true,
  Scout: true,
  In_Game_Leader: true,
  Lurker: true,
  DEFAULT: true,
};

// Generate choices array for the Discord command
const roleChoices = Object.keys(ROLE_IMAGE_MAP)
  .filter((role) => role !== "DEFAULT")
  .map((role) => ({
    name: role,
    value: role,
  }));

// --- Security Function ---

/**
 * Checks if a given Discord user ID is present in the Admins table.
 * @param {string} discordId - The Discord user's snowflake ID.
 * @returns {Promise<boolean>}
 */
async function isAdmin(discordId) {
  const query = "SELECT discord_id FROM Admins WHERE discord_id = $1";

  try {
    const result = await pool.query(query, [discordId.toString()]);
    return result.rows.length > 0;
  } catch (error) {
    console.error(
      `[Admin Check] DB Error during check for ID ${discordId}:`,
      error.stack
    );
    return false;
  }
}

// ------------------------------------------------------------------
// --- Express Webhook Logic ---
// ------------------------------------------------------------------

/**
 * Posts the join application details to a specific Discord channel.
 * @param {object} formData - The data submitted from the web form.
 */
async function postApplicationToDiscord(formData) {
  // 1. Initial State Check (Enhanced logging for easier debugging)
  if (!client.isReady()) {
    console.error("❌ [Webhook] Client not ready. Application not posted.");
    return {
      success: false,
      message: "Bot is initializing. Try again in a moment.",
    };
  }

  if (!ADMIN_CHANNEL_ID) {
    console.error("❌ [Webhook] ADMIN_CHANNEL_ID is not configured in .env.");
    return {
      success: false,
      message: "Server configuration error: Admin channel ID is missing.",
    };
  }

  try {
    // 2. Fetch Channel
    const channel = await client.channels.fetch(ADMIN_CHANNEL_ID);

    if (!channel || !channel.send) {
      console.error(
        `❌ [Webhook] Channel ID ${ADMIN_CHANNEL_ID} not found or is not a text channel.`
      );
      return {
        success: false,
        message: "Target Discord channel not found or inaccessible.",
      };
    }

    // 3. Construct and Send Message
    const messageContent = {
      embeds: [
        {
          title: "🚨 NEW WEB APPLICATION RECEIVED",
          color: 0x00ff00, // Green
          fields: [
            { name: "Full Name", value: formData.name || "N/A", inline: true },
            {
              name: "Discord Username",
              value: `\`${formData.discord}\`` || "N/A",
              inline: true,
            },
            {
              name: "Email Address",
              value: formData.email || "N/A",
              inline: false,
            },
            {
              name: "Phone Number",
              value: formData.phone || "*(Not Provided)*",
              inline: false,
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    await channel.send(messageContent);
    console.log(
      `✅ [Webhook] Application successfully posted for: ${formData.name}`
    );
    return { success: true, message: "Application submitted and posted." };
  } catch (error) {
    console.error(
      "🔥 [Webhook] Error sending message to Discord API:",
      error.stack
    );
    return {
      success: false,
      message: "Failed to communicate with Discord API.",
    };
  }
}

// ------------------------------------------------------------------
// --- EXPRESS WEBHOOK SETUP (Corrected Initialization) ---
// ------------------------------------------------------------------

// 🛑 ISSUE FIXED: 'app' is defined once globally here.
const app = express();
app.use(express.json()); // CRITICAL: Middleware to parse JSON request bodies

// Route to receive POST data from the Next.js frontend
app.post("/webhook/application", async (req, res) => {
  const formData = req.body;
  // LOG 1: Confirm data arrival
  console.log(
    "➡️ [Express] Received application data via webhook for:",
    formData.name || "Unknown"
  );

  // Basic Validation Check
  if (!formData.name || !formData.discord || !formData.email) {
    // LOG 2: Invalid data received
    console.error(
      "❌ [Express] Rejected: Missing required fields (name, discord, email)."
    );
    return res.status(400).json({
      success: false,
      message: "Missing required fields (name, discord, email).",
    });
  }

  // Call the Discord message function
  const result = await postApplicationToDiscord(formData);

  if (result.success) {
    // LOG 3: Successful post
    return res.status(200).json(result);
  } else {
    // LOG 4: Failure in Discord posting logic
    console.error(
      `❌ [Express] Failed to post to Discord. Status: 503, Reason: ${result.message}`
    );
    // Return a server error if the bot failed to post the message
    return res.status(503).json(result);
  }
});

// ------------------------------------------------------------------
// --- COMMAND DEFINITIONS (EXISTING) ---
// ------------------------------------------------------------------

const commands = [
  {
    name: "ping",
    description: "Replies with Pong!",
  },
  {
    name: "add_game",
    description: "Registers a new game to the database (Admin only).",
    options: [
      {
        name: "name",
        type: 3,
        description: "The name of the new game.",
        required: true,
      },
      {
        name: "player_count",
        type: 4,
        description: "The required player count for the game.",
        required: true,
      },
    ],
  },
  {
    name: "add_team",
    description: "Registers a new team for a specific game (Admin only).",
    options: [
      {
        name: "game_name",
        type: 3,
        description: "The name of the game the team belongs to.",
        required: true,
      },
      {
        name: "team_name",
        type: 3,
        description: "The name of the new team.",
        required: true,
      },
    ],
  },
  {
    name: "remove_game",
    description: "Deletes a game and all related teams/players (Admin only).",
    options: [
      {
        name: "name",
        type: 3,
        description: "The name of the game to remove.",
        required: true,
      },
    ],
  },
  {
    name: "add_player",
    description: "Registers a player to a team (Admin only).",
    options: [
      {
        name: "user",
        type: 6,
        description: "The Discord user to add as a player.",
        required: true,
      },
      {
        name: "team_name",
        type: 3,
        description: "The name of the team the player is joining.",
        required: true,
      },
      {
        name: "role",
        type: 3,
        description: "The player's role (e.g., Captain, Support).",
        required: true,
        choices: roleChoices,
      },
    ],
  },
  {
    name: "remove_player",
    description: "Removes a player from the database (Admin only).",
    options: [
      {
        name: "user",
        type: 6,
        description: "The Discord user to remove.",
        required: true,
      },
    ],
  },
  {
    name: "list_teams",
    description: "Displays all teams for a specific game.",
    options: [
      {
        name: "game_name",
        type: 3,
        description: "The game to list teams for.",
        required: true,
      },
    ],
  },
];

// ------------------------------------------------------------------
// --- BOT EVENTS ---
// ------------------------------------------------------------------

// --- Bot Ready Event (Registers Commands and starts Express) ---
client.on("ready", async () => {
  console.log(`🤖 Logged in as ${client.user.tag}!`);

  // Start the Express server
  app.listen(WEBHOOK_PORT, () => {
    // Enhanced logging
    console.log(
      `✅ 🌐 Webhook server listening on port ${WEBHOOK_PORT} (http://localhost:${WEBHOOK_PORT})`
    );
    console.log(
      `Endpoint: http://localhost:${WEBHOOK_PORT}/webhook/application`
    );
  });

  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  try {
    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
});

// --- Slash Command Handler (Existing Logic) ---

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const { commandName, user, options } = interaction;
  const userId = user.id;
  const isEphemeral = true; // Use ephemeral for admin feedback

  // ----------------------------------------------------
  // PING
  // ----------------------------------------------------
  if (commandName === "ping") {
    await interaction.reply("Pong!");
  }

  // ----------------------------------------------------
  // ADMIN CHECK FOR ALL FOLLOWING COMMANDS
  // ----------------------------------------------------
  if (commandName !== "ping" && commandName !== "list_teams") {
    if (!(await isAdmin(userId))) {
      return interaction.reply({
        content:
          "🚨 **Unauthorized:** This command can only be used by bot administrators.",
        ephemeral: true,
      });
    }
  }

  // ----------------------------------------------------
  // /add_game
  // ----------------------------------------------------
  if (commandName === "add_game") {
    const gameName = options.getString("name");
    const playerCount = options.getInteger("player_count");
    const query = `INSERT INTO Games (name, player_count) VALUES ($1, $2)`;

    try {
      await pool.query(query, [gameName, playerCount]);
      await interaction.reply({
        content: `✅ Game **${gameName}** (Players: ${playerCount}) has been added.`,
        ephemeral: isEphemeral,
      });
    } catch (error) {
      let replyContent = "❌ An unknown database error occurred.";
      if (error.code === "23505") {
        replyContent = `❌ Error: The game **${gameName}** already exists.`;
      } else {
        console.error(`DB Error executing /add_game:`, error.stack);
      }
      await interaction.reply({
        content: replyContent,
        ephemeral: isEphemeral,
      });
    }
  }

  // ----------------------------------------------------
  // /add_team
  // ----------------------------------------------------
  if (commandName === "add_team") {
    const gameName = options.getString("game_name");
    const teamName = options.getString("team_name");

    try {
      // 1. Get the Game ID
      const gameResult = await pool.query(
        "SELECT game_id FROM Games WHERE name = $1",
        [gameName]
      );

      if (gameResult.rows.length === 0) {
        return interaction.reply({
          content: `❌ Error: Game **${gameName}** not found.`,
          ephemeral: isEphemeral,
        });
      }
      const gameId = gameResult.rows[0].game_id;

      // 2. Insert the new Team
      await pool.query(
        "INSERT INTO Teams (game_id, team_name) VALUES ($1, $2)",
        [gameId, teamName]
      );

      await interaction.reply({
        content: `✅ Team **${teamName}** added to game **${gameName}**.`,
        ephemeral: isEphemeral,
      });
    } catch (error) {
      let replyContent = "❌ An unknown database error occurred.";
      if (error.code === "23505") {
        replyContent = `❌ Error: Team **${teamName}** already exists for game **${gameName}**.`;
      } else {
        console.error(`DB Error executing /add_team:`, error.stack);
      }
      await interaction.reply({
        content: replyContent,
        ephemeral: isEphemeral,
      });
    }
  }

  // ----------------------------------------------------
  // /remove_game
  // ----------------------------------------------------
  if (commandName === "remove_game") {
    const gameName = options.getString("name");

    try {
      const result = await pool.query(
        "DELETE FROM Games WHERE name = $1 RETURNING game_id",
        [gameName]
      );

      if (result.rowCount === 0) {
        return interaction.reply({
          content: `❌ Error: Game **${gameName}** not found.`,
          ephemeral: isEphemeral,
        });
      }

      await interaction.reply({
        content: `✅ Game **${gameName}** and all associated teams/players have been permanently removed.`,
        ephemeral: isEphemeral,
      });
    } catch (error) {
      console.error(`DB Error executing /remove_game:`, error.stack);
      await interaction.reply({
        content: "❌ An unknown database error occurred during deletion.",
        ephemeral: isEphemeral,
      });
    }
  }

  // ----------------------------------------------------
  // /add_player
  // ----------------------------------------------------
  if (commandName === "add_player") {
    const playerDiscordUser = options.getUser("user");
    const playerDiscordId = playerDiscordUser.id;
    const playerName = playerDiscordUser.username;
    const teamName = options.getString("team_name");
    const playerRole = options.getString("role");

    try {
      // 1. Get the Team ID
      const teamResult = await pool.query(
        "SELECT team_id FROM Teams WHERE team_name = $1",
        [teamName]
      );

      if (teamResult.rows.length === 0) {
        return interaction.reply({
          content: `❌ Error: Team **${teamName}** not found.`,
          ephemeral: isEphemeral,
        });
      }
      const teamId = teamResult.rows[0].team_id;

      // 2. Insert the new Player
      await pool.query(
        "INSERT INTO Players (discord_id, name, team_id, role) VALUES ($1, $2, $3, $4)",
        [playerDiscordId.toString(), playerName, teamId, playerRole]
      );

      await interaction.reply({
        content: `✅ Player **${playerName}** has been added to **${teamName}** as **${playerRole}**.`,
        ephemeral: isEphemeral,
      });
    } catch (error) {
      let replyContent = "❌ An unknown database error occurred.";
      if (error.code === "23505") {
        replyContent = `❌ Error: The user **${playerName}** is already registered as a player.`;
      } else {
        console.error(`DB Error executing /add_player:`, error.stack);
      }
      await interaction.reply({
        content: replyContent,
        ephemeral: isEphemeral,
      });
    }
  }

  // ----------------------------------------------------
  // /remove_player
  // ----------------------------------------------------
  if (commandName === "remove_player") {
    const playerDiscordUser = options.getUser("user");
    const playerDiscordId = playerDiscordUser.id;

    try {
      const result = await pool.query(
        "DELETE FROM Players WHERE discord_id = $1 RETURNING player_id",
        [playerDiscordId.toString()]
      );

      if (result.rowCount === 0) {
        return interaction.reply({
          content: `❌ Error: Player **${playerDiscordUser.username}** not found in database.`,
          ephemeral: isEphemeral,
        });
      }

      await interaction.reply({
        content: `✅ Player **${playerDiscordUser.username}** has been removed from the database.`,
        ephemeral: isEphemeral,
      });
    } catch (error) {
      console.error(`DB Error executing /remove_player:`, error.stack);
      await interaction.reply({
        content: "❌ An unknown database error occurred during deletion.",
        ephemeral: isEphemeral,
      });
    }
  }

  // ----------------------------------------------------
  // /list_teams (Public Command - No Admin Check)
  // ----------------------------------------------------
  if (commandName === "list_teams") {
    const gameName = options.getString("game_name");

    try {
      // 1. Get all teams for the game
      const teamsQuery = `
          SELECT t.team_id, t.team_name
          FROM Teams t
          JOIN Games g ON t.game_id = g.game_id
          WHERE g.name ILIKE $1
          ORDER BY t.team_name;
        `;

      const teamsResult = await pool.query(teamsQuery, [`%${gameName}%`]);

      if (teamsResult.rows.length === 0) {
        return interaction.reply(
          `ℹ️ No teams found for game matching **${gameName}**, or the game name is incorrect.`
        );
      }

      let teamsList = [];

      // loopin thru each team to check players
      for (const team of teamsResult.rows) {
        const playersQuery = `
              SELECT name, role
              FROM Players
              WHERE team_id = $1
              ORDER BY role;
            `;
        const playersResult = await pool.query(playersQuery, [team.team_id]);

        const playerCount = playersResult.rows.length;
        let playerDetails = `(${playerCount} players)`;

        if (playerCount > 0) {
          const playerLines = playersResult.rows
            .map((player) => ` • ${player.name} (${player.role})`)
            .join("\n");
          playerDetails = `\n${playerLines}`;
        }

        teamsList.push(`**${team.team_name}** ${playerDetails}`);
      }

      const replyContent =
        `## 🏆 Teams List\n` +
        `Game: **${gameName}**\n` +
        `------------------------\n` +
        `${teamsList.join("\n\n")}`; // Use double newline to separate teams

      await interaction.reply(replyContent);
    } catch (error) {
      console.error(`DB Error executing /list_teams:`, error.stack);
      await interaction.reply({
        content: "❌ An error occurred while fetching teams.",
        ephemeral: true,
      });
    }
  }
});

// --- Start the Bot ---

client.login(DISCORD_TOKEN);
