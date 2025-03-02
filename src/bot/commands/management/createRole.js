const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');

/**
 * Permission groups with their corresponding flags for easy role creation
 * @type {Array<{name: string, description: string, flags: bigint[], emoji: string, color: string}>}
 */
const permissionGroups = [
	{
		name: 'admin',
		description: 'Administrator permissions (includes all permissions)',
		flags: [PermissionsBitField.Flags.Administrator],
		emoji: '🔑',
		color: '#FF0000'
	},
	{
		name: 'moderation',
		description: 'Moderation permissions (kick, ban, timeout)',
		flags: [
			PermissionsBitField.Flags.KickMembers,
			PermissionsBitField.Flags.BanMembers,
			PermissionsBitField.Flags.ModerateMembers
		],
		emoji: '🛡️',
		color: '#FFA500'
	},
	{
		name: 'manage',
		description: 'Management permissions (channels, roles, guild, webhooks)',
		flags: [
			PermissionsBitField.Flags.ManageChannels,
			PermissionsBitField.Flags.ManageRoles,
			PermissionsBitField.Flags.ManageGuild,
			PermissionsBitField.Flags.ManageWebhooks,
		],
		emoji: '⚙️',
		color: '#800080'
	},
	{
		name: 'messages',
		description: 'Message permissions (send, manage, embed, reactions)',
		flags: [
			PermissionsBitField.Flags.SendMessages,
			PermissionsBitField.Flags.ManageMessages,
			PermissionsBitField.Flags.EmbedLinks,
			PermissionsBitField.Flags.AddReactions,
		],
		emoji: '💬',
		color: '#0000FF'
	},
	{
		name: 'voice',
		description: 'Voice permissions (connect, speak, mute, deafen, move)',
		flags: [
			PermissionsBitField.Flags.Connect,
			PermissionsBitField.Flags.Speak,
			PermissionsBitField.Flags.MuteMembers,
			PermissionsBitField.Flags.DeafenMembers,
			PermissionsBitField.Flags.MoveMembers,
		],
		emoji: '🎤',
		color: '#008000'
	},
	{
		name: 'misc',
		description: 'Miscellaneous permissions (nickname, audit log, insights)',
		flags: [
			PermissionsBitField.Flags.ChangeNickname,
			PermissionsBitField.Flags.ViewAuditLog,
			PermissionsBitField.Flags.ViewGuildInsights,
		],
		emoji: '🔍',
		color: '#A52A2A'
	},
];

/**
 * Build the command with all necessary options
 * @returns {SlashCommandBuilder} The configured command builder
 */
function buildCommand() {
	const commandBuilder = new SlashCommandBuilder()
		.setName('create_role')
		.setDescription('Creates a new role with customizable permissions')
		.addStringOption(option =>
			option
				.setName('name')
				.setDescription('The name of the role')
				.setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('color')
				.setDescription('The color of the role (hex format: #RRGGBB)')
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option
				.setName('hoist')
				.setDescription('Display role members separately in the member list')
				.setRequired(false)
		)
		.addBooleanOption(option =>
			option
				.setName('mentionable')
				.setDescription('Allow anyone to @mention this role')
				.setRequired(false)
		)
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('Reason for creating this role (shows in audit log)')
				.setRequired(false)
		);

	// Add permission group options
	permissionGroups.forEach((group) => {
		commandBuilder.addBooleanOption(option =>
			option
				.setName(group.name)
				.setDescription(group.description)
				.setRequired(false)
		);
	});

	return commandBuilder;
}

/**
 * Validate role name
 * @param {string} name Role name to validate
 * @returns {Object} Validation result
 */
function validateRoleName(name) {
	if (!name || name.length < 1 || name.length > 100) {
		return {
			valid: false,
			error: 'Role name must be between 1 and 100 characters.'
		};
	}
	return { valid: true };
}

/**
 * Validate color hex code
 * @param {string|null} color Color hex code to validate
 * @returns {Object} Validation result
 */
function validateColor(color) {
	if (!color) return { valid: true };

	const colorRegex = /^#([0-9A-F]{3}){1,2}$/i;
	if (!colorRegex.test(color)) {
		return {
			valid: false,
			error: 'Color must be a valid hex code (e.g., #FF0000 for red).'
		};
	}
	return { valid: true };
}

