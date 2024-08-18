const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('edit_role_in_data')
		.setDescription('Adds a role to the json file data.')
		.addRoleOption(option =>
			option.setName('role').setDescription('The role to add').setRequired(true)
		),

	async execute(interaction) {},
};
