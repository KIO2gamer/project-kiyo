const { ActivityType } = require('discord-api-types/v10');
const Logger = require('./../../../logger');

// Simplified activities array - now just an array of activity names (strings)
const activities = [
	'🎮 Exploring new worlds',
	'🎲 Rolling the dice',
	'👾 Conquering challenges',
	'🎧 Listening to your commands', // Shortened for brevity
	'🎤 Ready for your requests', // Shortened for brevity
	'👀 Monitoring the server',
	'🛡️ Guarding your community',
	'🔴 Broadcasting updates', // Shortened, generalized
	'🎬 Showcasing features',
];

// Choose a consistent ActivityType for all activities - Playing is a good default
const DEFAULT_ACTIVITY_TYPE = ActivityType.Custom;

// Define available bot statuses
const statusOptions = ['online', 'idle', 'dnd'];

let activityIndex = 0;
let activityInterval = null;

const setNextActivity = async (client) => {
	// Get the activity name from the simplified activities array
	const activityName = activities[activityIndex];
	// Randomly select a status
	const randomStatus =
		statusOptions[Math.floor(Math.random() * statusOptions.length)];

	try {
		await client.user.setPresence({
			// Use the consistent DEFAULT_ACTIVITY_TYPE for all activities
			activities: [{ name: activityName, type: DEFAULT_ACTIVITY_TYPE }],
			status: randomStatus,
		});
		activityIndex = (activityIndex + 1) % activities.length;
	} catch (error) {
		Logger.log(
			'BOT',
			`Error updating bot activity: ${error.message}`,
			'error',
		);
		throw error;
	}
};

const logBotStatistics = (client) => {
	if (typeof Logger.table === 'function') {
		const stats = {
			Username: client.user.tag,
			Guilds: client.guilds.cache.size,
			Channels: client.channels.cache.size,
			Users: client.guilds.cache.reduce(
				(acc, guild) => acc + (guild.memberCount || 0),
				0,
			),
		};
		Logger.table(stats, 'Bot Statistics');
	}
};

module.exports = {
	name: 'ready',
	once: true,
	execute: async (client) => {
		if (!client.user) {
			Logger.log('BOT', 'Bot is not ready!', 'error');
			return;
		}

		Logger.log('BOT', 'Bot is ready!', 'success');
		logBotStatistics(client);

		// Set initial activity and status immediately on startup
		await setNextActivity(client);
		Logger.log('BOT', 'Initial activity and status set', 'info');

		// Start activity cycling
		activityInterval = setInterval(() => setNextActivity(client), 10000);
		Logger.log(
			'BOT',
			'Activity cycling started (every 10 seconds)',
			'info',
		);
	},
	stopActivityCycle: () => {
		if (activityInterval) {
			clearInterval(activityInterval);
			activityInterval = null;
			Logger.log('BOT', 'Activity cycling stopped', 'info');
		}
	},
};
