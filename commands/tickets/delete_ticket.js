const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');

module.exports = {
    description_full: '',
    usage: '',
    examples: [
        '',
        '',
    ],
	data: new SlashCommandBuilder()
		.setName('delete_ticket')
		.setDescription('Deletes a ticket channel.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
		.addChannelOption(
			option =>
				option
					.setName('channel')
					.setDescription(
						'The specific ticket channel to delete (optional). If not provided, deletes the current channel.'
					)
					.addChannelTypes([0]) // Only allow text channels
		),

	async execute(interaction) {
		const specifiedChannel = interaction.options.getChannel('channel');
		const currentChannel = interaction.channel;

		// Determine which channel to delete
		let channelToDelete = specifiedChannel || currentChannel;

		try {
			// If a specific channel is given, check permissions
			if (
				specifiedChannel &&
				!interaction.memberPermissions.has(PermissionFlagsBits.ManageChannels)
			) {
				return interaction.reply({
					content: "You don't have permission to delete that channel.",
					ephemeral: true,
				});
			}

			// Check if the channel to delete is actually a ticket channel
			if (!channelToDelete.name.startsWith('ticket-')) {
				return interaction.reply({
					content: 'This command can only be used to delete ticket channels.',
					ephemeral: true,
				});
			}

			await interaction.reply(`Deleting ticket channel...`);
			await channelToDelete.delete();
		} catch (error) {
			console.error('Error deleting ticket channel:', error);
			interaction.followUp({
				content: 'There was an error deleting the ticket channel.',
				ephemeral: true,
			});
		}
	},
};
