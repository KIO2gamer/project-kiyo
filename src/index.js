require('dotenv').config();
const { handleError } = require('./bot/utils/errorHandler');
const Logger = require('./../logger');

const startTime = process.hrtime();

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
	Options,
} = require('discord.js');

const config = {
	clientId: process.env.DISCORD_CLIENT_ID,
	token: process.env.DISCORD_TOKEN,
	mongoUri: process.env.MONGODB_URI,
	guildIds: process.env.DISCORD_GUILD_IDS?.split(',').filter(Boolean) || [],
	environment: process.env.NODE_ENV || 'development',

	paths: {
		commands: path.join(__dirname, 'bot/commands'),
		events: path.join(__dirname, 'bot/events'),
		database: path.join(__dirname, 'database'),
	},

	validate() {
		const missing = [];
		if (!this.token) missing.push('DISCORD_TOKEN');
		if (!this.clientId) missing.push('DISCORD_CLIENT_ID');
		if (!this.mongoUri) missing.push('MONGODB_URI');

		if (missing.length > 0) {
			throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
		}

		if (this.guildIds.length === 0) {
			Logger.warning(
				'CONFIG',
				'No guild IDs provided. Commands will not be registered to any servers.',
			);
		}

		return this;
	},
};

try {
	config.validate();
} catch (error) {
	Logger.error('CONFIG', error.message);
	process.exit(1);
}

Logger.log('BOT', 'Initializing...', 'info');

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

	sweepers: {
		messages: {
			interval: 60,
			lifetime: 600,
		},
		users: {
			interval: 300,
			filter: () => user => user.bot && user.id !== client.user.id,
		},
	},

	makeCache: Options.cacheWithLimits({
		MessageManager: 100,
		GuildMemberManager: 200,
	}),

	presence: {
		status: 'online',
	},
});

client.commands = new Collection();
client.aliases = new Collection();
client.cooldowns = new Collection();
client.commandStats = {
	usageCount: 0,
	categoryCounts: new Map(),
	lastUsed: new Map(),
};

client.startup = {
	time: Date.now(),
	commandsLoaded: 0,
	eventsLoaded: 0,
	errors: 0,
};

const FileLoader = {
	readDirSync(dir) {
		try {
			return fs.readdirSync(dir);
		} catch (error) {
			Logger.warning('FILES', `Cannot read directory ${dir}: ${error.message}`);
			return [];
		}
	},

	loadFiles(dir, callback) {
		if (!fs.existsSync(dir)) {
			Logger.warning('FILES', `Directory does not exist: ${dir}`);
			return;
		}

		const processFile = filePath => {
			try {
				const stat = fs.statSync(filePath);

				if (stat.isDirectory()) {
					this.loadFiles(filePath, callback);
					return;
				}

				if (filePath.endsWith('.js')) {
					callback(filePath);
				}
			} catch (error) {
				Logger.warning('FILES', `Error processing ${filePath}: ${error.message}`);
			}
		};

		this.readDirSync(dir)
			.map(file => path.join(dir, file))
			.forEach(processFile);
	},

	safeRequire(filePath) {
		try {
			if (config.environment === 'development') {
				delete require.cache[require.resolve(filePath)];
			}
			return require(filePath);
		} catch (error) {
			Logger.warning('FILES', `Failed to load ${filePath}: ${error.message}`);
			client.startup.errors++;
			return null;
		}
	},
};

const CommandManager = {
	loadCommands(dir) {
		Logger.log('COMMANDS', 'Loading command modules', 'info');

		FileLoader.loadFiles(dir, filePath => {
			const command = FileLoader.safeRequire(filePath);

			if (!command) return;

			if (command?.data?.name && command.execute) {
				client.commands.set(command.data.name, command);

				if (command.data.aliases && Array.isArray(command.data.aliases)) {
					command.data.aliases.forEach(alias => {
						client.aliases.set(alias, command.data.name);
					});
				}

				const category = command.category || 'uncategorized';
				if (!client.commandStats.categoryCounts.has(category)) {
					client.commandStats.categoryCounts.set(category, 0);
				}
				client.commandStats.categoryCounts.set(
					category,
					client.commandStats.categoryCounts.get(category) + 1,
				);

				client.startup.commandsLoaded++;
			} else {
				Logger.warning('COMMANDS', `Invalid command structure in ${filePath}`);
			}
		});

		Logger.success('COMMANDS', `Loaded ${client.startup.commandsLoaded} command modules`);

		this.refreshHelpCommand();
	},

	refreshHelpCommand() {
		const helpCommand = client.commands.get('help');
		if (helpCommand && typeof helpCommand.refreshData === 'function') {
			try {
				helpCommand.refreshData(client);
				Logger.info('COMMANDS', 'Help command categories refreshed');
			} catch (error) {
				Logger.warning('COMMANDS', `Failed to refresh help command: ${error.message}`);
			}
		}
	},

	async deployCommands() {
		Logger.info('DEPLOY', 'Preparing command deployment');

		const commands = [];
		client.commands.forEach(cmd => {
			if (cmd.data && typeof cmd.data.toJSON === 'function') {
				commands.push(cmd.data.toJSON());
			}
		});

		Logger.info('DEPLOY', `Deploying ${commands.length} commands`);

		const rest = new REST({ version: '10' }).setToken(config.token);

		try {
			await rest.put(Routes.applicationCommands(config.clientId), { body: [] });

			if (config.guildIds.length > 0) {
				const deploymentPromises = config.guildIds.map(guildId =>
					this.deployToGuild(rest, guildId, commands),
				);

				await Promise.all(deploymentPromises);
				Logger.success('DEPLOY', 'Command deployment complete');
			} else {
				Logger.warning('DEPLOY', 'No guild IDs provided for command deployment');
			}
		} catch (error) {
			Logger.error('DEPLOY', `Command deployment failed: ${error.message}`);
			throw error;
		}
	},

	async deployToGuild(rest, guildId, commands) {
		try {
			await rest.put(Routes.applicationGuildCommands(config.clientId, guildId), {
				body: commands,
			});
			Logger.success('DEPLOY', `Deployed ${commands.length} commands to guild ${guildId}`);
		} catch (error) {
			Logger.error('DEPLOY', `Failed to deploy to guild ${guildId}: ${error.message}`);
		}
	},
};

