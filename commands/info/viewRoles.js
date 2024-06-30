const {
	SlashCommandBuilder,
	PermissionFlagsBits,
	EmbedBuilder,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("viewroles")
		.setDescription("Shows all the roles in the server."),
	category: "info",
	async execute(interaction) {
		const roles = interaction.guild.roles.cache
			.sort((a, b) => b.position - a.position)
			.map((role) => role.toString())
			.join("\n");
		await interaction.reply({
			embeds: [
				new EmbedBuilder()
					.setTitle("Roles")
					.setDescription(roles)
					.setColor("Orange")
					.setFooter({
						text: `Requested by: ${interaction.user.username}`,
						iconURL: interaction.user.avatarURL(),
					}),
			],
		});
	},
};
