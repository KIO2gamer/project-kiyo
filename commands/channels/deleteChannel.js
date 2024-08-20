const {
	SlashCommandBuilder,
	ChannelType,
	PermissionFlagsBits,
	EmbedBuilder,
} = require('discord.js');

module.exports = {
	description_full: 'Deletes a specified channel.',
	usage: '/delete_channel [channel]',
	examples: [
		'/delete_channel channel:category',
		'/delete_channel channel:text',
		'/delete_channel channel:voice',
	],
	data: new SlashCommandBuilder()
		.setName('delete_channel')
		.setDescription('Deletes a specified channel.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption(option =>
			option.setName('channel').setDescription('The channel to delete').setRequired(true)
		),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');

		try {
			await channel.delete();

			const embed = new EmbedBuilder()
				.setTitle('Channel Deleted!')
				.setColor('Red')
				.setDescription(`The channel ${channel.id} has been successfully deleted.`)
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error(`Error deleting channel: ${error}`);
			await interaction.reply({
				content: 'An error occurred while deleting the channel.',
				ephemeral: true,
			});
		}
	},
};
