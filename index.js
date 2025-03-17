const fs = require('node:fs');
require('dotenv').config();
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, REST, Routes, Partials } = require('discord.js');
const { default: mongoose } = require('mongoose');
const errorHandler = require('./utils/errorHandler');
const logger = require('./utils/logger');

// Configure logger
logger.configure({
    level: process.env.LOG_LEVEL || 'INFO',
    logToFile: process.env.LOG_TO_FILE === 'true',
    logFolder: process.env.LOG_FOLDER || 'logs',
    useBoxes: true,
    showTimestamp: true,
    colorize: true,
});

// Set up global error handlers
errorHandler.setupGlobalHandlers();

// Display startup header
logger.section('BOT STARTUP', 'INFO');
logger.info('Initializing bot...', 'STARTUP');

// Bot configuration
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages,
    ],
    partials: [
        Partials.Message,
        Partials.Channel,
        Partials.Reaction,
        Partials.User,
        Partials.GuildMember,
        Partials.ThreadMember,
    ],
});
client.commands = new Collection();

// Set up client error handlers
errorHandler.setupClientHandlers(client);

logger.section('COMMAND LOADING', 'INFO');

// Load all commands
const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

logger.info('Loading commands...', 'SETUP');

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    let folderLoadCount = 0;
    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        let commandsToLoad;

        try {
            commandsToLoad = require(filePath);

            // Handle both single commands and arrays of commands
            if (!Array.isArray(commandsToLoad)) {
                commandsToLoad = [commandsToLoad];
            }

            for (const command of commandsToLoad) {
                if ('data' in command && 'execute' in command && 'category' in command) {
                    client.commands.set(command.data.name, command);
                    commands.push(command.data.toJSON());
                    folderLoadCount++;
                    logger.debug(`Loaded command: ${command.data.name}`, 'COMMAND_LOAD');
                } else {
                    logger.warn(
                        `Command in ${filePath} is missing a required property.`,
                        'COMMAND_LOAD'
                    );
                }
            }
        } catch (error) {
            errorHandler.handle(error, `COMMAND_LOAD:${file}`, false);
        }
    }

    logger.info(`Loaded ${folderLoadCount} commands from ${folder} category`, 'FOLDER_LOAD');
}

logger.info(`Loaded ${commands.length} commands total`, 'SETUP');
logger.divider();

// Deploy commands function using universal error handler
async function deployCommands(guildId = null) {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    logger.info(
        `Refreshing application (/) commands${guildId ? ` for guild ${guildId}` : ' globally'}`,
        'DEPLOY'
    );

    return await errorHandler.wrap(
        async () => {
            if (guildId) {
                const data = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENTID, guildId),
                    { body: commands }
                );
                logger.info(
                    `Successfully reloaded ${data.length} commands in guild ${guildId}`,
                    'DEPLOY'
                );
                return data;
            }
            const data = await rest.put(Routes.applicationCommands(process.env.CLIENTID), {
                body: commands,
            });
            logger.info(`Successfully reloaded ${data.length} global commands`, 'DEPLOY');
            return data;
        },
        `DEPLOY_COMMANDS${guildId ? `:${guildId}` : ':GLOBAL'}`,
        false
    );
}

// Main function with universal error handler
(async () => {
    logger.section('INITIALIZATION', 'INFO');
    logger.info('Bot initialization starting...', 'STARTUP');

    // Connect to MongoDB
    await errorHandler.wrap(
        async () => {
            logger.info('Connecting to MongoDB...', 'DATABASE');
            mongoose.set('strictQuery', false);
            await mongoose.connect(process.env.MONGODB_URL);
            logger.info('Connected to MongoDB', 'DATABASE');
        },
        'MONGODB_CONNECT',
        true
    );

    // Load event handlers
    await errorHandler.wrap(
        async () => {
            logger.section('EVENTS SETUP', 'INFO');
            const eventsPath = path.join(__dirname, 'events');
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

            logger.info(`Loading ${eventFiles.length} event handlers...`, 'EVENT_SETUP');

            for (const file of eventFiles) {
                const filePath = path.join(eventsPath, file);
                try {
                    const event = require(filePath);
                    if (event.once) {
                        client.once(event.name, async (...args) => {
                            await errorHandler.wrap(
                                async () => {
                                    await event.execute(...args);
                                },
                                `EVENT:${event.name}`,
                                false
                            );
                        });
                    } else {
                        client.on(event.name, async (...args) => {
                            await errorHandler.wrap(
                                async () => {
                                    await event.execute(...args);
                                },
                                `EVENT:${event.name}`,
                                false
                            );
                        });
                    }
                    logger.debug(`Registered event: ${event.name}`, 'EVENT_LOAD');
                } catch (error) {
                    errorHandler.handle(error, `EVENT_LOAD:${file}`, false);
                }
            }
            logger.divider();
        },
        'EVENT_SETUP',
        true
    );

    // Login to Discord
    await errorHandler.wrap(
        async () => {
            logger.section('DISCORD LOGIN', 'INFO');
            logger.info('Logging into Discord...', 'LOGIN');
            await client.login(process.env.DISCORD_TOKEN);
            logger.info(`Logged in as ${client.user.tag}`, 'LOGIN');
        },
        'DISCORD_LOGIN',
        true
    );

    // Track deployed guilds to avoid duplication
    const deployedGuilds = new Set();

    logger.section('COMMAND DEPLOYMENT', 'INFO');

    // Deploy commands to primary guild if specified
    if (process.env.GUILDID) {
        await deployCommands(process.env.GUILDID);
        deployedGuilds.add(process.env.GUILDID);
    }

    // Deploy to additional guilds if specified
    if (process.env.GUILD_IDS) {
        await errorHandler.wrap(
            async () => {
                const guildIds = process.env.GUILD_IDS.split(',');
                logger.info(
                    `Deploying to ${guildIds.length} additional guilds`,
                    'MULTI_GUILD_DEPLOY'
                );

                for (const guildId of guildIds) {
                    const trimmedId = guildId.trim();
                    if (trimmedId && !deployedGuilds.has(trimmedId)) {
                        await deployCommands(trimmedId);
                        deployedGuilds.add(trimmedId);
                    }

                    logger.table(
                        Array.from(deployedGuilds).map(id => ({
                            guild: id,
                            status: 'Deployed',
                        })),
                        'Guild Deployment Status'
                    );
                }
            },
            'MULTI_GUILD_DEPLOY',
            false
        );
    }

    // Uncomment this if you want global commands as well
    // await deployCommands();

    logger.section('STARTUP COMPLETE', 'INFO');
    logger.info(`Bot is online! Logged in as ${client.user.tag}`, 'STARTUP');
})().catch(error => {
    errorHandler.handle(error, 'STARTUP', true);
});

// Handle graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
    process.on(signal, async () => {
        logger.section('SHUTDOWN', 'WARN');
        logger.info('Shutting down gracefully...', 'SHUTDOWN');
        await logger.close();
        process.exit(0);
    });
});
