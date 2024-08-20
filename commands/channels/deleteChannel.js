const {
	SlashCommandBuilder,
	ChannelType,
	PermissionFlagsBits,
	EmbedBuilder,
} = require('discord.js');

module.exports = {
    usage: ,
    examples: ,
	data: new SlashCommandBuilder()
		.setName('deletechannel')
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
				.setDescription(`The channel <#${channel.id}> has been successfully deleted.`)
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
