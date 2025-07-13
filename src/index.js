require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { REST, Routes, Client, Collection, GatewayIntentBits, ActivityType } = require("discord.js");
const Logger = require("./utils/logger");
const PresenceManager = require("./utils/presenceManager");
const CommandPermissions = require("./database/commandPermissions");

// Client-related functions
/**
 * Creates and configures a new Discord.js client
 * @returns {Client} Configured Discord client
 */
function createClient() {
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers,
        ],
    });

    // Initialize collections
    client.commands = new Collection();
    client.cooldowns = new Collection();

    return client;
}

/**
 * Loads command files from the specified directory
 * @param {Client} client Discord client
 * @param {string} commandsPath Path to the commands directory
 */
function loadCommands(client, commandsPath) {
    Logger.log("COMMANDS", "Loading commands...");

    if (!fs.existsSync(commandsPath)) {
        Logger.warn(`Commands directory not found: ${commandsPath}`);
        return;
    }

    const commandFolders = fs.readdirSync(commandsPath);
    let commandCount = 0;

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);

        // Skip if not a directory
        if (!fs.statSync(folderPath).isDirectory()) continue;

        const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));

        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);
            const command = require(filePath);

            if ("data" in command && "execute" in command) {
                client.commands.set(command.data.name, command);
                commandCount++;
            } else {
                Logger.warn(
                    `Command at ${filePath} is missing required "data" or "execute" property`,
                );
            }
        }
    }

    Logger.success(`Loaded ${commandCount} commands`);
}

/**
 * Loads event handlers from the specified directory
 * @param {Client} client Discord client
 * @param {string} eventsPath Path to the events directory
 */
function loadEvents(client, eventsPath) {
    Logger.log("EVENTS", "Loading events...");

    if (!fs.existsSync(eventsPath)) {
        Logger.warn(`Events directory not found: ${eventsPath}`);
        return;
    }

    const eventFiles = fs.readdirSync(eventsPath).filter((file) => file.endsWith(".js"));
    let eventCount = 0;

    for (const file of eventFiles) {
        const filePath = path.join(eventsPath, file);
        const event = require(filePath);

        if (event.once) {
            client.once(event.name, (...args) => event.execute(...args));
        } else {
            client.on(event.name, (...args) => event.execute(...args));
        }
        eventCount++;
    }

    Logger.success(`Loaded ${eventCount} events`);
}

/**
 * Sets up the rich presence for the bot
 * @param {Client} client Discord client
 * @param {Object} config Bot configuration
 */
function setRichPresence(client, config) {
    const presenceManager = new PresenceManager(client, config);
    presenceManager.startRotation();

    // Store the manager on the client for later access if needed
    client.presenceManager = presenceManager;
}

// Bot configuration
const config = {
    // Discord config
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENTID,
    guildIds: process.env.GUILDID ? process.env.GUILDID.split(",") : [],

    // Database config
    mongoUri: process.env.MONGODB_URL,

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

// Connect to MongoDB
const connectToMongoDB = async () => {
    Logger.log("DATABASE", "Connecting to MongoDB...");
    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect(config.mongoUri);
        Logger.success("Connected to MongoDB");
    } catch (error) {
        Logger.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

// Deploy commands to Discord API
const deployCommands = async (client) => {
    Logger.log("DEPLOY", "Deploying commands...");
    const commands = [];

    client.commands.forEach((command) => {
        if (command?.data?.toJSON) {
            commands.push(command.data.toJSON());
        }
    });

    const rest = new REST({ version: "10" }).setToken(config.token);
    try {
        await rest.put(Routes.applicationCommands(config.clientId), {
            body: [],
        });

        for (const guildId of config.guildIds) {
            try {
                const result = await rest.put(
                    Routes.applicationGuildCommands(config.clientId, guildId),
                    { body: commands },
                );
                Logger.success(
                    `Successfully deployed ${result.length} commands to guild ${guildId}`,
                );
            } catch (error) {
                Logger.error(`Failed to deploy commands to guild ${guildId}: ${error}`);
            }
        }
    } catch (error) {
        Logger.error(`Command deployment failed: ${error}`);
    }
};

// Setup graceful shutdown
const setupGracefulShutdown = (client) => {
    process.on("SIGINT", async () => {
        Logger.log("BOT", "Shutting down gracefully...");

        // Stop presence rotation if active
        if (client.presenceManager) {
            client.presenceManager.stopRotation();
        }

        await mongoose.connection.close();
        client.destroy();
        process.exit(0);
    });
};

// Add to your bot initialization code
async function loadCommandPermissions(client) {
    try {
        const permissions = await CommandPermissions.find({});

        for (const permDoc of permissions) {
            const command = client.commands.get(permDoc.commandName);
            if (command) {
                // Initialize permissions object if it doesn't exist
                if (!command.permissions) command.permissions = {};

                // Set role permissions
                if (!command.permissions.roles) command.permissions.roles = {};
                for (const [roleId, allowed] of permDoc.permissions.roles.entries()) {
                    command.permissions.roles[roleId] = allowed;
                }

                // Set user permissions
                if (!command.permissions.users) command.permissions.users = {};
                for (const [userId, allowed] of permDoc.permissions.users.entries()) {
                    command.permissions.users[userId] = allowed;
                }
            }
        }
        console.log(`Loaded permissions for ${permissions.length} commands`);
    } catch (error) {
        console.error("Error loading command permissions:", error);
    }
}

// Initialize the bot
const initializeBot = async () => {
    try {
        Logger.startupBox("Starting Project Kiyo Bot");

        // Create client
        const client = createClient();

        // Connect to database
        await connectToMongoDB();

        // Load commands and events
        loadCommands(client, path.join(__dirname, "./commands"));
        loadEvents(client, path.join(__dirname, "./events"));

        // Load command permissions
        await loadCommandPermissions(client);

        // Deploy commands
        await deployCommands(client);

        // Login
        await client.login(config.token);

        // Make sure client is fully initialized before continuing
        if (!client.user) {
            throw new Error("Client failed to initialize properly after login");
        }

        // Set presence
        setRichPresence(client, config);

        // Setup graceful shutdown
        setupGracefulShutdown(client);

        Logger.success("Bot is running!");

        return client;
    } catch (error) {
        Logger.error(`Failed to start the bot: ${error.message}`);
        process.exit(1);
    }
};

// Start the bot
(async () => {
    await initializeBot();
})();
