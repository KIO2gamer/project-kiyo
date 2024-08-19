const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('end_poll')
		.setDescription('Ends a poll')
		.addStringOption(option =>
			option.setName('message_id').setDescription('Message ID of the poll').setRequired(true)
		)
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('Channel where the poll is created')
				.setRequired(true)
		),

	async execute(interaction) {
		try {
			const messageId = interaction.options.getString('message_id');
			const channel = interaction.options.getChannel('channel');

			// Fetch the message
			const message = await channel.messages.fetch(messageId);
			if (!message || !message.poll) {
				return interaction.reply('Poll not found or message does not contain a poll.');
			}

			// End the poll
			message.poll.end();
			await interaction.reply('Poll ended successfully!');
		} catch (error) {
			console.error(error);
			await interaction.reply('An error occurred while trying to end the poll.');
		}
	},
};
