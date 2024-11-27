const { Events } = require('discord.js');
const chalk = require('chalk'); // Install chalk with: npm install chalk

module.exports = {
	name: Events.ClientReady,
	once: true,
	/**
	 * Executes when the client becomes ready.
	 * Logs the bot's status, including the number of guilds, channels, and users.
	 *
	 * @param {object} client - The Discord client instance.
	 */
	execute(client) {
		const { user, guilds, channels, users } = client;

		console.log(chalk.green(`Bot is ready and operational. Logged in as ${user.tag}`));
		console.log(
			chalk.green(
				`Serving ${guilds.cache.size} guild${guilds.cache.size !== 1 ? 's' : ''}`,
			),
		);
		console.log(
			chalk.green(
				`Watching ${channels.cache.size} channel${channels.cache.size !== 1 ? 's' : ''}`,
			),
		);
		console.log(
			chalk.green(
				`Observing ${users.cache.size} user${users.cache.size !== 1 ? 's' : ''}`,
			),
		);

		// Uncomment the following lines to log detailed guild information

		guilds.cache.forEach((guild) => {
			console.log(chalk.blue(`- ${guild.name} (ID: ${guild.id})`));
		});

	},
};