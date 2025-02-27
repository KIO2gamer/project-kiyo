// Load environment variables
require('dotenv').config();
const { handleError } = require('./bot/utils/errorHandler');

// Environment Variables
const {
	DISCORD_CLIENT_ID,
	DISCORD_TOKEN,
	MONGODB_URI,
	DISCORD_GUILD_IDS = ''
} = process.env;

// Validate critical environment variables
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !MONGODB_URI) {
	handleError('Missing one or more required environment variables.');
	process.exit(1);
}

// Constants
const GUILD_IDS = DISCORD_GUILD_IDS.split(',').filter(Boolean);

const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const {
	Client,
	Collection,
	GatewayIntentBits,
	Partials,
	REST,
	Routes
} = require('discord.js');
const Logger = require('./../logger');

Logger.log('BOT', 'Initializing...', 'info');

// Create Discord client with required intents and partials
const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildVoiceStates,
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
 * @param {function} callback - The action to apply to each file. Receives the file path as an argument.
 */
const loadFiles = (dir, callback) => {
	const processFile = (filePath) => {
		let stat;
		try {
			stat = fs.statSync(filePath);
		} catch (error) {
			Logger.log('FILES', `Error accessing ${filePath}: ${error.message}`, 'warning');
			return;
		}
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
 * Loads command modules from a specified directory and registers them with the Discord client.
 *
 * @param {string} dir - The directory to load commands from.
 */
const loadCommands = (dir) => {
	Logger.log('COMMANDS', 'Loading command modules', 'info');
	const commandCache = new Map();
	loadFiles(dir, (filePath) => {
		if (!commandCache.has(filePath)) {
			try {
				commandCache.set(filePath, require(filePath));
			} catch (error) {
				Logger.log('COMMANDS', `Failed to require ${filePath}: ${error.message}`, 'warning');
				return;
			}
		}
		const command = commandCache.get(filePath);
		if (command?.data?.name && command.execute) {
			client.commands.set(command.data.name, command);
			if (command.data.aliases && Array.isArray(command.data.aliases)) {
				command.data.aliases.forEach(alias => {
					client.commands.set(alias, command);
				});
			}
		}
	});
	Logger.log('COMMANDS', 'Command modules loaded', 'success');
};

/**
 * Loads event modules from a specified directory and registers them with the Discord client.
 *
 * @param {string} dir - The directory to load events from.
 */
const loadEvents = (dir) => {
	Logger.log('EVENTS', 'Loading event modules', 'info');
	loadFiles(dir, (filePath) => {
		let event;
		try {
			event = require(filePath);
		} catch (error) {
			Logger.log('EVENTS', `Failed to require ${filePath}: ${error.message}`, 'warning');
			return;
		}
		const execute = (...args) => event.execute(...args);
		if (event.once) {
			client.once(event.name, execute);
		} else {
			client.on(event.name, execute);
		}
	});
	Logger.log('EVENTS', 'Event modules loaded', 'success');
};

// Load commands and events from their respective directories
loadCommands(path.join(__dirname, 'bot/commands'));
loadEvents(path.join(__dirname, 'bot/events'));

/**
 * Connects to MongoDB using Mongoose with improved connection options.
 *
 * @async
 * @returns {Promise<void>}
 */
const connectToMongoDB = async () => {
	Logger.log('DATABASE', 'Establishing database connection', 'info');
	try {
		mongoose.set('strictQuery', false);
		await mongoose.connect(MONGODB_URI).catch(err => {
			handleError('❌ MongoDB Connection Error:', err);
		});
		Logger.log('DATABASE', 'Database connection established', 'success');
	} catch (error) {
		Logger.log('DATABASE', `Database connection failed: ${error.message}`, 'error');
		process.exit(1);
	}
};

/**
 * Deploys command modules to a specific guild.
 *
 * @async
 * @param {REST} rest - The Discord REST client.
 * @param {string} guildId - The guild ID for deployment.
 * @param {Array} commands - Array of command data.
 * @returns {Promise<void>}
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

/**
 * Deploys command modules to the Discord API.
 *
 * @async
 * @returns {Promise<void>}
 */
const deployCommands = async () => {
	Logger.log('DEPLOY', 'Deploying command modules', 'info');
	const commands = [];
	const commandsPath = path.join(__dirname, 'bot/commands');

	loadFiles(commandsPath, (filePath) => {
		try {
			const command = require(filePath);
			if (command?.data?.toJSON) {
				commands.push(command.data.toJSON());
			}
		} catch (error) {
			Logger.log('DEPLOY', `Failed to load command from ${filePath}: ${error.message}`, 'warning');
		}
	});

	const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

	try {
		// Clear global commands first
		await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), { body: [] });
		// Deploy to each guild concurrently
		await Promise.all(
			GUILD_IDS.map(guildId => deployCommandsToGuild(rest, guildId, commands))
		);
	} catch (error) {
		Logger.log('DEPLOY', `Failed to deploy command modules: ${error.message}`, 'error');
	}
};

/**
 * Initializes the bot by connecting to MongoDB, deploying commands, and logging in.
 *
 * Parallelizes the MongoDB connection and command deployment to reduce startup time.
 *
 * @async
 * @returns {Promise<void>}
 */
const initializeBot = async () => {
	try {
		// Parallelize DB connection and command deployment
		await Promise.all([
			connectToMongoDB(),
			deployCommands()
		]);
		await client.login(DISCORD_TOKEN);
		Logger.log('BOT', 'Initialization complete', 'success');
	} catch (error) {
		Logger.log('BOT', `Initialization failed: ${error.message}`, 'error');
		process.exit(1);
	}
};

// Graceful shutdown on SIGINT
process.on('SIGINT', async () => {
	Logger.log('BOT', 'Initiating shutdown', 'warning');
	await mongoose.connection.close();
	client.destroy();
	Logger.log('BOT', 'Shutdown complete', 'info');
	process.exit(0);
});

// Global error handling
process.on('unhandledRejection', (reason) => {
	handleError('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
	handleError('❌ Uncaught Exception:', error);
});

// Start the bot initialization
initializeBot();