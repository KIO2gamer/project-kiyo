const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const { handleError } = require('./../../utils/errorHandler');
const TicketConfig = require('./../../../database/ticketConfig');

module.exports = {
	description_full: 'Sends a message with a button that users can click to create a new ticket.',
	usage: '/send_ticket_message channel:#channel title:text description:text button_text:text',
	examples: [
		'/send_ticket_message channel:#support title:Support Tickets description:Click below to create a ticket button_text:Create Ticket',
		'/send_ticket_message channel:#help title:Need Help? description:Get assistance from our team button_text:Open Ticket',
	],
	category: 'setup',
	data: new SlashCommandBuilder()
		.setName('send_ticket_message')
		.setDescription('Sends a message with a button to create tickets.')
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('The channel to send the ticket message in')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildText),
		)
		.addStringOption(option =>
			option
				.setName('title')
				.setDescription('The title of the ticket message')
				.setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('description')
				.setDescription('The description of the ticket message')
				.setRequired(true),
		)
		.addStringOption(option =>
			option
				.setName('button_text')
				.setDescription('The text to display on the ticket button')
				.setRequired(true),
		),

	async execute(interaction) {
		try {
			await interaction.deferReply();

			const channel = interaction.options.getChannel('channel');
			const title = interaction.options.getString('title');
			const description = interaction.options.getString('description');
			const buttonText = interaction.options.getString('button_text');

			// Validate channel
			if (!channel) {
				await handleError(
					interaction,
					new Error('No channel provided'),
					'VALIDATION',
					'Please provide a valid text channel.',
				);
				return;
			}

			// Check if channel is in the same guild
			if (channel.guildId !== interaction.guildId) {
				await handleError(
					interaction,
					new Error('Invalid channel guild'),
					'VALIDATION',
					'The channel must be in this server.',
				);
				return;
			}

			// Check bot permissions in the channel
			const botMember = interaction.guild.members.me;
			const requiredPermissions = [
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.SendMessages,
				PermissionFlagsBits.EmbedLinks,
			];

			const missingPermissions = requiredPermissions.filter(
				perm => !channel.permissionsFor(botMember).has(perm),
			);

			if (missingPermissions.length > 0) {
				const permissionNames = missingPermissions.map(perm =>
					Object.keys(PermissionFlagsBits)
						.find(key => PermissionFlagsBits[key] === perm)
						.replace(/_/g, ' ')
						.toLowerCase(),
				);

				await handleError(
					interaction,
					new Error('Missing channel permissions'),
					'PERMISSION',
					`I need the following permissions in ${channel}: ${permissionNames.join(', ')}`,
				);
				return;
			}

			// Validate input lengths
			if (title.length > 256) {
				await handleError(
					interaction,
					new Error('Title too long'),
					'VALIDATION',
					'The title must be 256 characters or less.',
				);
				return;
			}

			if (description.length > 4096) {
				await handleError(
					interaction,
					new Error('Description too long'),
					'VALIDATION',
					'The description must be 4096 characters or less.',
				);
				return;
			}

			if (buttonText.length > 80) {
				await handleError(
					interaction,
					new Error('Button text too long'),
					'VALIDATION',
					'The button text must be 80 characters or less.',
				);
				return;
			}

			try {
				// Check if ticket config exists
				const ticketConfig = await TicketConfig.findOne({ guildId: interaction.guild.id });
				if (!ticketConfig || !ticketConfig.categoryId) {
					await handleError(
						interaction,
						new Error('Ticket category not set'),
						'SETUP',
						'Please set up the ticket category first using the `/set_ticket_category` command.',
					);
					return;
				}

				// Create ticket message embed
				const ticketEmbed = new EmbedBuilder()
					.setTitle(title)
					.setDescription(description)
					.setColor('Blue')
					.setFooter({
						text: `${interaction.guild.name} • Ticket System`,
						iconURL: interaction.guild.iconURL(),
					})
					.setTimestamp();

				// Create ticket button
				const button = new ButtonBuilder()
					.setCustomId('create_ticket')
					.setLabel(buttonText)
					.setStyle(ButtonStyle.Primary)
					.setEmoji('🎫');

				const row = new ActionRowBuilder().addComponents(button);

				// Send ticket message
				const ticketMessage = await channel.send({
					embeds: [ticketEmbed],
					components: [row],
				});

				// Send confirmation
				const confirmEmbed = new EmbedBuilder()
					.setTitle('Ticket Message Sent')
					.setDescription(`Successfully sent the ticket message in ${channel}`)
					.addFields(
						{ name: 'Message ID', value: ticketMessage.id, inline: true },
						{ name: 'Channel', value: channel.name, inline: true },
					)
					.setColor('Green')
					.setFooter({
						text: `Set by ${interaction.user.tag}`,
						iconURL: interaction.user.displayAvatarURL(),
					})
					.setTimestamp();

				await interaction.editReply({ embeds: [confirmEmbed] });
			} catch (error) {
				await handleError(
					interaction,
					error,
					'DATABASE',
					'Failed to set up the ticket message. Please check the database connection.',
				);
			}
		} catch (error) {
			await handleError(
				interaction,
				error,
				'COMMAND_EXECUTION',
				'An error occurred while setting up the ticket message.',
			);
		}
	},
};
