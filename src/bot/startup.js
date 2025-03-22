const mongoose = require("mongoose");
const path = require("path");
const { REST, Routes } = require("discord.js");
const Logger = require("../utils/logger");
const config = require("./config");
const { createClient, loadCommands, loadEvents, setRichPresence } = require("./client");

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

// Initialize the bot
const initializeBot = async () => {
    try {
        Logger.startupBox("Starting Project Kiyo Bot");

        // Create client
        const client = createClient();

        // Connect to database
        await connectToMongoDB();

        // Load commands and events
        loadCommands(client, path.join(__dirname, "../commands"));
        loadEvents(client, path.join(__dirname, "../events"));

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

// Setup graceful shutdown
const setupGracefulShutdown = (client) => {
    process.on("SIGINT", async () => {
        Logger.log("BOT", "Shutting down gracefully...");
        await mongoose.connection.close();
        client.destroy();
        process.exit(0);
    });
};

module.exports = {
    initializeBot,
};
