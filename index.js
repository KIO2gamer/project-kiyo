const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Client, Collection, GatewayIntentBits, Partials, REST, Routes } = require('discord.js');
const mongoose = require('mongoose');

// Validate environment variables
const requiredEnvVars = ['DISCORD_TOKEN', 'MONGODB_URL', 'CLIENT_ID'];
requiredEnvVars.forEach(envVar => {
	if (!process.env[envVar]) {
		console.error(`Missing required environment variable: ${envVar}`);
		process.exit(1);
	}
});

const CLIENT_ID = process.env.CLIENT_ID;
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const GUILD_IDS = process.env.GUILD_IDS ? process.env.GUILD_IDS.split(',') : [];

// Initialize the client
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildModeration,
		GatewayIntentBits.GuildEmojisAndStickers,
		GatewayIntentBits.GuildIntegrations,
		GatewayIntentBits.GuildWebhooks,
		GatewayIntentBits.GuildInvites,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildMessageTyping,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.DirectMessageReactions,
		GatewayIntentBits.DirectMessageTyping,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.GuildScheduledEvents,
		GatewayIntentBits.AutoModerationConfiguration,
		GatewayIntentBits.AutoModerationExecution,
		GatewayIntentBits.GuildMessagePolls,
		GatewayIntentBits.DirectMessagePolls,
	],
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Command collection
client.commands = new Collection();
const loadCommands = dir => {
	const commandFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

	for (const file of commandFiles) {
		const command = require(path.join(dir, file));
		if ('data' in command && 'execute' in command) {
			client.commands.set(command.data.name, command);
			if (command.data.aliases) {
				for (const alias of command.data.aliases) {
					client.commands.set(alias, command);
				}
			}
		} else {
			console.warn(
				`[WARNING] The command at ${path.join(dir, file)} is missing a required "data" or "execute" property.`
			);
		}
	}
};

const commandFolders = fs.readdirSync(path.join(__dirname, 'commands'));
for (const folder of commandFolders) {
	loadCommands(path.join(__dirname, 'commands', folder));
}

// Event handling
const loadEvents = dir => {
	const eventFiles = fs.readdirSync(dir).filter(file => file.endsWith('.js'));

	for (const file of eventFiles) {
		const event = require(path.join(dir, file));
		if (event.once) {
			client.once(event.name, (...args) => event.execute(...args));
		} else {
			client.on(event.name, (...args) => event.execute(...args));
		}
	}
};

loadEvents(path.join(__dirname, 'events'));

// MongoDB connection
async function connectToMongoDB(retries = 5) {
	try {
		mongoose.set('strictQuery', false);
		await mongoose.connect(process.env.MONGODB_URL);
		console.log('Connected to MongoDB');
	} catch (error) {
		console.error(`Failed to connect to MongoDB: ${error.message}`);
		if (retries > 0) {
			console.log(`Retrying to connect to MongoDB (${retries} attempts left)...`);
			setTimeout(() => connectToMongoDB(retries - 1), 5000);
		} else {
			console.error('Exhausted all retries. Shutting down...');
			process.exit(1);
		}
	}
}

// Deploy commands
const deployCommands = async () => {
	const commands = [];
	const foldersPath = path.join(__dirname, 'commands');
	const commandFolders = fs.readdirSync(foldersPath);

	for (const folder of commandFolders) {
		const commandsPath = path.join(foldersPath, folder);
		const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

		for (const file of commandFiles) {
			const filePath = path.join(commandsPath, file);
			const command = require(filePath);
			if (command.data && command.execute) {
				commands.push(command.data.toJSON());
			} else {
				console.warn(
					`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
				);
			}
		}
	}

	const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		// Reset global commands (if needed)
		await rest.put(Routes.applicationCommands(CLIENT_ID), { body: [] });
		console.log('Successfully reset global commands.');

		// Deploy commands to specific guilds
		for (const guildId of GUILD_IDS) {
			try {
				const data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, guildId), {
					body: commands,
				});
				console.log(`Successfully reloaded ${data.length} commands for guild ${guildId}.`);
			} catch (error) {
				console.error(`Failed to deploy commands for guild ${guildId}:`, error);
			}
		}
	} catch (error) {
		console.error('Error deploying commands:', error);
	}
};

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('Shutting down gracefully...');
	await mongoose.connection.close();
	client.destroy();
	process.exit(0);
});

// Login to Discord and start the bot
(async () => {
	try {
		await connectToMongoDB();
		await deployCommands();
		await client.login(DISCORD_TOKEN);
	} catch (error) {
		console.error(`Failed to start the bot: ${error.message}`);
		process.exit(1);
	}
})();