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
    ActivityType,
} = require('discord.js');
require('dotenv').config();

const { DISCORD_CLIENT_ID, DISCORD_TOKEN, MONGODB_URI } = process.env;
const DISCORD_GUILD_IDS = process.env.DISCORD_GUILD_IDS
    ? process.env.DISCORD_GUILD_IDS.split(',')
    : [];

if (!DISCORD_CLIENT_ID || !DISCORD_TOKEN || !MONGODB_URI) {
    console.error(
        '\x1b[31m%s\x1b[0m',
        '[ERROR] Missing required environment variables.'
    );
    process.exit(1);
}

console.log('\x1b[36m%s\x1b[0m', '[BOT] Starting bot...');

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
    console.log(
        '\x1b[33m%s\x1b[0m',
        '[COMMANDS & EVENTS] Loading commands and events...'
    );
    loadCommands(commandsDir);
    loadEvents(eventsDir);
    console.log(
        '\x1b[32m%s\x1b[0m',
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
        console.warn(
            '\x1b[33m%s\x1b[0m',
            `[WARNING] Duplicate command name detected: ${command.data.name}`
        );
    } else {
        client.commands.set(command.data.name, command);
        if (command.data.aliases) {
            command.data.aliases.forEach((alias) => {
                if (client.commands.has(alias)) {
                    console.warn(
                        '\x1b[33m%s\x1b[0m',
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
    console.log('\x1b[33m%s\x1b[0m', '[DATABASE] Connecting to MongoDB...');
    try {
        mongoose.set('strictQuery', false);
        await mongoose.connect(MONGODB_URI);
        console.log('\x1b[32m%s\x1b[0m', '[DATABASE] Connected to MongoDB');
    } catch (error) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            `[DATABASE] MongoDB connection failed: ${error.message}`
        );
        process.exit(1);
    }
};

const deployCommands = async () => {
    if (!DISCORD_CLIENT_ID || !DISCORD_TOKEN) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            '[DEPLOY] Missing required environment variables for deploying commands.'
        );
        return;
    }
    console.log('\x1b[33m%s\x1b[0m', '[DEPLOY] Deploying commands...');

    // Clear the commands cache
    client.commands.clear();

    const commands = [];
    const commandNames = new Set();

    loadFiles(path.join(__dirname, 'commands'), (filePath) => {
        const command = require(filePath);
        if (command?.data?.toJSON) {
            if (commandNames.has(command.data.name)) {
                console.warn(
                    '\x1b[33m%s\x1b[0m',
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
                {
                    body: commands,
                }
            );
            console.log(
                '\x1b[32m%s\x1b[0m',
                `[DEPLOY] Successfully deployed ${commands.length} commands to guild ${guildId}`
            );
        }
    } catch (error) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            `[DEPLOY] Command deployment failed: ${error.message}`
        );
    }
};

process.on('SIGINT', async () => {
    console.log('\x1b[36m%s\x1b[0m', '[BOT] Shutting down gracefully...');
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
        console.log('\x1b[32m%s\x1b[0m', '[BOT] Bot is running!');
    } catch (error) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            `[BOT] Failed to start the bot: ${error.message}`
        );
        process.exit(1);
    }
})();
