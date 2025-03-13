const { SlashCommandBuilder } = require('discord.js');

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full: 'Deletes the specified role from the server.',
	usage: '/delete_role <role:role>',
	examples: ['/delete_role role:Members'],
	category: 'roles',
	data: new SlashCommandBuilder()
		.setName('delete_role')
		.setDescription('Deletes an existing role')
		.addRoleOption(option =>
			option.setName('role').setDescription('The role to delete').setRequired(true),
		),

	async execute(interaction) {
		const role = interaction.options.getRole('role');
		await role.delete();
		return interaction.reply(`Deleted role: ${role.name}`);
	},
};
