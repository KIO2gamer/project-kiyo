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
require('dotenv').config();

const { DISCORD_CLIENT_ID, DISCORD_TOKEN, MONGODB_URI } = process.env;
const DISCORD_GUILD_IDS = process.env.DISCORD_GUILD_IDS
	? process.env.DISCORD_GUILD_IDS.split(',')
	: [];

// Cyan color for starting message
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

/**
 * Recursively loads files from a directory and applies a given action to each file.
 *
 * @param {string} dir - The directory to load files from.
 * @param {function} callback - The action to apply to each file. This function receives the file path as an argument.
 */
const loadFiles = (dir, callback) => {
	fs.readdirSync(dir).forEach((file) => {
		const filePath = path.join(dir, file);
		const stat = fs.statSync(filePath);
		if (stat.isDirectory()) {
			loadFiles(filePath, callback); // Recursively loads files from a directory and its subdirectories, and applies a given action to each file.
		} else if (file.endsWith('.js')) {
			callback(filePath); // Only process .js files to ensure we are loading JavaScript modules
		}
	});
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
	console.log('\x1b[33m%s\x1b[0m', '[COMMANDS] Loading commands...'); // Yellow color for command loading
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
	console.log(
		'\x1b[32m%s\x1b[0m',
		'[COMMANDS] All Commands Loaded Successfully!!!',
	); // Green color for success
};

// Function to load events
const loadEvents = (dir) => {
	console.log('\x1b[33m%s\x1b[0m', '[EVENTS] Loading events...'); // Yellow color for event loading
	loadFiles(dir, (filePath) => {
		const event = require(filePath);
		const execute = (...args) => event.execute(...args);
		event.once
			? client.once(event.name, execute)
			: client.on(event.name, execute);
	});
	console.log('\x1b[32m%s\x1b[0m', '[EVENTS] Events loaded successfully!!!'); // Green color for success
};

// Load commands and events from their respective directories
loadCommands(path.join(__dirname, 'bot/commands')); // Recursively loads commands from all sub-categories
loadEvents(path.join(__dirname, 'bot/events')); // Loads all events

// Function to connect to MongoDB
const connectToMongoDB = async () => {
	console.log('\x1b[33m%s\x1b[0m', '[DATABASE] Connecting to MongoDB...'); // Yellow color for connection attempt
	try {
		mongoose.set('strictQuery', false);
		await mongoose.connect(MONGODB_URI);
		console.log('\x1b[32m%s\x1b[0m', '[DATABASE] Connected to MongoDB'); // Green color for successful connection
	} catch (error) {
		console.error(
			'\x1b[31m%s\x1b[0m',
			`[DATABASE] MongoDB connection failed: ${error.message}`,
		); // Red color for error
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
 *
 * @example
 * deployCommands().then(() => {
 *   console.log('Commands deployed successfully.');
 * }).catch((error) => {
 *   console.error('Failed to deploy commands:', error);
 * });
 */
const deployCommands = async () => {
	console.log('\x1b[33m%s\x1b[0m', '[DEPLOY] Deploying commands...'); // Yellow color for deployment start
	const commands = [];
	loadFiles(path.join(__dirname, 'bot/commands'), (filePath) => {
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
					{ body: commands },
				);
				console.log(
					'\x1b[32m%s\x1b[0m',
					`[DEPLOY] Successfully deployed ${result.length} commands to guild ${guildId}`,
				); // Green color for success
			} catch (error) {
				console.error(
					'\x1b[31m%s\x1b[0m',
					`[DEPLOY] Failed to deploy commands to guild ${guildId}:`,
					error,
				); // Red color for error
			}
		}
	} catch (error) {
		console.error(
			'\x1b[31m%s\x1b[0m',
			'[DEPLOY] Command deployment failed:',
			error,
		); // Red color for error
	}
};

// Graceful shutdown
process.on('SIGINT', async () => {
	console.log('\x1b[36m%s\x1b[0m', '[BOT] Shutting down gracefully...'); // Cyan color for shutdown message
	await mongoose.connection.close();
	client.destroy();
	process.exit(0);
});

// Initialize the bot
(async () => {
	try {
		await connectToMongoDB();
		await deployCommands();
		await client.login(DISCORD_TOKEN);
		console.log('\x1b[32m%s\x1b[0m', '[BOT] Bot is running!'); // Green color for success
	} catch (error) {
		console.error(
			'\x1b[31m%s\x1b[0m',
			`[BOT] Failed to start the bot: ${error.message}`,
		); // Red color for error
		process.exit(1);
	}
})();
