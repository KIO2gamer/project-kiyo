const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { handleError } = require('../../utils/errorHandler');

// Define grouped permissions
const permissionGroups = [
	{
		name: 'admin',
		description: 'Administrator permissions (includes manage everything)',
		flags: [PermissionFlagsBits.Administrator],
	},
	{
		name: 'manage',
		description: 'Management permissions (channels, roles, guild, webhooks)',
		flags: [
			PermissionFlagsBits.ManageChannels,
			PermissionFlagsBits.ManageRoles,
			PermissionFlagsBits.ManageGuild,
			PermissionFlagsBits.ManageWebhooks,
		],
	},
	{
		name: 'messages',
		description: 'Message permissions (send, manage, embed, reactions)',
		flags: [
			PermissionFlagsBits.SendMessages,
			PermissionFlagsBits.ManageMessages,
			PermissionFlagsBits.EmbedLinks,
			PermissionFlagsBits.AddReactions,
		],
	},
	{
		name: 'voice',
		description: 'Voice permissions (connect, speak, mute, deafen, move)',
		flags: [
			PermissionFlagsBits.Connect,
			PermissionFlagsBits.Speak,
			PermissionFlagsBits.MuteMembers,
			PermissionFlagsBits.DeafenMembers,
			PermissionFlagsBits.MoveMembers,
		],
	},
	{
		name: 'misc',
		description: 'Miscellaneous permissions (nickname, audit log, insights)',
		flags: [
			PermissionFlagsBits.ChangeNickname,
			PermissionFlagsBits.ViewAuditLog,
			PermissionFlagsBits.ViewGuildInsights,
		],
	},
];

const commandBuilder = new SlashCommandBuilder()
	.setName('createrole')
	.setDescription('Create a new role')
	.addStringOption(option =>
		option.setName('name').setDescription('The name of the role').setRequired(true),
	)
	.addStringOption(option =>
		option
			.setName('color')
			.setDescription('The color of the role (hex format: #RRGGBB)')
			.setRequired(false),
	)
	.addBooleanOption(option =>
		option
			.setName('hoist')
			.setDescription('Whether to display the role separately')
			.setRequired(false),
	)
	.addBooleanOption(option =>
		option
			.setName('mentionable')
			.setDescription('Whether the role can be mentioned')
			.setRequired(false),
	)
	.addStringOption(option =>
		option
			.setName('permissions')
			.setDescription('Comma-separated list of permissions')
			.setRequired(false),
	)
	.setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles);

// Add grouped permission options dynamically
permissionGroups.forEach(group => {
	commandBuilder.addBooleanOption(option =>
		option.setName(group.name).setDescription(group.description).setRequired(false),
	);
});

module.exports = {
	description_full: 'Creates a new role with the specified name, color, and permissions.',
	usage: '/createrole name:"role name" [color:#hexcolor] [hoist:true/false] [mentionable:true/false] [permissions:permission1,permission2]',
	examples: [
		'/createrole name:Moderator color:#ff0000 hoist:true',
		'/createrole name:Member mentionable:true',
	],
	category: 'roles',
	data: commandBuilder,

	async execute(interaction) {
		try {
			const name = interaction.options.getString('name');
			const color = interaction.options.getString('color');
			const hoist = interaction.options.getBoolean('hoist');
			const mentionable = interaction.options.getBoolean('mentionable');
			const permissionsStr = interaction.options.getString('permissions');

			// Validate color format if provided
			if (color && !/^#[0-9A-Fa-f]{6}$/.test(color)) {
				await handleError(
					interaction,
					new Error('Invalid color format. Please use hex format (e.g., #FF0000)'),
					'VALIDATION',
				);
				return;
			}

			// Parse permissions if provided
			let permissions = [];
			if (permissionsStr) {
				try {
					permissions = permissionsStr.split(',').map(perm => perm.trim().toUpperCase());
					permissions.forEach(perm => {
						if (!(perm in PermissionFlagsBits)) {
							throw new Error(`Invalid permission: ${perm}`);
						}
					});
					permissions = permissions.reduce(
						(acc, perm) => acc | PermissionFlagsBits[perm],
						0n,
					);
				} catch (error) {
					await handleError(
						interaction,
						error,
						'VALIDATION',
						'Invalid permissions format. Please provide valid permission names separated by commas.',
					);
					return;
				}
			}

			// Create the role
			const role = await interaction.guild.roles.create({
				name: name,
				color: color || null,
				hoist: hoist || false,
				mentionable: mentionable || false,
				permissions: permissions,
				reason: `Role created by ${interaction.user.tag}`,
			});

			// Create success embed
			const successEmbed = new EmbedBuilder()
				.setTitle('Role Created')
				.setDescription(`Successfully created role ${role}`)
				.setColor(color || '#00FF00')
				.addFields(
					{ name: 'Name', value: name, inline: true },
					{ name: 'Color', value: color || 'None', inline: true },
					{ name: 'Hoisted', value: String(hoist || false), inline: true },
					{ name: 'Mentionable', value: String(mentionable || false), inline: true },
					{ name: 'Permissions', value: permissionsStr || 'Default', inline: true },
				)
				.setFooter({
					text: `Created by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setTimestamp();

			await interaction.reply({ embeds: [successEmbed] });
		} catch (error) {
			if (error.code === 50013) {
				await handleError(
					interaction,
					error,
					'PERMISSION',
					'I do not have permission to create roles in this server.',
				);
			} else if (error.code === 50028) {
				await handleError(interaction, error, 'VALIDATION', 'Invalid role name provided.');
			} else if (error.code === 30005) {
				await handleError(
					interaction,
					error,
					'VALIDATION',
					'Maximum number of roles reached for this server.',
				);
			} else {
				await handleError(
					interaction,
					error,
					'COMMAND_EXECUTION',
					'An error occurred while creating the role.',
				);
			}
		}
	},
};
