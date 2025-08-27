require("dotenv").config();
const mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");
const { REST, Routes, Client, Collection, GatewayIntentBits, ActivityType } = require("discord.js");
const Logger = require("./utils/logger");
const CommandPermissions = require("./database/commandPermissions");
const OAuth2Handler = require("./features/youtube-subscriber-roles/utils/oauth2Handler");
const DashboardServer = require("./dashboard/server");
const StatsTracker = require("./utils/statsTracker");
const StatusRotator = require("./utils/statusRotator");

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
    client.categories = new Collection();

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
    const emptyFolders = [];

    for (const folder of commandFolders) {
        const folderPath = path.join(commandsPath, folder);

        // Skip if not a directory
        if (!fs.statSync(folderPath).isDirectory()) continue;

        // Load category metadata from _category.json
        const categoryConfigPath = path.join(folderPath, "_category.json");
        if (fs.existsSync(categoryConfigPath)) {
            try {
                const rawConfig = fs.readFileSync(categoryConfigPath, "utf8");
                const categoryConfig = JSON.parse(rawConfig);
                client.categories.set(folder.toLowerCase(), categoryConfig);
            } catch (error) {
                Logger.error(`Failed to load category config for ${folder}: ${error.message}`);
            }
        }

        const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"));

        // Handle empty folders gracefully
        if (commandFiles.length === 0) {
            emptyFolders.push(folder);
            Logger.warn(`Empty command folder detected: ${folder}`);
            continue;
        }

        let folderCommandCount = 0;
        for (const file of commandFiles) {
            const filePath = path.join(folderPath, file);

            try {
                const command = require(filePath);

                if ("data" in command && "execute" in command) {
                    // Store the category information for the help command
                    command.category = folder.toLowerCase();
                    command.filePath = filePath;

                    client.commands.set(command.data.name, command);
                    commandCount++;
                    folderCommandCount++;
                } else {
                    Logger.warn(
                        `Command at ${filePath} is missing required "data" or "execute" property`,
                    );
                }
            } catch (error) {
                Logger.error(`Failed to load command ${filePath}: ${error.message}`);
            }
        }

        if (folderCommandCount > 0) {
            Logger.log("COMMANDS", `Loaded ${folderCommandCount} commands from ${folder}`);
        }
    }

    // Report empty folders if any
    if (emptyFolders.length > 0) {
        Logger.warn(
            `Found ${emptyFolders.length} empty command folders: ${emptyFolders.join(", ")}`,
        );
    }

    Logger.success(
        `Loaded ${commandCount} commands from ${commandFolders.length - emptyFolders.length} active categories`,
    );
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



// Bot configuration
const config = {
    // Discord config
    token: process.env.DISCORD_TOKEN,
    clientId: process.env.CLIENTID,
    guildIds: process.env.GUILDID ? process.env.GUILDID.split(",") : [],

    // Database config
    mongoUri: process.env.MONGODB_URL,

    // Simple presence configuration
    presence: {
        activity: {
            name: "with Discord.js",
            type: "Playing",
        },
        status: "online",
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

        // Stop status rotator
        if (client.statusRotator) {
            client.statusRotator.stop();
        }

        // Stop OAuth2 server if running
        if (client.oauth2Handler) {
            await client.oauth2Handler.stop();
        }

        // Stop dashboard server if running
        if (client.dashboardServer) {
            await client.dashboardServer.stop();
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
        Logger.log("COMMANDS", `Loaded permissions for ${permissions.length} commands`);
    } catch (error) {
        Logger.error("Error loading command permissions:", error);
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

        // Start OAuth2 callback server if configured for local development
        if (
            process.env.DISCORD_CLIENT_ID &&
            process.env.DISCORD_CLIENT_SECRET &&
            process.env.DISCORD_REDIRECT_URI &&
            process.env.USE_LOCAL_OAUTH === "true"
        ) {
            const oauth2Handler = new OAuth2Handler();
            const port = process.env.OAUTH2_PORT || 3000;
            try {
                await oauth2Handler.start(port);
                Logger.success(`OAuth2 callback server started on port ${port}`);

                // Store oauth2Handler for graceful shutdown
                client.oauth2Handler = oauth2Handler;
            } catch (error) {
                Logger.warn(`Failed to start OAuth2 server: ${error.message}`);
            }
        } else if (
            process.env.DISCORD_CLIENT_ID &&
            process.env.DISCORD_CLIENT_SECRET &&
            process.env.DISCORD_REDIRECT_URI
        ) {
            Logger.success("OAuth2 configured for external callback service (Netlify)");
        } else {
            Logger.warn("OAuth2 not configured - YouTube subscriber roles will not work");
        }

        // Start Dashboard Server
        if (process.env.ENABLE_DASHBOARD !== "false") {
            try {
                const dashboardServer = new DashboardServer(client);
                const dashboardPort = process.env.DASHBOARD_PORT || 3001;
                await dashboardServer.start(dashboardPort);

                // Store dashboard server for graceful shutdown
                client.dashboardServer = dashboardServer;
            } catch (error) {
                Logger.warn(`Failed to start dashboard server: ${error.message}`);
            }
        }


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

        // Initialize and start status rotator
        client.statusRotator = new StatusRotator(client);
        client.statusRotator.start(30000); // Rotate every 30 seconds
        Logger.success("Status rotator initialized");

        // Configure logger with Discord client
        Logger.setDiscordClient(client);

        // Initialize stats tracker
        client.statsTracker = new StatsTracker(client);
        Logger.success("Stats tracker initialized");

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
