const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { handleError } = require('./../../utils/errorHandler');
const {
	formatCategorizedPermissions,
	splitPermissionText,
	getPermissionDescription,
} = require('./../../utils/permissionFormatter');

module.exports = {
	description_full:
		'Provides detailed information about a specific role in the server, including its ID, color, permissions, creation date, position in hierarchy, and other role properties.',
	usage: '/role_info <role>',
	examples: ['/role_info @Member', '/role_info "Moderator"'],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('role_info')
		.setDescription('Provides detailed information about a specific role')
		.addRoleOption((option) =>
			option
				.setName('role')
				.setDescription('The role to get information about')
				.setRequired(true),
		),
	async execute(interaction) {
		try {
			const role = interaction.options.getRole('role');

			// Calculate role position from bottom (more intuitive than from top)
			const totalRoles = interaction.guild.roles.cache.size;
			const positionFromBottom = totalRoles - role.position;

			// Calculate number of members with this role
			const memberCount = role.members.size;
			const memberPercentage = Math.round(
				(memberCount / interaction.guild.memberCount) * 100,
			);

			// Create the embed with role information
			const embed = new EmbedBuilder()
				.setTitle(`Role Information: ${role.name}`)
				.setColor(role.color || 0x5865f2) // Use role color or Discord blurple
				.setThumbnail(
					role.iconURL({ size: 128, dynamic: true }) || null,
				)
				.addFields(
					// General section
					{
						name: '🔍 General Information',
						value: [
							`**ID:** \`${role.id}\``,
							`**Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>`,
							`**Color:** ${role.hexColor}`,
							`**Position:** ${positionFromBottom} of ${totalRoles} (from bottom)`,
							`**Members:** ${memberCount} (${memberPercentage}% of server)`,
						].join('\n'),
						inline: false,
					},

					// Properties section
					{
						name: '⚙️ Role Properties',
						value: [
							`**Hoisted:** ${role.hoist ? 'Yes *(shown separately)*' : 'No'}`,
							`**Mentionable:** ${role.mentionable ? 'Yes' : 'No'}`,
							`**Managed:** ${role.managed ? 'Yes *(integration/bot role)*' : 'No'}`,
							role.tags
								? `**Tags:** ${JSON.stringify(role.tags)}`
								: '',
							`**Mention:** <@&${role.id}>`,
						]
							.filter(Boolean)
							.join('\n'),
						inline: true,
					},
				);

			// Add permissions using the utility function
			const formattedPerms = formatCategorizedPermissions(
				role.permissions,
				{
					checkmark: true,
					headers: true,
					maxLength: 4096, // Allow function to format all permissions, we'll split them later
				},
			);

			// Split permission text if necessary
			const permissionParts = splitPermissionText(formattedPerms);

			// Add each part as a separate field
			for (let i = 0; i < permissionParts.length; i++) {
				embed.addFields({
					name:
						i === 0
							? '🔐 Permissions'
							: '🔐 Permissions (continued)',
					value: permissionParts[i],
					inline: false,
				});
			}

			// Add role integrations if applicable
			if (role.tags) {
				if (role.tags.botId) {
					embed.addFields({
						name: '🤖 Bot Role',
						value: `This role is managed by <@${role.tags.botId}>`,
						inline: false,
					});
				} else if (role.tags.integrationId) {
					embed.addFields({
						name: '🔌 Integration Role',
						value: `This role is managed by an integration (ID: ${role.tags.integrationId})`,
						inline: false,
					});
				} else if (role.tags.premiumSubscriberRole) {
					embed.addFields({
						name: '✨ Server Booster Role',
						value: 'This is the Server Booster role',
						inline: false,
					});
				}
			}

			// Add permission explanation section if the role has fewer than 5 permissions
			// This gives more context for simple roles
			const permList = role.permissions.toArray();
			if (
				permList.length > 0 &&
				permList.length <= 5 &&
				!permList.includes('ADMINISTRATOR')
			) {
				const permDescriptions = permList
					.map((perm) => {
						const name = perm.replace(/_/g, ' ').toLowerCase();
						const description = getPermissionDescription(perm);
						return `**${name}**: ${description}`;
					})
					.join('\n\n');

				embed.addFields({
					name: '📚 Permission Explanations',
					value: permDescriptions,
					inline: false,
				});
			}

			embed
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL({
						dynamic: true,
					}),
				})
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			await handleError(interaction, error);
		}
	},
};
