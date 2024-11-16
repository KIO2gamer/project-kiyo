const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
} = require('discord.js');
require('dotenv').config();
const {
    formatString,
    logInfo,
    logWarning,
    logError,
    database,
    deploy,
} = require('./formatting');

// Constants
const REQUIRED_ENV_VARS = ['DISCORD_CLIENT_ID', 'DISCORD_TOKEN', 'MONGODB_URI'];
const CLIENT_CONFIG = {
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
};

// Utility functions
const logger = {
    info: logInfo,
    warning: logWarning,
    error: logError,
    database: (message) => database(message),
    deploy: (message) => deploy(message),
};

const validateConfig = () => {
    const missingVars = REQUIRED_ENV_VARS.filter(
        (varName) => !process.env[varName]
    );
    if (missingVars.length > 0) {
        throw new Error(
            formatString(
                'Missing required environment variables: {0}',
                missingVars.join(', ')
            )
        );
    }
};

// Core functionality
const createClient = () => new Client(CLIENT_CONFIG);

const connectToMongoDB = async () => {
    logger.database('Connecting to MongoDB...');
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(process.env.MONGODB_URI);
        logger.database('Connected to MongoDB');
    } catch (error) {
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }
};

const loadCommands = (dir) => {
    let commands = [];
    const files = fs.readdirSync(dir, { withFileTypes: true });

    for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
            commands = commands.concat(loadCommands(filePath));
        } else if (file.name.endsWith('.js')) {
            const command = require(filePath);
            if (command?.data?.toJSON) {
                commands.push(command.data.toJSON());
            }
        }
    }

    return commands;
};

const deployCommands = async (commands) => {
    logger.deploy('Deploying commands...');
    const rest = new REST({ version: '10' }).setToken(
        process.env.DISCORD_TOKEN
    );
    const guildIds = process.env.DISCORD_GUILD_IDS
        ? process.env.DISCORD_GUILD_IDS.split(',')
        : [];

    for (const guildId of guildIds) {
        try {
            await rest.put(
                Routes.applicationGuildCommands(
                    process.env.DISCORD_CLIENT_ID,
                    guildId
                ),
                { body: commands }
            );
            logger.deploy(
                formatString(
                    'Successfully deployed {0} commands to guild {1}',
                    commands.length,
                    guildId
                )
            );
        } catch (error) {
            throw new Error(
                formatString(
                    'Command deployment failed for guild {0}: {1}',
                    guildId,
                    error.message
                )
            );
        }
    }
};

const initializeBot = async (client = createClient()) => {
    try {
        validateConfig();
        logger.info('Starting bot...');

        await connectToMongoDB();

        const commands = loadCommands(path.join(__dirname, 'commands'));
        await deployCommands(commands);

        await client.login(process.env.DISCORD_TOKEN);
        logger.info('Bot is running!');

        return client;
    } catch (error) {
        logger.error(error.message);
        process.exit(1);
    }
};

// Entry point
if (require.main === module) {
    initializeBot();
}

module.exports = { initializeBot, createClient };
