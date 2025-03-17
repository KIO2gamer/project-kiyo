const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	ChannelType,
	EmbedBuilder,
} = require('discord.js');
const TicketConfig = require('./../../../database/ticketConfig');
const { handleError } = require('../../utils/errorHandler');

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full:
		'Sets the category where new ticket channels will be created. Requires the "Administrator" permission.',
	usage: '/set_ticket_category <category:category>',
	examples: ['/set_ticket_category category:Tickets'],
	category: 'setup',
	data: new SlashCommandBuilder()
		.setName('set_ticket_category')
		.setDescription('Sets the category where tickets will be created.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addChannelOption(option =>
			option
				.setName('category')
				.setDescription('The category to use for new tickets.')
				.setRequired(true)
				.addChannelTypes(ChannelType.GuildCategory),
		),

	async execute(interaction) {
		try {
			await interaction.deferReply({ ephemeral: true });
			const category = interaction.options.getChannel('category');
			const guildId = interaction.guild.id;

			// Validate category
			if (!category) {
				await handleError(
					interaction,
					new Error('No category provided'),
					'VALIDATION',
					'Please provide a valid category channel.',
				);
				return;
			}

			// Check if category is in the same guild
			if (category.guildId !== interaction.guildId) {
				await handleError(
					interaction,
					new Error('Invalid category guild'),
					'VALIDATION',
					'The category must be in this server.',
				);
				return;
			}

			// Check bot permissions in the category
			const botMember = interaction.guild.members.me;
			const requiredPermissions = [
				PermissionFlagsBits.ViewChannel,
				PermissionFlagsBits.ManageChannels,
				PermissionFlagsBits.ManageRoles,
			];

			const missingPermissions = requiredPermissions.filter(
				perm => !category.permissionsFor(botMember).has(perm),
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
					new Error('Missing category permissions'),
					'PERMISSION',
					`I need the following permissions in ${category}: ${permissionNames.join(', ')}`,
				);
				return;
			}

			try {
				// Find and update the document, or create a new one if it doesn't exist
				const config = await TicketConfig.findOneAndUpdate(
					{ guildId: guildId },
					{ ticketCategoryId: category.id },
					{ upsert: true, new: true },
				);

				const embed = new EmbedBuilder()
					.setTitle('Ticket Category Set')
					.setDescription(`Ticket category has been set to ${category}`)
					.addFields(
						{ name: 'Category', value: category.name, inline: true },
						{ name: 'Category ID', value: category.id, inline: true },
					)
					.setColor('Green')
					.setFooter({
						text: `Set by ${interaction.user.tag}`,
						iconURL: interaction.user.displayAvatarURL(),
					})
					.setTimestamp();

				await interaction.editReply({
					embeds: [embed],
					flags: MessageFlags.Ephemeral,
				});

				// Send test message to verify permissions
				const testMessage = await category.send({
					content:
						'🎫 This category has been set up for ticket channels!\n' +
						'New tickets will be created in this category.\n' +
						'This message will be automatically deleted.',
					flags: MessageFlags.Ephemeral,
				});

				// Delete test message after 5 seconds
				setTimeout(() => {
					testMessage.delete().catch(() => {});
				}, 5000);
			} catch (error) {
				if (error.code === 11000) {
					await handleError(
						interaction,
						error,
						'DATABASE',
						'Failed to update the ticket category configuration.',
					);
				} else {
					throw error;
				}
			}
		} catch (error) {
			await handleError(
				interaction,
				error,
				'COMMAND_EXECUTION',
				'An error occurred while setting up the ticket category.',
			);
		}
	},
};
