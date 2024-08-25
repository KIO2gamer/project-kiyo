const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

module.exports = {
	description_full:
		'Adds a role to the roles.json data file. Useful for managing roles that your bot might need to reference.',
	usage: '/add_role_to_data <role:role>',
	examples: ['/add_role_to_data role:Moderators'],
	data: new SlashCommandBuilder()
		.setName('add_role_to_data')
		.setDescription('Adds a role to the json file data.')
		.addRoleOption(option =>
			option.setName('role').setDescription('The role to add').setRequired(true)
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
				jsonData.roles = [];
			}

			// Check for Duplicates:
			const roleExists = jsonData.roles.some(existingRole => existingRole.roleID === role.id);

			if (roleExists) {
				return interaction.reply(`The role "${role.name}" is already in the data!`);
			}

			const roleData = {
				roleID: role.id,
				roleName: role.name,
				roleColor: role.color.toString(16),
			};

			jsonData.roles.push(roleData);

			fs.writeFile('./assets/json/roles.json', JSON.stringify(jsonData, null, 2), err => {
				if (err) {
					console.error(err);
					return interaction.reply('An error occurred while writing to the file.');
				}
				interaction.reply('Role data successfully added to the file!');
			});
		});
	},
};
