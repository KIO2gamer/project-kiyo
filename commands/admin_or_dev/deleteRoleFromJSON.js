const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('delete_role_from_data')
		.setDescription('Adds a role to the json file data.')
		.addRoleOption(option =>
			option.setName('role').setDescription('The role to add').setRequired(true)
		),

	async execute(interaction) {},
};
