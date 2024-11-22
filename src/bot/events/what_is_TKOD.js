const { Events } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	/**
	 * Executes the event when a message containing 'tkod' is detected.
	 * Sends a message to the channel with the meaning of 'TKOD'.
	 *
	 * @param {Object} message - The message object from the Discord API.
	 * @param {string} message.content - The content of the message.
	 * @param {Object} message.author - The author of the message.
	 * @param {boolean} message.author.bot - Indicates if the author is a bot.
	 * @param {Object} message.channel - The channel where the message was sent.
	 * @returns {Promise<void>} - A promise that resolves when the message is sent.
	 */
	async execute(message) {
		const msg = message.content.toLowerCase();
		if (msg.includes('tkod') && !message.author.bot) {
			await message.channel.send(
				'**T**he\n**K**IO2gamer\n**O**fficial\n**D**iscord',
			);
		}
	},
};
