const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
    description_full: '',
    usage: '',
    examples: [
        '',
        '',
    ],
	data: new SlashCommandBuilder()
		.setName('view_roles_from_data')
		.setDescription('View the roles stored in the data.'),
	async execute(interaction) {
		fs.readFile('./assets/json/roles.json', 'utf8', (err, data) => {
			if (err) {
				console.error(err);
				return interaction.reply('An error occurred while reading the role data.');
			}

			let jsonData = {};
			try {
				jsonData = JSON.parse(data);
			} catch (parseError) {
				console.warn('File was empty or contained invalid JSON.');
			}

			if (!jsonData.roles || jsonData.roles.length === 0) {
				return interaction.reply('There are no roles stored in the data.');
			}

			const embed = new EmbedBuilder()
				.setTitle('Stored Roles')
				.setColor('#00FFFF')
				.setDescription(
					jsonData.roles
						.map(
							(role, index) =>
								`${index + 1}. **${role.roleName}** (ID: \`${role.roleID}\`, Color: \`${role.roleColor}\`)`
						)
						.join('\n')
				);

			interaction.reply({ embeds: [embed] });
		});
	},
};
