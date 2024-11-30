const {
	Events,
	ChannelType,
	PermissionsBitField,
	EmbedBuilder,
} = require('discord.js');
const TicketConfig = require('./../../database/ticketConfig');

module.exports = {
	name: Events.InteractionCreate,
	/**
	 * Handles the interaction when a button is clicked.
	 *
	 * @param {import('discord.js').Interaction} interaction - The interaction object from Discord.
	 * @returns {Promise<void>}
	 */
	async execute(interaction) {
		if (!interaction.isButton()) return;

		if (interaction.customId === 'open-ticket') {
			try {
				await interaction.deferReply({ ephemeral: true });

				// Fetch the ticket category ID from the database
				const config = await TicketConfig.findOne();
				const ticketCategoryId = config?.ticketCategoryId;

				// Check if the category ID is set
				if (!ticketCategoryId) {
					return interaction.editReply({
						content:
							'A ticket category has not been set yet. Please use the `/set_ticket_category` command to set one.',
					});
				}

				// Check if the user already has an open ticket
				const existingChannel = interaction.guild.channels.cache.find(
					(channel) =>
						channel.name === `ticket-${interaction.user.id}`,
				);

				if (existingChannel) {
					return interaction.editReply({
						content: `You already have an open ticket: <#${existingChannel.id}>.`,
					});
				}

				// Create a new ticket channel
				const ticketChannel = await interaction.guild.channels.create({
					name: `ticket-${interaction.user.id}`,
					type: ChannelType.GuildText,
					parent: ticketCategoryId,
					permissionOverwrites: [
						{
							id: interaction.guild.id,
							deny: [PermissionsBitField.Flags.ViewChannel],
						},
						{
							id: interaction.user.id,
							allow: [
								PermissionsBitField.Flags.ViewChannel,
								PermissionsBitField.Flags.SendMessages,
								PermissionsBitField.Flags.ReadMessageHistory,
							],
						},
						{
							id: interaction.client.user.id,
							allow: [
								PermissionsBitField.Flags.ViewChannel,
								PermissionsBitField.Flags.SendMessages,
								PermissionsBitField.Flags.ReadMessageHistory,
								PermissionsBitField.Flags.ManageChannels,
							],
						},
					],
				});

				// Send a message to the ticket channel
				const embed = new EmbedBuilder()
					.setColor(0x00ff00)
					.setTitle('Ticket Created')
					.setDescription(
						`Hello <@${interaction.user.id}>, a staff member will be with you shortly.\n\nTo close this ticket, use the \`/close_ticket\` command.`,
					)
					.setTimestamp();

				await ticketChannel.send({ embeds: [embed] });

				// Send a confirmation to the user
				await interaction.editReply({
					content: `Your ticket has been created: <#${ticketChannel.id}>.`,
				});
			} catch (error) {
				console.error('Error creating ticket channel:', error);
				await interaction.editReply({
					content:
						'There was an error creating your ticket. Please try again later.',
				});
			}
		}
	},
};
