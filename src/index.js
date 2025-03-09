// Load environment variables
require('dotenv').config();
const { handleError } = require('./bot/utils/errorHandler');

// Core dependencies
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

// Environment Variables
const {
	DISCORD_CLIENT_ID,
	DISCORD_TOKEN,
	MONGODB_URI,
	DISCORD_GUILD_IDS = '',
	NODE_ENV = 'development',
} = process.env;

// Validate critical environment variables
if (!DISCORD_TOKEN || !DISCORD_CLIENT_ID || !MONGODB_URI) {
	handleError('Missing one or more required environment variables.');
	process.exit(1);
}

// Constants
const GUILD_IDS = DISCORD_GUILD_IDS.split(',').filter(Boolean);
const IS_PRODUCTION = NODE_ENV === 'production';

// Initialize boot process
Logger.log('BOT', `Initializing bot in ${NODE_ENV} mode`, 'info');

/**
 * Create Discord client with appropriate intents and partials
 * Intents are carefully selected based on the bot's functionality
 */
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
	partials: [Partials.Message, Partials.Channel, Partials.Reaction],
	// Improve performance with proper ws settings
	ws: {
		large_threshold: 250, // Only receive info for up to 250 members per guild
	},
	// Make reconnection more resilient
	failIfNotExists: false,
	retryLimit: 5,
});

// Collections for bot data
client.commands = new Collection();
client.cooldowns = new Collection();
client.aliases = new Collection();
client.startup = {
	time: Date.now(),
	modules: {
		commands: 0,
		events: 0,
	}
};

/**
 * Recursively loads files from a directory and applies a given action to each file.
 *
 * @param {string} dir - The directory to load files from.
 * @param {function} callback - The action to apply to each file. Receives the file path as an argument.
 * @returns {number} The count of successfully processed files
 */
const loadFiles = (dir, callback) => {
	let fileCount = 0;

	const processFile = (filePath) => {
		let stat;
		try {
			stat = fs.statSync(filePath);
		} catch (error) {
			Logger.log(
				'FILES',
				`Error accessing ${filePath}: ${error.message}`,
				'warning',
			);
			return 0;
		}
		if (stat.isDirectory()) {
			fileCount += loadFiles(filePath, callback);
			return 0;
		}
		if (!filePath.endsWith('.js')) return 0;

		const result = callback(filePath);
		if (result !== false) {
			fileCount++;
		}
		return 0;
	};

	try {
		fs.readdirSync(dir)
			.map((file) => path.join(dir, file))
			.forEach(processFile);
	} catch (error) {
		Logger.log('FILES', `Error reading directory ${dir}: ${error.message}`, 'error');
	}

	return fileCount;
};

/**
 * Loads command modules from a specified directory and registers them with the Discord client.
 *
 * @param {string} dir - The directory to load commands from.
 * @returns {number} The count of successfully loaded commands
 */
const loadCommands = (dir) => {
	Logger.log('COMMANDS', 'Loading command modules', 'info');
	const commandCache = new Map();

	const loadedCount = loadFiles(dir, (filePath) => {
		if (!commandCache.has(filePath)) {
			try {
				delete require.cache[require.resolve(filePath)]; // Clear cache for hot-reloading
				commandCache.set(filePath, require(filePath));
			} catch (error) {
				Logger.log(
					'COMMANDS',
					`Failed to require ${filePath}: ${error.message}`,
					'warning',
				);
				return false;
			}
		}

		const command = commandCache.get(filePath);
		if (!command?.data?.name || typeof command.execute !== 'function') {
			Logger.log(
				'COMMANDS',
				`Invalid command module at ${filePath}: missing name or execute method`,
				'warning'
			);
			return false;
		}

		client.commands.set(command.data.name, command);

		// Handle command aliases if defined
		if (command.data.aliases && Array.isArray(command.data.aliases)) {
			command.data.aliases.forEach((alias) => {
				client.aliases.set(alias, command.data.name);
			});
		}

		return true;
	});

	client.startup.modules.commands = loadedCount;
	Logger.log('COMMANDS', `${loadedCount} command modules loaded`, 'success');
	return loadedCount;
};

/**
 * Loads event modules from a specified directory and registers them with the Discord client.
 *
 * @param {string} dir - The directory to load events from.
 * @returns {number} The count of successfully loaded events
 */