const EventManager = {
	loadEvents(dir) {
		Logger.info('EVENTS', 'Loading event handlers');

		FileLoader.loadFiles(dir, filePath => {
			const event = FileLoader.safeRequire(filePath);

			if (!event || !event.name) return;

			const execute = (...args) => {
				try {
					event.execute(...args);
				} catch (error) {
					Logger.error('EVENTS', `Error in ${event.name} event: ${error.message}`);
					handleError(`Error in ${event.name} event handler:`, error);
				}
			};

			if (event.once) {
				client.once(event.name, execute);
			} else {
				client.on(event.name, execute);
			}

			client.startup.eventsLoaded++;
		});

		Logger.success('EVENTS', `Loaded ${client.startup.eventsLoaded} event handlers`);
	},
};

const DatabaseManager = {
	async connect() {
		Logger.info('DATABASE', 'Establishing connection to MongoDB');

		try {
			mongoose.set('strictQuery', false);

			await mongoose.connect(config.mongoUri, {
				serverSelectionTimeoutMS: 5000,
				maxPoolSize: 10,
			});

			Logger.success('DATABASE', 'MongoDB connection established');

			mongoose.connection.on('error', error => {
				Logger.error('DATABASE', `Connection error: ${error.message}`);
			});

			mongoose.connection.on('disconnected', () => {
				Logger.warning('DATABASE', 'MongoDB disconnected, attempting to reconnect');
			});

			mongoose.connection.on('reconnected', () => {
				Logger.success('DATABASE', 'MongoDB reconnection successful');
			});
		} catch (error) {
			Logger.error('DATABASE', `Failed to connect to MongoDB: ${error.message}`);
			throw error;
		}
	},

	async disconnect() {
		if (mongoose.connection.readyState !== 0) {
			await mongoose.connection.close();
			Logger.info('DATABASE', 'MongoDB connection closed');
		}
	},
};

const App = {
	async initialize() {
		try {
			CommandManager.loadCommands(config.paths.commands);
			EventManager.loadEvents(config.paths.events);

			await Promise.all([DatabaseManager.connect(), CommandManager.deployCommands()]);

			await client.login(config.token);

			const elapsed = process.hrtime(startTime);
			const elapsedMs = (elapsed[0] * 1000 + elapsed[1] / 1000000).toFixed(2);

			Logger.success('BOT', `Initialization complete in ${elapsedMs}ms`);
			Logger.info(
				'BOT',
				`Loaded ${client.startup.commandsLoaded} commands, ${client.startup.eventsLoaded} events`,
			);

			if (client.startup.errors > 0) {
				Logger.warning(
					'BOT',
					`Encountered ${client.startup.errors} non-critical errors during startup`,
				);
			}
		} catch (error) {
			Logger.error('BOT', `Initialization failed: ${error.message}`);
			await this.shutdown(1);
		}
	},

	async shutdown(exitCode = 0) {
		Logger.warning('BOT', 'Initiating shutdown sequence');

		try {
			await DatabaseManager.disconnect();

			if (client) {
				client.destroy();
				Logger.info('BOT', 'Discord client connection terminated');
			}

			Logger.success('BOT', 'Shutdown complete');
		} catch (error) {
			Logger.error('BOT', `Error during shutdown: ${error.message}`);
		} finally {
			process.exit(exitCode);
		}
	},
};

process.on('SIGINT', () => App.shutdown(0));
process.on('SIGTERM', () => App.shutdown(0));

process.on('unhandledRejection', reason => {
	handleError('Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', error => {
	handleError('Uncaught Exception:', error);
	App.shutdown(1);
});

App.initialize();
