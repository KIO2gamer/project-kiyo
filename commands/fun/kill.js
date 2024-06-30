const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("kill")
		.setDescription("Sends an assassin to the user's home address."),
	category: "fun",
	async execute(interaction) {
		await interaction.reply(
			`i got yr home address\nalso get rekt bozo coz im sending a hitman to yeet ya`,
		);
	},
};
