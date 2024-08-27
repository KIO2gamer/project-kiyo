const {
	SlashCommandBuilder,
	EmbedBuilder,
	ChannelType,
	PermissionFlagsBits,
} = require('discord.js');
const fs = require('fs');


module.exports = {
	description_full:
		'Opens a new ticket channel for the user. The ticket category must be set up using the /set_ticket_category command first.',
	usage: '/open_ticket',
	examples: ['/open_ticket'],
	data: new SlashCommandBuilder().setName('open_ticket').setDescription('Opens a new ticket.'),

	async execute(interaction) {
		await interaction.deferReply({ ephemeral: true });

		const guild = interaction.guild;
		const member = interaction.member;

		const ticketChannelName = `ticket-${member.user.username}-${member.id}`;

		const existingTicketChannel = guild.channels.cache.find(
			channel => channel.name === ticketChannelName
		);

		if (existingTicketChannel) {
			return interaction.editReply({
				content: `You already have an open ticket: ${existingTicketChannel}`,
				ephemeral: true,
			});
		}

		try {
			// Read the ticket category ID from the config file
			let ticketConfig;
			try {
				const data = fs.readFileSync('./assets/json/ticketConfig.json');
				ticketConfig = JSON.parse(data);
			} catch (err) {
				console.error('Error reading ticket config:', err);
				return interaction.reply({
					content:
						'Ticket category is not set! Please use `/setticketcategory` to set it up.',
					ephemeral: true,
				});
			}

			const ticketCategoryId = ticketConfig.ticketCategoryId;

			if (!ticketCategoryId) {
				return interaction.reply({
					content:
						'Ticket category is not set! Please use `/setticketcategory` to set it up.',
					ephemeral: true,
				});
			}

			const ticketChannel = await guild.channels.create({
				name: ticketChannelName,
				type: ChannelType.GuildText,
				parent: ticketCategoryId,
				permissionOverwrites: [
					{
						id: interaction.guild.id,
						deny: [PermissionFlagsBits.ViewChannel],
					},
					{
						id: member.id,
						allow: [
							PermissionFlagsBits.ViewChannel,
							PermissionFlagsBits.SendMessages,
							PermissionFlagsBits.AttachFiles,
							PermissionFlagsBits.ReadMessageHistory,
						],
					},
				],
			});

			const ticketEmbed = new EmbedBuilder()
				.setColor('#0099ff')
				.setTitle(`Ticket - ${member.user.username}`)
				.setDescription(
					'Please describe your issue. A staff member will assist you shortly.'
				)
				.setTimestamp();
			await ticketChannel.send({ embeds: [ticketEmbed] });

			interaction.editReply({
				content: `Your ticket has been created: ${ticketChannel}`,
				ephemeral: true,
			});
		} catch (error) {
			console.error('Error creating ticket channel:', error);
			interaction.editReply({
				content: 'There was an error creating your ticket. Please try again later.',
				ephemeral: true,
			});
		}
	},
};
