const { SlashCommandBuilder } = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');
const Role = require('../../../database/roleStorage.js');

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full:
		'Adds a role to the database. Useful for managing roles that your bot might need to reference.',
	usage: '/add_role_to_data <role:role>',
	examples: ['/add_role_to_data role:Moderators'],
	category: 'roles',
	data: new SlashCommandBuilder()
		.setName('add_role_to_data')
		.setDescription('Adds a role to the database.')
		.addRoleOption((option) =>
			option
				.setName('role')
				.setDescription('The role to add')
				.setRequired(true),
		),
	async execute(interaction) {
		const role = interaction.options.getRole('role');

		try {
			// Check for Duplicates
			const existingRole = await Role.findOne({ roleID: role.id });
			if (existingRole) {
				return interaction.reply(
					`The role "${role.name}" is already in the database!`,
				);
			}

			const roleData = {
				roleID: role.id,
				roleName: role.name,
				roleColor: role.color.toString(16),
			};

			// Create a new Role document
			const newRole = new Role(roleData);

			// Save the new role to the database
			await newRole.save();

			await interaction.reply(
				'Role data successfully added to the database!',
			);
		} catch (error) {
			handleError(interaction, error);
		}
	},
};
