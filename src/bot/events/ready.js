const Logger = require('./../../../logger');

module.exports = {
	name: 'ready',
	once: true,
	execute: async (client) => {
		const user = await client.user;
		if (user) {
			Logger.log('BOT', 'Bot is ready!', 'success');
			Logger.table(
				{
					Username: client.user.tag,
					Guilds: client.guilds.cache.size,
					Channels: client.channels.cache.size,
					Users: client.users.cache.size,
				},
				'Bot Statistics',
			);
			client.user.setPresence({
				activities: [{ name: 'activity name', type: 'LISTENING' }],
				status: 'online'
			});
		} else {
			Logger.log('BOT', 'Bot is not ready!', 'error');
		}
	},
};