/**
 * Build permissions from selected groups
 * @param {Object} options Interaction options
 * @returns {PermissionsBitField} Combined permissions
 */
function buildPermissions(options) {
	const permissions = new PermissionsBitField();

	permissionGroups.forEach((group) => {
		if (options.getBoolean(group.name)) {
			group.flags.forEach(flag =>
				permissions.add(PermissionsBitField.resolve(flag))
			);
		}
	});

	return permissions;
}

/**
 * Create a response embed for role creation
 * @param {Object} role The created role
 * @param {Object} options Command options used
 * @returns {EmbedBuilder} Formatted embed with role details
 */
function createResponseEmbed(role, options) {
	const embed = new EmbedBuilder()
		.setTitle('Role Created')
		.setDescription(`Successfully created role: ${role}`)
		.setColor(role.hexColor || '#2F3136')
		.addFields(
			{ name: 'Name', value: role.name, inline: true },
			{ name: 'Color', value: role.hexColor || 'Default', inline: true },
			{ name: 'Hoisted', value: role.hoist ? 'Yes' : 'No', inline: true },
			{ name: 'Mentionable', value: role.mentionable ? 'Yes' : 'No', inline: true },
			{ name: 'Role ID', value: role.id, inline: true }
		)
		.setFooter({ text: 'Role Management System' })
		.setTimestamp();

	// Add permission groups that were enabled
	const enabledGroups = permissionGroups
		.filter(group => options.getBoolean(group.name))
		.map(group => `${group.emoji} ${group.name}`);

	if (enabledGroups.length > 0) {
		embed.addFields({
			name: 'Permission Groups',
			value: enabledGroups.join('\n')
		});
	}

	return embed;
}

/**
 * Handle role creation errors
 * @param {Error} error The error object
 * @param {Object} interaction The Discord interaction
 */
async function handleRoleError(error, interaction) {
	console.error('Role creation error:', error);

	const errorEmbed = new EmbedBuilder()
		.setTitle('Error Creating Role')
		.setDescription('There was a problem creating the role.')
		.setColor('#FF0000')
		.addFields({
			name: 'Error Details',
			value: `\`\`\`${error.message || 'Unknown error'}\`\`\``
		})
		.setFooter({ text: 'Please check bot permissions or try again later.' })
		.setTimestamp();

	await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
}

module.exports = {
	category: 'management',
	description_full: 'Creates a new role with customizable name, color, visibility settings, and permission groups. You can select which permission groups to assign to make role creation easier.',
	usage: '/create_role <name> [color] [hoist] [mentionable] [permission groups] [reason]',
	examples: [
		'/create_role name:Moderator color:#1ABC9C hoist:true moderation:true',
		'/create_role name:VIP color:#FFD700 mentionable:true misc:true',
		'/create_role name:Admin admin:true reason:New admin role'
	],
	data: buildCommand(),

	async execute(interaction) {
		// Get and validate inputs
		const name = interaction.options.getString('name');
		const color = interaction.options.getString('color');
		const hoist = interaction.options.getBoolean('hoist') || false;
		const mentionable = interaction.options.getBoolean('mentionable') || false;
		const reason = interaction.options.getString('reason') || `Created by ${interaction.user.tag}`;

		// Validate inputs
		const nameValidation = validateRoleName(name);
		if (!nameValidation.valid) {
			return interaction.reply({
				content: nameValidation.error,
				ephemeral: true
			});
		}

		const colorValidation = validateColor(color);
		if (!colorValidation.valid) {
			return interaction.reply({
				content: colorValidation.error,
				ephemeral: true
			});
		}

		// Build permissions from selected groups
		const permissions = buildPermissions(interaction.options);

		try {
			// Create the role
			const role = await interaction.guild.roles.create({
				name,
				color: color || null,
				hoist,
				mentionable,
				permissions,
				reason
			});

			// Generate and send the success response
			const responseEmbed = createResponseEmbed(role, interaction.options);
			await interaction.reply({ embeds: [responseEmbed] });
		} catch (error) {
			await handleRoleError(error, interaction);
		}
	},
};