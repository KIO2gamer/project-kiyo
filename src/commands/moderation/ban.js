const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('ban')
		.addUserOption((option) => option.setName('user').setDescription('Select the user to ban')),
	async execute(interaction) {
		const user = interaction.options.getUser('user');
		interaction.guild.members.ban(user);
		await interaction.reply(`${user.tag} is banned!!!`);
	},
};
