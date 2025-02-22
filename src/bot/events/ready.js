const { ActivityType } = require('discord-api-types/v10');
const Logger = require('./../../../logger');

const activities = [
	// Playing activities
	{ name: '🎮 Exploring new worlds', type: ActivityType.Playing },
	{ name: '🎲 Rolling the dice', type: ActivityType.Playing },
	{ name: '👾 Conquering challenges', type: ActivityType.Playing },

	// Listening activities
	{ name: '🎧 the rhythm of your commands', type: ActivityType.Listening },
	{ name: '🎤 your next request', type: ActivityType.Listening },

	// Watching activities
	{ name: '👀 Monitoring the server', type: ActivityType.Watching },
	{ name: '🛡️ Guarding your community', type: ActivityType.Watching },

	// Streaming activities
	{ name: '🔴 Broadcasting knowledge', type: ActivityType.Streaming },
	{ name: '🎬 Showcasing features', type: ActivityType.Streaming }
];

let activityIndex = 0;
let activityInterval = null;

const setNextActivity = async (client) => {
	const currentActivity = activities[activityIndex];
	try {
		await client.user.setPresence({
			activities: [currentActivity],
			status: 'online'
		});
		activityIndex = (activityIndex + 1) % activities.length;
	} catch (error) {
		Logger.log('BOT', `Error updating bot activity: ${error.message}`, 'error');
		throw error;
	}
};

const logBotStatistics = (client) => {
	if (typeof Logger.table === 'function') {
		const stats = {
			Username: client.user.tag,
			Guilds: client.guilds.cache.size,
			Channels: client.channels.cache.size,
			Users: client.guilds.cache.reduce((acc, guild) => acc + (guild.memberCount || 0), 0)
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

		// Start activity cycling
		activityInterval = setInterval(() => setNextActivity(client), 10000);
		Logger.log('BOT', 'Activity cycling started', 'info');

		// Set initial activity
		await setNextActivity(client);
	},
	stopActivityCycle: () => {
		if (activityInterval) {
			clearInterval(activityInterval);
			activityInterval = null;
			Logger.log('BOT', 'Activity cycling stopped', 'info');
		}
	}
};
