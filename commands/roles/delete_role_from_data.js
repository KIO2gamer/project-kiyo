const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
	description_full: '',
	usage: '',
	examples: ['', ''],
	data: new SlashCommandBuilder()
		.setName('delete_role_from_data')
		.setDescription('Deletes a role from the json file data.')
		.addRoleOption(option =>
			option.setName('role').setDescription('The role to delete').setRequired(true)
		),
	async execute(interaction) {
		const role = interaction.options.getRole('role');

		fs.readFile('./assets/json/roles.json', 'utf8', (err, data) => {
			if (err) {
				console.error(err);
				return interaction.reply('An error occurred while reading the file.');
			}

			let jsonData = {};
			try {
				jsonData = JSON.parse(data);
			} catch (parseError) {
				console.warn(
					'File was empty or contained invalid JSON. Starting with an empty object.'
				);
			}

			if (!jsonData.roles) {
				return interaction.reply('There are no roles in the data!');
			}

			const roleIndex = jsonData.roles.findIndex(
				existingRole => existingRole.roleID === role.id
			);
			if (roleIndex === -1) {
				return interaction.reply(`The role "${role.name}" was not found in the data!`);
			}

			jsonData.roles.splice(roleIndex, 1);

			fs.writeFile('./assets/json/roles.json', JSON.stringify(jsonData, null, 2), err => {
				if (err) {
					console.error(err);
					return interaction.reply('An error occurred while writing to the file.');
				}
				interaction.reply(`Role "${role.name}" has been deleted from the data!`);
			});
		});
	},
};
