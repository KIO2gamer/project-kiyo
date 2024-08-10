const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('purge')
		.setDescription('Prune messages from a user')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to prune messages from')
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option
				.setName('amount')
				.setDescription('The number of messages to prune')
				.setRequired(true)
		),

	 

	async execute(interaction) {
		const userOption = interaction.options.getUser('user');
		const amountOption = interaction.options.getInteger('amount');

		const userId = userOption.id;
		const amount = amountOption;

		// Defer the reply to give more time for processing
		await interaction.deferReply({ ephemeral: true });

		try {
			const fetchedMessages = await interaction.channel.messages.fetch({ limit: 100 });
			const userMessages = fetchedMessages
				.filter(message => message.author.id === userId)
				.first(amount);

			if (userMessages.length === 0) {
				return interaction.editReply({
					content: `No messages found from ${userOption.username}`,
				});
			}

			await interaction.channel.bulkDelete(userMessages, true);

			const embed = new EmbedBuilder()
				.setColor('#00ff00')
				.setTitle('Purge Successful')
				.setDescription(`Pruned ${userMessages.length} messages from <@${userId}>`);

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error('Failed to prune messages:', error);

			const embed = new EmbedBuilder()
				.setColor('#ff0000')
				.setTitle('Purge Failed')
				.setDescription(
					`Failed to prune messages from <@${userId}>\nError: \`${error.message}\``
				);

			await interaction.editReply({ embeds: [embed] });
		}
	},
};
