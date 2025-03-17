const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");
const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
    ActivityType,
} = require("discord.js");
require("dotenv").config();
const Logger = require("./utils/logger");

const { DISCORD_CLIENT_ID, DISCORD_TOKEN, MONGODB_URI } = process.env;
const DISCORD_GUILD_IDS = process.env.DISCORD_GUILD_IDS
    ? process.env.DISCORD_GUILD_IDS.split(",")
    : [];

Logger.startupBox("Starting Project Kiyo Bot");

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.GuildVoiceStates,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

client.commands = new Collection();

// Function to recursively load files in sub-categories as well
const loadFiles = (dir, fileAction) => {
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            loadFiles(filePath, fileAction); // Recursively go into subfolders
        } else if (file.endsWith(".js")) {
            fileAction(filePath);
        }
    });
};

// Function to load commands from all sub-categories
const loadCommands = (dir) => {
    Logger.log("COMMANDS", "Loading commands...");
    loadFiles(dir, (filePath) => {
        const command = require(filePath);
        if (command?.data && command?.execute) {
            client.commands.set(command.data.name, command);
            if (command.data.aliases) {
                command.data.aliases.forEach((alias) => {
                    client.commands.set(alias, command);
                });
            }
        }
    });
    Logger.success("All commands loaded successfully!");
};

// Function to load events
const loadEvents = (dir) => {
    Logger.log("EVENTS", "Loading events...");
    loadFiles(dir, (filePath) => {
        const event = require(filePath);
        const execute = (...args) => event.execute(...args);
        event.once ? client.once(event.name, execute) : client.on(event.name, execute);
    });
    Logger.success("Events loaded successfully!");
};

// Load commands and events from their respective directories
loadCommands(path.join(__dirname, "commands")); // Recursively loads commands from all sub-categories
loadEvents(path.join(__dirname, "events")); // Loads all events

// Function to connect to MongoDB
const connectToMongoDB = async () => {
    Logger.log("DATABASE", "Connecting to MongoDB...");
    try {
        mongoose.set("strictQuery", false);
        await mongoose.connect(MONGODB_URI);
        Logger.success("Connected to MongoDB");
    } catch (error) {
        Logger.error(`MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

// Deploy commands to Discord API
const deployCommands = async () => {
    Logger.log("DEPLOY", "Deploying commands...");
    const commands = [];
    loadFiles(path.join(__dirname, "commands"), (filePath) => {
        const command = require(filePath);
        if (command?.data?.toJSON) commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
            body: [],
        });
        for (const guildId of DISCORD_GUILD_IDS) {
            try {
                const result = await rest.put(
                    Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId),
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

// Set bot's Rich Presence
const setRichPresence = () => {
    client.user.setPresence({
        activities: [
            {
                name: "with Discord.js",
                type: ActivityType.Playing,
                details: "Managing server tasks",
                state: "Active and ready",
                buttons: [
                    {
                        label: "Visit Website",
                        url: "https://example.com",
                    },
                    {
                        label: "Join Server",
                        url: "https://discord.gg/example",
                    },
                ],
            },
        ],
        status: "online",
    });
    Logger.success("Rich Presence set successfully");
};

// Graceful shutdown
process.on("SIGINT", async () => {
    Logger.log("BOT", "Shutting down gracefully...");
    await mongoose.connection.close();
    client.destroy();
    process.exit(0);
});

// Initialize the bot
(async () => {
    try {
        await connectToMongoDB();
        await deployCommands();
        await client.login(DISCORD_TOKEN);
        setRichPresence();
        Logger.success("Bot is running!");
    } catch (error) {
        Logger.error(`Failed to start the bot: ${error.message}`);
        process.exit(1);
    }
})();
