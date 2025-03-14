const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full:
		'Lists all the roles in the server, sorted by their position hierarchy, and shows the number of members who have each role.',
	usage: '/view_roles',
	examples: ['/view_roles'],
	category: 'roles',
	data: new SlashCommandBuilder()
		.setName('view_roles')
		.setDescription('Shows all the roles in the server.')
		.setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles),

	async execute(interaction) {
		const roles = interaction.guild.roles.cache
			.sort((a, b) => b.position - a.position)
			.map(role => `${role}: ${role.members.size} members`)
			.join('\n');

		const embed = new EmbedBuilder()
			.setTitle('Server Roles')
			.setDescription(roles)
			.setColor('Orange')
			.setFooter({
				text: `Requested by: ${interaction.user.username}`,
				iconURL: interaction.user.avatarURL(),
			})
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
