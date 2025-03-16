const fs = require('node:fs');
require('dotenv').config();
const path = require('node:path');
const { Client, Collection, GatewayIntentBits, REST, Routes, Partials } = require('discord.js');
const { default: mongoose } = require('mongoose');

// Set up process-level error handlers
process.on('uncaughtException', error => {
    ErrorHandler.handle(error, 'UNCAUGHT_EXCEPTION', true);
});

process.on('unhandledRejection', error => {
    ErrorHandler.handle(error, 'UNHANDLED_REJECTION', true);
});

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
client.on('error', error => {
    ErrorHandler.handle(error, 'DISCORD_CLIENT', false);
});

client.on('shardError', error => {
    ErrorHandler.handle(error, 'DISCORD_SHARD', false);
});

// Load all commands
const commands = [];
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

for (const folder of commandFolders) {
    const commandsPath = path.join(foldersPath, folder);
    const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

    for (const file of commandFiles) {
        const filePath = path.join(commandsPath, file);
        let command;

        try {
            command = require(filePath);

            if ('data' in command && 'execute' in command && 'category' in command) {
                client.commands.set(command.data.name, command);
                commands.push(command.data.toJSON());
            } else {
                console.log(`[WARNING] The command at ${filePath} is missing a required property.`);
            }
        } catch (error) {
            ErrorHandler.handle(error, `COMMAND_LOAD:${file}`, false);
        }
    }
}

// Deploy commands function using universal error handler
async function deployCommands(guildId = null) {
    const rest = new REST().setToken(process.env.DISCORD_TOKEN);

    console.log(
        `Started refreshing application (/) commands${guildId ? ` for guild ${guildId}` : ' globally'}.`
    );

    return await ErrorHandler.wrap(
        async () => {
            if (guildId) {
                const data = await rest.put(
                    Routes.applicationGuildCommands(process.env.CLIENTID, guildId),
                    { body: commands }
                );
                console.log(`Successfully reloaded ${data.length} commands in guild ${guildId}.`);
                return data;
            } else {
                const data = await rest.put(Routes.applicationCommands(process.env.CLIENTID), {
                    body: commands,
                });
                console.log(`Successfully reloaded ${data.length} global commands.`);
                return data;
            }
        },
        `DEPLOY_COMMANDS${guildId ? `:${guildId}` : ':GLOBAL'}`,
        false
    );
}

// Main function with universal error handler
(async () => {
    console.log('Bot initialization starting...');

    // Connect to MongoDB
    await ErrorHandler.wrap(
        async () => {
            mongoose.set('strictQuery', false);
            await mongoose.connect(process.env.MONGODB_URL);
            console.log('Connected to MongoDB');
        },
        'MONGODB_CONNECT',
        true
    );

    // Load event handlers
    await ErrorHandler.wrap(
        async () => {
            const eventsPath = path.join(__dirname, 'events');
            const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

            for (const file of eventFiles) {
                const filePath = path.join(eventsPath, file);
                try {
                    const event = require(filePath);
                    if (event.once) {
                        client.once(event.name, async (...args) => {
                            await ErrorHandler.wrap(
                                async () => {
                                    await event.execute(...args);
                                },
                                `EVENT:${event.name}`,
                                false
                            );
                        });
                    } else {
                        client.on(event.name, async (...args) => {
                            await ErrorHandler.wrap(
                                async () => {
                                    await event.execute(...args);
                                },
                                `EVENT:${event.name}`,
                                false
                            );
                        });
                    }
                } catch (error) {
                    ErrorHandler.handle(error, `EVENT_LOAD:${file}`, false);
                }
            }
        },
        'EVENT_SETUP',
        true
    );

    // Login to Discord
    await ErrorHandler.wrap(
        async () => {
            await client.login(process.env.DISCORD_TOKEN);
            console.log(`Logged in as ${client.user.tag}`);
        },
        'DISCORD_LOGIN',
        true
    );

    // Track deployed guilds to avoid duplication
    const deployedGuilds = new Set();

    // Deploy commands to primary guild if specified
    if (process.env.GUILDID) {
        await deployCommands(process.env.GUILDID);
        deployedGuilds.add(process.env.GUILDID);
    }

    // Deploy to additional guilds if specified
    if (process.env.GUILD_IDS) {
        await ErrorHandler.wrap(
            async () => {
                const guildIds = process.env.GUILD_IDS.split(',');
                for (const guildId of guildIds) {
                    const trimmedId = guildId.trim();
                    if (trimmedId && !deployedGuilds.has(trimmedId)) {
                        await deployCommands(trimmedId);
                        deployedGuilds.add(trimmedId);
                    }
                }
            },
            'MULTI_GUILD_DEPLOY',
            false
        );
    }

    // Uncomment this if you want global commands as well
    // await deployCommands();

    console.log(`Bot is online! Logged in as ${client.user.tag}`);
})().catch(error => {
    ErrorHandler.handle(error, 'STARTUP', true);
});
