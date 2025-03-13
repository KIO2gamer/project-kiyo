const { ActivityType } = require('discord-api-types/v10');
const Logger = require('./../../../logger').default;
const CommandRefresher = require('../utils/commandRefresher');
const path = require('path');

// Enhanced activities with more information and variety
const activities = [
	{
		name: '🎮 Exploring new worlds',
		type: ActivityType.Playing,
	},
	{
		name: '🎲 Rolling the dice',
		type: ActivityType.Playing,
	},
	{
		name: '👾 Conquering challenges',
		type: ActivityType.Playing,
	},
	{
		name: '🎧 music with the team',
		type: ActivityType.Listening,
	},
	{
		name: '🎤 to your requests',
		type: ActivityType.Listening,
	},
	{
		name: '👀 over the server',
		type: ActivityType.Watching,
	},
	{
		name: '🛡️ Guarding your community',
		type: ActivityType.Custom,
	},
	{
		name: '🎬 New features coming soon!',
		type: ActivityType.Custom,
	},
];

// Define available bot statuses
const statusOptions = ['online', 'idle', 'dnd'];

let activityIndex = 0;
let activityInterval = null;
let commandRefresher = null;

/**
 * Sets the next activity in the rotation
 *
 * @param {Client} client - The Discord.js client
 * @returns {Promise<void>}
 */
const setNextActivity = async client => {
	try {
		// Get the activity from our enhanced activities array
		const activity = activities[activityIndex];

		// Randomly select a status
		const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];

		await client.user.setPresence({
			activities: [
				{
					name: activity.name,
					type: activity.type,
					url: activity.url, // Optional, only used for certain activity types
				},
			],
			status: randomStatus,
		});

		activityIndex = (activityIndex + 1) % activities.length;
	} catch (error) {
		Logger.log('PRESENCE', `Error updating bot activity: ${error.message}`, 'error');
	}
};

/**
 * Log bot statistics to the console
 *
 * @param {Client} client - The Discord.js client
 */
const logBotStatistics = client => {
	if (typeof Logger.table === 'function') {
		const stats = {
			Username: client.user.tag,
			ID: client.user.id,
			Guilds: client.guilds.cache.size,
			Channels: client.channels.cache.size,
			Users: client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0),
			Commands: client.commands.size,
			Uptime: formatUptime(client.uptime),
		};
		Logger.table(stats, 'Bot Statistics');
	}
};

/**
 * Format uptime in a human-readable format
 *
 * @param {number} uptime - Uptime in milliseconds
 * @returns {string} Formatted uptime
 */
const formatUptime = uptime => {
	if (!uptime) return '0s';

	const seconds = Math.floor(uptime / 1000) % 60;
	const minutes = Math.floor(uptime / (1000 * 60)) % 60;
	const hours = Math.floor(uptime / (1000 * 60 * 60)) % 24;
	const days = Math.floor(uptime / (1000 * 60 * 60 * 24));

	const parts = [];
	if (days > 0) parts.push(`${days}d`);
	if (hours > 0) parts.push(`${hours}h`);
	if (minutes > 0) parts.push(`${minutes}m`);
	if (seconds > 0 || parts.length === 0) parts.push(`${seconds}s`);

	return parts.join(' ');
};

/**
 * Initialize development mode features
 *
 * @param {Client} client - The Discord.js client
 */
const initDevelopmentMode = client => {
	const isDevelopment = process.env.NODE_ENV !== 'production';
	if (!isDevelopment) return;

	Logger.log('BOT', 'Initializing development mode features', 'info');

	// Start command refresher in development mode
	const commandsDir = path.join(__dirname, '../../bot/commands');
	commandRefresher = CommandRefresher.init(client, commandsDir);
	commandRefresher.startWatching(true);

	// Add development command
	if (!client.commands.has('reload')) {
		client.commands.set('reload', {
			data: {
				name: 'reload',
				description: 'Reload a command (development only)',
			},
			permissions: ['BOT_OWNER'],
			async execute(interaction) {
				const commandName = interaction.options.getString('command', true);
				const success = commandRefresher.reloadCommand(commandName);

				await interaction.reply({
					content: success
						? `Command \`${commandName}\` was reloaded successfully!`
						: `Failed to reload command \`${commandName}\`.`,
					flags: MessageFlags.Ephemeral,
				});
			},
		});
	}
};

/**
 * Optimize the gateway connection
 *
 * @param {Client} client - The Discord.js client
 */
const optimizeGateway = client => {
	// Log shard information if using sharding
	if (client.shard) {
		Logger.log(
			'SHARDING',
			`Running on shard ${client.shard.ids.join(', ')} of ${client.shard.count}`,
			'info',
		);
	}

	// Set a larger guild member cache limit for large guilds
	const largeGuilds = client.guilds.cache.filter(g => g.memberCount > 50);
	for (const [id, guild] of largeGuilds) {
		guild.members.cache.clear(); // Only cache when needed
	}

	// Prune cache for rarely used collections
	client.sweepers.intervals.voiceStates = 300;
};

module.exports = {
	name: 'ready',
	once: true,
	execute: async client => {
		if (!client.user) {
			Logger.log('BOT', 'Bot is not ready!', 'error');
			return;
		}

		const bootTime = client.startup ? (Date.now() - client.startup.time) / 1000 : 0;
		Logger.log('BOT', `Bot is ready! (Took ${bootTime.toFixed(2)}s)`, 'success');

		// Initialize development mode if applicable
		initDevelopmentMode(client);

		// Optimize gateway connection
		optimizeGateway(client);

		// Log bot statistics
		logBotStatistics(client);

		// Set initial activity and status immediately on startup
		await setNextActivity(client);
		Logger.log('PRESENCE', 'Initial activity and status set', 'info');

		// Start activity cycling (every 2.5 minutes instead of 10 seconds)
		activityInterval = setInterval(() => setNextActivity(client), 150000);
		Logger.log('PRESENCE', 'Activity cycling started (every 2.5 minutes)', 'info');

		// Schedule periodic statistics logging (every hour)
		setInterval(() => {
			logBotStatistics(client);
		}, 3600000);
	},

	/**
	 * Stop activity cycling
	 */
	stopActivityCycle: () => {
		if (activityInterval) {
			clearInterval(activityInterval);
			activityInterval = null;
			Logger.log('PRESENCE', 'Activity cycling stopped', 'info');
		}

		// Also stop command refresher if running
		if (commandRefresher) {
			commandRefresher.stopWatching();
			commandRefresher = null;
		}
	},
};
