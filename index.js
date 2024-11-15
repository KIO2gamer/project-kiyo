const fs = require('fs')
const path = require('path');
const mongoose = require('mongoose');
const {
    Client,
    GatewayIntentBits,
    Partials,
    REST,
    Routes,
} = require('discord.js');

// Initialize the Discord Client
const createClient = () =>
    new Client({
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

const initializeBot = async (config, client = createClient()) => {
    const { DISCORD_CLIENT_ID, DISCORD_TOKEN, MONGODB_URI, DISCORD_GUILD_IDS } =
        config;

    if (!DISCORD_CLIENT_ID || !DISCORD_TOKEN || !MONGODB_URI) {
        console.error('[ERROR] Missing required environment variables.');
        process.exit(1);
    }

    const guildIds = DISCORD_GUILD_IDS ? DISCORD_GUILD_IDS.split(',') : [];
    console.log('[BOT] Starting bot...');

    const connectToMongoDB = async () => {
        console.log('[DATABASE] Connecting to MongoDB...');
        try {
            mongoose.set('strictQuery', false);
            await mongoose.connect(MONGODB_URI);
            console.log('[DATABASE] Connected to MongoDB');
        } catch (error) {
            console.error(
                `[DATABASE] MongoDB connection failed: ${error.message}`
            );
            process.exit(1);
        }
    };

    const deployCommands = async (commandsDir) => {
        console.log('[DEPLOY] Deploying commands...');
        const commands = [];
        fs.readdirSync(commandsDir).forEach((file) => {
            const filePath = path.join(commandsDir, file);
            const command = require(filePath);
            if (command?.data?.toJSON) commands.push(command.data.toJSON());
        });

        const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);
        try {
            for (const guildId of guildIds) {
                await rest.put(
                    Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId),
                    { body: commands }
                );
                console.log(
                    `[DEPLOY] Successfully deployed ${commands.length} commands to guild ${guildId}`
                );
            }
        } catch (error) {
            console.error(
                `[DEPLOY] Command deployment failed: ${error.message}`
            );
            process.exit(1);
        }
    };

    await connectToMongoDB();
    await deployCommands(path.join(__dirname, 'commands'));
    await client.login(DISCORD_TOKEN);
    console.log('[BOT] Bot is running!');
};

if (require.main === module) {
    initializeBot(process.env);
}

module.exports = { initializeBot, createClient };
