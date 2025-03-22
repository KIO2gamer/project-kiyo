const { Client, Collection, GatewayIntentBits, Partials, ActivityType } = require("discord.js");
const { Player } = require("discord-player");
const { DefaultExtractors } = require("@discord-player/extractor");
const fs = require("fs");
const path = require("path");
const Logger = require("../utils/logger");
const CommandHandler = require("./../commands/handler");

// Create the Discord client
const createClient = () => {
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

    // Setup player
    setupPlayer(client);

    // Initialize the command handler
    const commandHandler = CommandHandler.init(client, {
        commandsDir: path.resolve(process.cwd(), "src/commands"),
        enableHotReload: process.env.NODE_ENV === "development",
    });

    // When the client is ready, load all commands
    client.once("ready", async () => {
        // Load all commands into the client
        await commandHandler.loadCommands();
        console.log(`Loaded ${client.commands.size} commands`);
    });

    // Handle command interactions
    client.on("interactionCreate", async (interaction) => {
        if (interaction.isChatInputCommand()) {
            await commandHandler.executeCommand(interaction);
        }
    });

    return client;
};

// Setup Discord player
const setupPlayer = async (client) => {
    const player = new Player(client);

    // Load default extractors
    await player.extractors.loadMulti(DefaultExtractors);

    // Make player available
    client.player = player;

    // Player events
    client.player.on("trackStart", (queue, track) => {
        queue.metadata.channel.send(`🎵 | Now playing: **${track.title}**`);
    });
};

// Function to recursively load files
const loadFiles = (dir, fileAction) => {
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            loadFiles(filePath, fileAction);
        } else if (file.endsWith(".js")) {
            fileAction(filePath);
        }
    });
};

// Load command files
const loadCommands = (client, dir) => {
    Logger.log("COMMANDS", "Loading commands...");
    loadFiles(dir, (filePath) => {
        const command = require(filePath);
        command.filePath = filePath;
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

// Load event files
const loadEvents = (client, dir) => {
    Logger.log("EVENTS", "Loading events...");
    loadFiles(dir, (filePath) => {
        const event = require(filePath);
        const execute = (...args) => event.execute(...args);
        event.once ? client.once(event.name, execute) : client.on(event.name, execute);
    });
    Logger.success("Events loaded successfully!");
};

// Set rich presence
const setRichPresence = (client, config) => {
    try {
        Logger.log("PRESENCE", "Setting rich presence...");

        // Make sure client is defined and ready before setting presence
        if (!client || !client.user) {
            Logger.error("Cannot set rich presence: Client not ready");
            return;
        }

        // Set default activity if config doesn't provide one
        const activities = config.activities || [{ name: "with Discord.js", type: "PLAYING" }];

        // Make sure each activity has required properties
        const validActivities = activities.filter((activity) => {
            if (!activity || typeof activity !== "object") {
                Logger.warn("Invalid activity configuration: Activity must be an object");
                return false;
            }

            if (!activity.name) {
                Logger.warn("Invalid activity configuration: Activity missing name property");
                return false;
            }

            return true;
        });

        if (validActivities.length === 0) {
            Logger.warn("No valid activities found in configuration");
            return;
        }

        // Select a random activity
        const activity = validActivities[Math.floor(Math.random() * validActivities.length)];

        // Set the presence
        client.user.setPresence({
            activities: [activity],
            status: config.status || "online",
        });

        Logger.success(`Set rich presence: ${activity.type || "PLAYING"} ${activity.name}`);
    } catch (error) {
        Logger.error(`Failed to set rich presence: ${error.message}`);
    }
};

module.exports = {
    createClient,
    loadCommands,
    loadEvents,
    setRichPresence,
};
