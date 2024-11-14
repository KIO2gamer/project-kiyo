const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const {
    Client,
    Collection,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
} = require('discord.js');
const winston = require('winston');
require('dotenv').config();

const { DISCORD_CLIENT_ID, DISCORD_TOKEN, MONGODB_URI } = process.env;
const DISCORD_GUILD_IDS = process.env.DISCORD_GUILD_IDS
    ? process.env.DISCORD_GUILD_IDS.split(',')
    : [];

if (!DISCORD_CLIENT_ID || !DISCORD_TOKEN || !MONGODB_URI) {
    console.error('[ERROR] Missing required environment variables.');
    process.exit(1);
}

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.timestamp(),
        winston.format.printf(
            ({ timestamp, level, message }) =>
                `${timestamp} ${level}: ${message}`
        )
    ),
    transports: [
        new winston.transports.Console(),
        new winston.transports.File({ filename: 'bot.log' }),
    ],
});

logger.info('[BOT] Starting bot...');

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

const loadFiles = (dir, fileAction) => {
    fs.readdirSync(dir).forEach((file) => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
            loadFiles(filePath, fileAction);
        } else if (file.endsWith('.js')) {
            fileAction(filePath);
        }
    });
};

const loadCommandsAndEvents = (commandsDir, eventsDir) => {
    logger.info('[COMMANDS & EVENTS] Loading commands and events...');
    loadCommands(commandsDir);
    loadEvents(eventsDir);
    logger.info(
        '[COMMANDS & EVENTS] Commands and events loaded successfully!!!'
    );
};

const loadCommands = (commandsDir) => {
    loadFiles(commandsDir, (filePath) => {
        const command = require(filePath);
        if (command?.data && command?.execute) {
            registerCommand(command);
        }
    });
};

const registerCommand = (command) => {
    if (client.commands.has(command.data.name)) {
        logger.warn(
            `[WARNING] Duplicate command name detected: ${command.data.name}`
        );
    } else {
        client.commands.set(command.data.name, command);
        if (command.data.aliases) {
            command.data.aliases.forEach((alias) => {
                if (client.commands.has(alias)) {
                    logger.warn(
                        `[WARNING] Duplicate command alias detected: ${alias}`
                    );
                } else {
                    client.commands.set(alias, command);
                }
            });
        }
    }
};

const loadEvents = (eventsDir) => {
    loadFiles(eventsDir, (filePath) => {
        const event = require(filePath);
        const execute = (...args) => event.execute(...args);
        event.once
            ? client.once(event.name, execute)
            : client.on(event.name, execute);
    });
};

const connectToMongoDB = async () => {
    logger.info('[DATABASE] Connecting to MongoDB...');
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(MONGODB_URI);
        logger.info('[DATABASE] Connected to MongoDB');
    } catch (error) {
        logger.error(`[DATABASE] MongoDB connection failed: ${error.message}`);
        process.exit(1);
    }
};

const deployCommands = async () => {
    if (!DISCORD_CLIENT_ID || !DISCORD_TOKEN) {
        logger.error(
            '[DEPLOY] Missing required environment variables for deploying commands.'
        );
        return;
    }
    logger.info('[DEPLOY] Deploying commands...');

    // Clear the commands cache
    client.commands.clear();

    const commands = [];
    const commandNames = new Set();

    loadFiles(path.join(__dirname, 'commands'), (filePath) => {
        const command = require(filePath);
        if (command?.data?.toJSON) {
            if (commandNames.has(command.data.name)) {
                logger.warn(
                    `[WARNING] Duplicate command name detected: ${command.data.name}`
                );
            } else {
                commands.push(command.data.toJSON());
                commandNames.add(command.data.name);
            }
        }
    });

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    try {
        for (const guildId of DISCORD_GUILD_IDS) {
            await rest.put(
                Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId),
                { body: commands }
            );
            logger.info(
                `[DEPLOY] Successfully deployed ${commands.length} commands to guild ${guildId}`
            );
        }
    } catch (error) {
        logger.error(`[DEPLOY] Command deployment failed: ${error.message}`);
    }
};

process.on('SIGINT', async () => {
    logger.info('[BOT] Shutting down gracefully...');
    await mongoose.connection.close();
    client.destroy();
    process.exit(0);
});

(async () => {
    try {
        await Promise.all([connectToMongoDB(), deployCommands()]);
        loadCommandsAndEvents(
            path.join(__dirname, 'commands'),
            path.join(__dirname, 'events')
        );
        await client.login(DISCORD_TOKEN);
        logger.info('[BOT] Bot is running!');
    } catch (error) {
        logger.error(`[BOT] Failed to start the bot: ${error.message}`);
        process.exit(1);
    }
})();
