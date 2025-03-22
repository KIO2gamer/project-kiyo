require("dotenv").config();

// Bot configuration
module.exports = {
    // Discord config
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.DISCORD_CLIENT_ID,
    guildIds: process.env.DISCORD_GUILD_IDS ? process.env.DISCORD_GUILD_IDS.split(",") : [],

    // Database config
    mongoUri: process.env.MONGODB_URI,

    // Logging config
    logLevel: process.env.LOG_LEVEL || "INFO",
    logToFile: process.env.LOG_TO_FILE === "true",

    // Rich presence configuration
    presence: {
        // Static presence (used as fallback)
        static: {
            activity: {
                name: "with Discord.js",
                type: "Playing",
                details: "Managing server tasks",
                state: "Active and ready",
            },
            status: "online",
        },

        // Dynamic presence rotation settings
        dynamic: {
            enabled: true,
            intervalMs: 150000, // 2.5 minutes between rotations

            // Available status options for random selection
            statusOptions: ["online", "idle", "dnd"],

            // Activities rotation array
            activities: [
                {
                    name: "🎮 Exploring new worlds",
                    type: "Playing",
                },
                {
                    name: "🎲 Rolling the dice",
                    type: "Playing",
                },
                {
                    name: "👾 Conquering challenges",
                    type: "Playing",
                },
                {
                    name: "🎧 music with the team",
                    type: "Listening",
                },
                {
                    name: "🎤 to your requests",
                    type: "Listening",
                },
                {
                    name: "👀 over the server",
                    type: "Watching",
                },
                {
                    name: "🛡️ Guarding your community",
                    type: "Custom",
                },
                {
                    name: "🎬 New features coming soon!",
                    type: "Custom",
                },
            ],
        },
    },

    // Development mode settings
    development: {
        enabled: process.env.NODE_ENV !== "production",
        autoReloadCommands: true,
        logLevel: "DEBUG",
    },
};
