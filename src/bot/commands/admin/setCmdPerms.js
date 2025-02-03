const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_cmd_perms')
		.setDescription('Set permissions for commands')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
		.addStringOption((option) =>
			option
				.setName('command')
				.setDescription('The command to set permissions for')
				.setRequired(true),
		)
		.addBooleanOption((option) =>
			option
				.setName('allowed')
				.setDescription('Whether to allow or deny the permission')
				.setRequired(true),
		)
		.addRoleOption((option) =>
			option
				.setName('role')
				.setDescription('The role to set permissions for')
				.setRequired(false),
		)
		.addUserOption((option) =>
			option
				.setName('user')
				.setDescription('The user to set permissions for')
				.setRequired(false),
		),
	description_full:
		'Set custom permissions for commands, allowing or denying access for specific roles or users',
	usage: '/set_cmd_perms <command> <allowed> [role] [user]',
	examples: [
		'/set_cmd_perms command:ping allowed:true role:@Moderator',
		'/set_cmd_perms command:kick allowed:false user:@JohnDoe',
		'/set_cmd_perms command:ban allowed:true role:@Admin',
	],
	category: 'admin',

	/**
	 * Executes the setCmdPerms command to set permissions for a specific command.
	 *
	 * @param {Object} interaction - The interaction object from Discord.
	 * @param {Object} interaction.user - The user who initiated the interaction.
	 * @param {string} interaction.user.id - The ID of the user.
	 * @param {Object} interaction.options - The options provided with the interaction.
	 * @param {Function} interaction.options.getString - Function to get a string option.
	 * @param {Function} interaction.options.getRole - Function to get a role option.
	 * @param {Function} interaction.options.getUser - Function to get a user option.
	 * @param {Function} interaction.options.getBoolean - Function to get a boolean option.
	 * @param {Object} interaction.client - The client object from Discord.
	 * @param {Map} interaction.client.commands - The collection of commands.
	 * @param {Function} interaction.reply - Function to edit the reply to the interaction.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the interaction.reply is edited.
	 */
	async execute(interaction) {
		// Check if user is bot owner
		if (interaction.user.id !== process.env.OWNER_ID) {
			return await interaction.reply({
				content: 'Only the bot owner can use this command!',
				ephemeral: true,
			});
		}

		const commandName = interaction.options.getString('command');
		const role = interaction.options.getRole('role');
		const user = interaction.options.getUser('user');
		const allowed = interaction.options.getBoolean('allowed');

		if (!role && !user) {
			return await interaction.reply({
				content: 'You must specify either a role or user!',
				ephemeral: true,
			});
		}

		// Get the command
		const command = interaction.client.commands.get(commandName);
		if (!command) {
			return await interaction.reply({
				content: 'That command does not exist!',
				ephemeral: true,
			});
		}

		// Set permissions
		if (role) {
			command.permissions = command.permissions || {};
			command.permissions.roles = command.permissions.roles || {};
			command.permissions.roles[role.id] = allowed;
		}

		if (user) {
			command.permissions = command.permissions || {};
			command.permissions.users = command.permissions.users || {};
			command.permissions.users[user.id] = allowed;
		}

		await interaction.reply({
			content: `Successfully ${allowed ? 'allowed' : 'denied'
				} permissions for ${role ? `role ${role.name}` : `user ${user.tag}`
				} on command ${commandName}`,
			ephemeral: true,
		});
	},
};
