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

const loadCommands = (dir) => {
    console.log('\x1b[33m%s\x1b[0m', '[COMMANDS] Loading commands...');
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
    console.log(
        '\x1b[32m%s\x1b[0m',
        '[COMMANDS] All Commands Loaded Successfully!!!'
    );
};

const loadEvents = (dir) => {
    console.log('\x1b[33m%s\x1b[0m', '[EVENTS] Loading events...');
    loadFiles(dir, (filePath) => {
        const event = require(filePath);
        const execute = (...args) => event.execute(...args);
        event.once
            ? client.once(event.name, execute)
            : client.on(event.name, execute);
    });
    console.log('\x1b[32m%s\x1b[0m', '[EVENTS] Events loaded successfully!!!');
};

loadCommands(path.join(__dirname, 'commands'));
loadEvents(path.join(__dirname, 'events'));

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
    console.log('\x1b[33m%s\x1b[0m', '[DEPLOY] Deploying commands...');
    const commands = [];
    loadFiles(path.join(__dirname, 'commands'), (filePath) => {
        const command = require(filePath);
        if (command?.data?.toJSON) commands.push(command.data.toJSON());
    });

    const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
    try {
        await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
            body: [],
        });
        for (const guildId of DISCORD_GUILD_IDS) {
            try {
                const result = await rest.put(
                    Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId),
                    { body: commands }
                );
                console.log(
                    '\x1b[32m%s\x1b[0m',
                    `[DEPLOY] Successfully deployed ${result.length} commands to guild ${guildId}`
                );
            } catch (error) {
                console.error(
                    '\x1b[31m%s\x1b[0m',
                    `[DEPLOY] Failed to deploy commands to guild ${guildId}: ${error.message}`
                );
            }
        }
    } catch (error) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            `[DEPLOY] Command deployment failed: ${error.message}`
        );
    }
};

const setRichPresence = ({
    activityName,
    activityType,
    activityDetails,
    activityState,
    activityButtons,
    status,
}) => {
    client.user.setPresence({
        activities: [
            {
                name: activityName || 'with Discord.js',
                type: activityType || ActivityType.Playing,
                details: activityDetails || 'Managing server tasks',
                state: activityState || 'Active and ready',
                buttons: activityButtons || [
                    { label: 'Visit Website', url: 'https://example.com' },
                    { label: 'Join Server', url: 'https://discord.gg/example' },
                ],
            },
        ],
        status: status || 'online',
    });
    console.log('\x1b[32m%s\x1b[0m', '[BOT] Rich Presence set successfully');
};

process.on('SIGINT', async () => {
    console.log('\x1b[36m%s\x1b[0m', '[BOT] Shutting down gracefully...');
    await mongoose.connection.close();
    client.destroy();
    process.exit(0);
});

(async () => {
    try {
        await connectToMongoDB();
        await deployCommands();
        await client.login(DISCORD_TOKEN);
        setRichPresence({});
        console.log('\x1b[32m%s\x1b[0m', '[BOT] Bot is running!');
    } catch (error) {
        console.error(
            '\x1b[31m%s\x1b[0m',
            `[BOT] Failed to start the bot: ${error.message}`
        );
        process.exit(1);
    }
})();
