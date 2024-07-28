const { SlashCommandBuilder } = require('discord.js');
const allowedRoles = ['938469752882479166'];
const allowedUsers = ['764513584125444146'];

module.exports = {
	data: new SlashCommandBuilder()
		.setName('eval')
		.setDescription('Evaluates JavaScript code.')
		.addStringOption(option =>
			option.setName('code').setDescription('The code to evaluate').setRequired(true)
		),
	category: 'info',
	async execute(interaction) {
		// Check if the user has permission to use this command
		if (
			!allowedUsers.includes(interaction.user.id) &&
			!interaction.member.roles.cache.some(role => allowedRoles.includes(role.id))
		) {
			return interaction.reply({
				content: 'You do not have permission to use this command.',
				ephemeral: true,
			});
		}

		const code = interaction.options.getString('code');
		try {
			const result = eval(code);
			let output = result;
			if (typeof result !== 'string') {
				output = require('util').inspect(result);
			}
			await interaction.reply(`\`\`\`js\n${output}\n\`\`\``);
		} catch (error) {
			await interaction.reply(`\`\`\`js\n${error}\n\`\`\``);
		}
	},
};
