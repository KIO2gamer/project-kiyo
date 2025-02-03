require('dotenv').config();

// Environment Variables
const {
	DISCORD_CLIENT_ID,
	DISCORD_TOKEN,
	MONGODB_URI,
	DISCORD_GUILD_IDS = ''
} = process.env;

// Constants
const GUILD_IDS = (DISCORD_GUILD_IDS || '').split(',').filter(Boolean);

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
const Logger = require('./../logger');

Logger.log('BOT', 'Initializing...');

const client = new Client({
	intents: [
		// Server-related intents
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,

		// Message-related intents
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.MessageContent,
		GatewayIntentBits.DirectMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildPresences,
	],
	partials: [
		Partials.Message,
		Partials.Channel,
		Partials.Reaction
	]
});

client.commands = new Collection();

/**
 * Recursively loads files from a directory and applies a given action to each file.
 *
 * @param {string} dir - The directory to load files from.
 * @param {function} callback - The action to apply to each file. This function receives the file path as an argument.
 */
const loadFiles = (dir, callback) => {
	const processFile = (filePath) => {
		const stat = fs.statSync(filePath);

		if (stat.isDirectory()) {
			loadFiles(filePath, callback);
			return;
		}

		if (!filePath.endsWith('.js')) return;

		callback(filePath);
	};

	fs.readdirSync(dir)
		.map(file => path.join(dir, file))
		.forEach(processFile);
};

/**
 * Loads commands from a specified directory and its subdirectories.
 *
 * This function reads all JavaScript files in the given directory and its subdirectories,
 * and registers the commands found in those files with the Discord client.
 *
 * @param {string} dir - The directory to load commands from.
 */
const loadCommands = (dir) => {
	Logger.log('COMMANDS', 'Loading command modules', 'info');
	const commandCache = new Map();
	loadFiles(dir, (filePath) => {
		if (!commandCache.has(filePath)) {
			commandCache.set(filePath, require(filePath));
		}
		const command = commandCache.get(filePath);
		if (command?.data?.name && command.execute) {
			client.commands.set(command.data.name, command);
			if (command.data.aliases) {
				command.data.aliases.forEach((alias) => {
					client.commands.set(alias, command);
				});
			}
		}
	});
	Logger.log('COMMANDS', 'Command modules loaded', 'success');
};

// Function to load events
const loadEvents = (dir) => {
	Logger.log('EVENTS', 'Loading event modules', 'info');
	loadFiles(dir, (filePath) => {
		const event = require(filePath);
		const execute = (...args) => event.execute(...args);
		event.once
			? client.once(event.name, execute)
			: client.on(event.name, execute);
	});
	Logger.log('EVENTS', 'Event modules loaded', 'success');
};

// Load commands and events from their respective directories
loadCommands(path.join(__dirname, 'bot/commands')); // Recursively loads commands from all sub-categories
loadEvents(path.join(__dirname, 'bot/events')); // Loads all events

// Function to connect to MongoDB
const connectToMongoDB = async () => {
	Logger.log('DATABASE', 'Establishing database connection', 'info');
	try {
		mongoose.set('strictQuery', false);
		await mongoose.connect(MONGODB_URI).catch(err => console.error('❌ MongoDB Connection Error:', err));
		Logger.log('DATABASE', 'Database connection established', 'success');
	} catch (error) {
		Logger.log('DATABASE', `Database connection failed: ${error.message}`, 'error');
		process.exit(1);
	}
};

// Deploy commands to Discord API
/**
 * Deploys commands to Discord application and guilds.
 *
 * This function loads command files, converts them to JSON, and deploys them
 * to the specified Discord application and guilds using the Discord REST API.
 *
 * @async
 * @function deployCommands
 * @returns {Promise<void>} A promise that resolves when the deployment is complete.
 * @throws {Error} Throws an error if the deployment fails.
 */
const deployCommandsToGuild = async (rest, guildId, commands) => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId),
			{ body: commands }
		);
		Logger.log('DEPLOY', `Deployed ${commands.length} modules to ${guildId}`, 'success');
	} catch (error) {
		Logger.log('DEPLOY', `Deployment failed for ${guildId}: ${error.message}`, 'error');
	}
};

const deployCommands = async () => {
	Logger.log('DEPLOY', 'Deploying command modules', 'info');
	const commands = [];
	const commandsPath = path.join(__dirname, 'bot/commands');

	loadFiles(commandsPath, (filePath) => {
		const command = require(filePath);
		if (command?.data?.toJSON) {
			commands.push(command.data.toJSON());
		}
	});

	const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

	try {
		// Clear global commands first
		await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: [] });
		// Deploy to each guild
		await Promise.all(
			GUILD_IDS.map(guildId => deployCommandsToGuild(rest, guildId, commands))
		);
	} catch (error) {
		Logger.log('DEPLOY', `Failed to deploy command modules: ${error.message}`, 'error');
	}
};

const initializeBot = async () => {
	try {
		await connectToMongoDB();
		await deployCommands();
		await client.login(DISCORD_TOKEN);
		Logger.log('BOT', 'Initialization complete', 'success');
	} catch (error) {
		Logger.log('BOT', `Initialization failed: ${error.message}`, 'error');
		process.exit(1);
	}
};

process.on('SIGINT', async () => {
	Logger.log('BOT', 'Initiating shutdown', 'warning');
	await mongoose.connection.close();
	client.destroy();
	Logger.log('BOT', 'Shutdown complete', 'info');
	process.exit(0);
});

initializeBot();

// Global Error Handling
process.on('unhandledRejection', (reason, promise) => {
	console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
	console.error('❌ Uncaught Exception:', error);
});

