const { logInfo } = require('./../../../logger'); // Adjust the path as necessary

module.exports = {
	name: 'ready',
	once: true,
	execute(client) {
		logInfo(`[BOT] Logged in as ${client.user.tag}`);

		const { user, guilds, channels, users } = client;

		logInfo(`Bot is ready and operational. Logged in as ${user.tag}`);
		logInfo(
			`Serving ${guilds.cache.size} guild${guilds.cache.size !== 1 ? 's' : ''}`,
		);
		logInfo(
			`Watching ${channels.cache.size} channel${channels.cache.size !== 1 ? 's' : ''}`,
		);
		logInfo(
			`Observing ${users.cache.size} user${users.cache.size !== 1 ? 's' : ''}`,
		);

		guilds.cache.forEach((guild) => {
			logInfo(`- ${guild.name} (ID: ${guild.id})`);
		});
	},
};
