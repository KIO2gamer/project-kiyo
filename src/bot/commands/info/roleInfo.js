const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionFlagsBits,
	Collection
} = require('discord.js');
const { handleError } = require('../../utils/errorHandler');
const {
	formatCategorizedPermissions,
	splitPermissionText,
	getPermissionDescription,
} = require('./../../utils/permissionFormatter');

const { MessageFlags } = require('discord.js');

function formatPermissions(permissions) {
	return Object.entries(PermissionFlagsBits)
		.filter(([_, flag]) => permissions.has(flag))
		.map(([name]) => name.replace(/_/g, ' ').toLowerCase())
		.map(perm => `\`${perm}\``)
		.join(', ') || 'None';
}

function formatTimestamp(timestamp) {
	return `<t:${Math.floor(timestamp / 1000)}:F> (<t:${Math.floor(timestamp / 1000)}:R>)`;
}

module.exports = {
	description_full: 'Displays detailed information about a role, including its permissions, color, member count, position in hierarchy, and more.',
	usage: '/roleinfo role:@role',
	examples: [
		'/roleinfo role:@Moderator',
		'/roleinfo role:@Member',
		'/roleinfo role:@VIP'
	],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('roleinfo')
		.setDescription('Get detailed information about a role')
		.addRoleOption(option =>
			option
				.setName('role')
				.setDescription('The role to get information about')
				.setRequired(true)
		),

	async execute(interaction) {
		try {
			await interaction.deferReply();
			const role = interaction.options.getRole('role');

			// Validate role
			if (!role) {
				await handleError(
					interaction,
					new Error('Role not found'),
					'VALIDATION',
					'Could not find the specified role.'
				);
				return;
			}

			try {
				// Get role members and sort them by join date
				const members = role.members
					.sort((a, b) => a.joinedTimestamp - b.joinedTimestamp)
					.map(member => ({
						tag: member.user.tag,
						joinedAt: member.joinedTimestamp,
						isBot: member.user.bot
					}));

				// Calculate member statistics
				const memberStats = {
					total: members.length,
					bots: members.filter(m => m.isBot).length,
					humans: members.filter(m => !m.isBot).length,
					online: role.members.filter(m => m.presence?.status === 'online').size,
					idle: role.members.filter(m => m.presence?.status === 'idle').size,
					dnd: role.members.filter(m => m.presence?.status === 'dnd').size,
					offline: role.members.filter(m => !m.presence || m.presence.status === 'offline').size
				};

				// Get role position info
				const totalRoles = interaction.guild.roles.cache.size;
				const positionFromTop = totalRoles - role.position;
				const positionPercent = ((role.position / totalRoles) * 100).toFixed(1);

				// Format permissions
				const permissions = formatCategorizedPermissions(role.permissions);
				const permissionParts = splitPermissionText(permissions);

				// Create embed
				const embed = new EmbedBuilder()
					.setTitle(`Role Information: ${role.name}`)
					.setColor(role.color || '#000000')
					.addFields(
						{
							name: '📊 General Information',
							value: [
								`**ID:** \`${role.id}\``,
								`**Name:** ${role.name}`,
								`**Color:** ${role.hexColor}`,
								`**Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:F>`,
								`**Mentionable:** ${role.mentionable ? '✅' : '❌'}`,
								`**Hoisted:** ${role.hoist ? '✅' : '❌'}`,
								`**Managed:** ${role.managed ? '✅ (Integration)' : '❌'}`,
								`**Icon:** ${role.icon ? `[View](${role.iconURL()})` : 'None'}`
							].join('\n'),
							inline: false
						},
						{
							name: '📈 Position',
							value: [
								`**Absolute:** ${role.position}/${totalRoles}`,
								`**From Top:** #${positionFromTop}`,
								`**Percentile:** Top ${positionPercent}%`,
								`**Displayed Separately:** ${role.hoist ? 'Yes' : 'No'}`
							].join('\n'),
							inline: true
						},
						{
							name: '👥 Member Statistics',
							value: [
								`**Total Members:** ${memberStats.total}`,
								`**Humans:** ${memberStats.humans}`,
								`**Bots:** ${memberStats.bots}`,
								'\n**Status:**',
								`Online: ${memberStats.online}`,
								`Idle: ${memberStats.idle}`,
								`DND: ${memberStats.dnd}`,
								`Offline: ${memberStats.offline}`
							].join('\n'),
							inline: true
						}
					);

				// Add permissions
				for (let i = 0; i < permissionParts.length; i++) {
					embed.addFields({
						name: i === 0 ? '🔒 Permissions' : '🔒 Permissions (continued)',
						value: permissionParts[i],
						inline: false
					});
				}

				// Add member list if not too long
				if (memberStats.total > 0) {
					if (memberStats.total <= 15) {
						// Show all members
						const memberList = members
							.map(m => `• ${m.tag}${m.isBot ? ' 🤖' : ''}`)
							.join('\n');
						embed.addFields({
							name: '📝 Member List',
							value: memberList,
							inline: false
						});
					} else {
						// Show first 10 and last 5 members
						const firstMembers = members.slice(0, 10)
							.map(m => `• ${m.tag}${m.isBot ? ' 🤖' : ''}`)
							.join('\n');
						const lastMembers = members.slice(-5)
							.map(m => `• ${m.tag}${m.isBot ? ' 🤖' : ''}`)
							.join('\n');

						embed.addFields({
							name: '📝 First 10 Members',
							value: firstMembers,
							inline: true
						}, {
							name: '📝 Last 5 Members',
							value: lastMembers,
							inline: true
						});
					}
				}

				// Add integration info if role is managed
				if (role.managed) {
					const integration = await interaction.guild.fetchIntegrations()
						.then(integrations =>
							integrations.find(i =>
								i.application && i.role && i.role.id === role.id
							)
						)
						.catch(() => null);

					if (integration) {
						embed.addFields({
							name: '🤖 Integration Details',
							value: [
								`**Type:** ${integration.type}`,
								`**Application:** ${integration.application.name}`,
								integration.account ? `**Account:** ${integration.account.name}` : null,
								integration.syncedAt ? `**Last Synced:** <t:${Math.floor(integration.syncedAt.getTime() / 1000)}:R>` : null
							].filter(Boolean).join('\n'),
							inline: false
						});
					}
				}

				embed.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL({ dynamic: true })
				}).setTimestamp();

				await interaction.editReply({ embeds: [embed] });

			} catch (error) {
				if (error.code === 50001) {
					await handleError(
						interaction,
						error,
						'PERMISSION',
						'I do not have permission to view role information.'
					);
				} else if (error.code === 50013) {
					await handleError(
						interaction,
						error,
						'PERMISSION',
						'I do not have permission to view members of this role.'
					);
				} else {
					await handleError(
						interaction,
						error,
						'DATA_COLLECTION',
						'Failed to collect some role information. Some details may be incomplete.'
					);
				}
			}
		} catch (error) {
			await handleError(
				interaction,
				error,
				'COMMAND_EXECUTION',
				'An error occurred while retrieving role information.'
			);
		}
	},
};