const loadEvents = (dir) => {
	Logger.log('EVENTS', 'Loading event modules', 'info');

	const loadedCount = loadFiles(dir, (filePath) => {
		let event;
		try {
			delete require.cache[require.resolve(filePath)]; // Clear cache for hot-reloading
			event = require(filePath);
		} catch (error) {
			Logger.log(
				'EVENTS',
				`Failed to require ${filePath}: ${error.message}`,
				'warning',
			);
			return false;
		}

		if (!event?.name || typeof event.execute !== 'function') {
			Logger.log(
				'EVENTS',
				`Invalid event module at ${filePath}: missing name or execute method`,
				'warning'
			);
			return false;
		}

		const execute = (...args) => {
			try {
				event.execute(...args);
			} catch (error) {
				handleError(`Error in event ${event.name}:`, error);
			}
		};

		if (event.once) {
			client.once(event.name, execute);
		} else {
			client.on(event.name, execute);
		}

		return true;
	});

	client.startup.modules.events = loadedCount;
	Logger.log('EVENTS', `${loadedCount} event modules loaded`, 'success');
	return loadedCount;
};

/**
 * Connects to MongoDB using Mongoose with improved connection options.
 *
 * @async
 * @returns {Promise<mongoose.Connection>} The established database connection
 */
const connectToMongoDB = async () => {
	Logger.log('DATABASE', 'Establishing database connection', 'info');
	try {
		mongoose.set('strictQuery', false);

		// Enhanced MongoDB connection options
		await mongoose.connect(MONGODB_URI, {
			serverSelectionTimeoutMS: 5000,
			socketTimeoutMS: 45000,
			connectTimeoutMS: 10000,
			heartbeatFrequencyMS: 30000,
			family: 4, // Use IPv4, skip trying IPv6
		});

		// Setup event listeners for mongoose connection
		mongoose.connection.on('error', (error) => {
			Logger.log('DATABASE', `Connection error: ${error.message}`, 'error');
		});

		mongoose.connection.on('disconnected', () => {
			Logger.log('DATABASE', 'Connection lost, attempting to reconnect', 'warning');
		});

		Logger.log('DATABASE', 'Database connection established', 'success');
		return mongoose.connection;
	} catch (error) {
		Logger.log(
			'DATABASE',
			`Database connection failed: ${error.message}`,
			'error'
		);
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
 * @returns {Promise<boolean>} Whether deployment was successful
 */
const deployCommandsToGuild = async (rest, guildId, commands) => {
	try {
		await rest.put(
			Routes.applicationGuildCommands(DISCORD_CLIENT_ID, guildId),
			{ body: commands },
		);
		Logger.log(
			'DEPLOY',
			`Deployed ${commands.length} modules to guild ${guildId}`,
			'success',
		);
		return true;
	} catch (error) {
		Logger.log(
			'DEPLOY',
			`Deployment failed for guild ${guildId}: ${error.message}`,
			'error',
		);
		return false;
	}
};

/**
 * Deploys command modules to the Discord API.
 * In production, deploys as global commands if no guild IDs are specified.
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
			Logger.log(
				'DEPLOY',
				`Failed to load command from ${filePath}: ${error.message}`,
				'warning',
			);
		}
	});

	if (commands.length === 0) {
		Logger.log('DEPLOY', 'No commands found to deploy', 'warning');
		return;
	}

	const rest = new REST({ version: '10' }).setToken(DISCORD_TOKEN);

	try {
		// In production with no guild IDs specified, deploy globally
		if (IS_PRODUCTION && GUILD_IDS.length === 0) {
			Logger.log('DEPLOY', 'Deploying commands globally in production mode', 'info');
			await rest.put(
				Routes.applicationCommands(DISCORD_CLIENT_ID),
				{ body: commands },
			);
			Logger.log('DEPLOY', `Deployed ${commands.length} commands globally`, 'success');
			return;
		}

		// Otherwise deploy to specified guilds (or clear global commands first in development)
		if (!IS_PRODUCTION) {
			// Clear global commands in development mode
			await rest.put(Routes.applicationCommands(DISCORD_CLIENT_ID), {
				body: [],
			});
			Logger.log('DEPLOY', 'Cleared global commands in development mode', 'info');
		}

		// If no guilds specified, warn but don't error
		if (GUILD_IDS.length === 0) {
			Logger.log('DEPLOY', 'No guild IDs specified for command deployment', 'warning');
			return;
		}

		// Deploy to each guild concurrently
		const results = await Promise.all(
			GUILD_IDS.map((guildId) =>
				deployCommandsToGuild(rest, guildId, commands),
			),
		);

		const successCount = results.filter(Boolean).length;
		Logger.log('DEPLOY', `Successfully deployed to ${successCount}/${GUILD_IDS.length} guilds`, 'info');
	} catch (error) {
		Logger.log(
			'DEPLOY',
			`Failed to deploy command modules: ${error.message}`,
			'error',
		);
	}
};

/**
 * Initializes the bot by connecting to MongoDB, loading commands/events and logging in.
 *
 * Parallelizes initialization tasks to reduce startup time.
 *
 * @async
 * @returns {Promise<void>}
 */
const initializeBot = async () => {
	try {
		// Load commands and events first
		loadCommands(path.join(__dirname, 'bot/commands'));
		loadEvents(path.join(__dirname, 'bot/events'));

		// Parallelize DB connection and command deployment
		await Promise.all([connectToMongoDB(), deployCommands()]);

		// Finally, login to Discord
		await client.login(DISCORD_TOKEN);

		const startupTime = (Date.now() - client.startup.time) / 1000;
		Logger.log('BOT', `Initialization complete in ${startupTime.toFixed(2)} seconds`, 'success');
		Logger.log('BOT', `Loaded ${client.startup.modules.commands} commands and ${client.startup.modules.events} events`, 'info');
	} catch (error) {
		Logger.log('BOT', `Initialization failed: ${error.message}`, 'error');
		process.exit(1);
	}
};

/**
 * Performs a graceful shutdown of the application
 * @async
 */
const performGracefulShutdown = async () => {
	Logger.log('BOT', 'Initiating graceful shutdown', 'warning');

	// Create a shutdown timeout to force exit if shutdown takes too long
	const shutdownTimeout = setTimeout(() => {
		Logger.log('BOT', 'Shutdown timed out, forcing exit', 'error');
		process.exit(1);
	}, 5000);

	try {
		// Close database connection if active
		if (mongoose.connection.readyState !== 0) {
			await mongoose.connection.close();
			Logger.log('DATABASE', 'Database connection closed', 'info');
		}

		// Destroy Discord client if logged in
		if (client.isReady()) {
			client.destroy();
			Logger.log('BOT', 'Discord connection closed', 'info');
		}

		// Clear the timeout as shutdown completed successfully
		clearTimeout(shutdownTimeout);
		Logger.log('BOT', 'Shutdown complete', 'success');
		process.exit(0);
	} catch (error) {
		Logger.log('BOT', `Error during shutdown: ${error.message}`, 'error');
		clearTimeout(shutdownTimeout);
		process.exit(1);
	}
};

// Signal handlers for graceful shutdown
process.on('SIGINT', performGracefulShutdown);
process.on('SIGTERM', performGracefulShutdown);

// Global error handling
process.on('unhandledRejection', (reason, promise) => {
	Logger.log('PROCESS', `Unhandled Promise Rejection at: ${promise}`, 'error');
	handleError('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (error) => {
	handleError('❌ Uncaught Exception:', error);
	// For uncaught exceptions, we should gracefully shutdown after logging
	// as the process might be in an unstable state
	if (IS_PRODUCTION) {
		performGracefulShutdown();
	}
});

// In production, set up process monitoring
if (IS_PRODUCTION) {
	// Monitor memory usage
	const memoryCheckInterval = setInterval(() => {
		const memoryUsage = process.memoryUsage();
		const heapUsedMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
		const rssUsedMB = Math.round(memoryUsage.rss / 1024 / 1024);

		if (heapUsedMB > 1024 || rssUsedMB > 2048) { // Warning thresholds
			Logger.log('PROCESS', `High memory usage: Heap: ${heapUsedMB}MB, RSS: ${rssUsedMB}MB`, 'warning');
		}
	}, 300000); // Check every 5 minutes

	// Clean up interval on shutdown
	process.on('SIGINT', () => clearInterval(memoryCheckInterval));
	process.on('SIGTERM', () => clearInterval(memoryCheckInterval));
}

// Start the bot initialization
initializeBot();
