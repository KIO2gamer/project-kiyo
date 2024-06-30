const { SlashCommandBuilder, PollLayoutType } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("create_poll")
		.setDescription("Create a poll")
		.addStringOption((option) =>
			option
				.setName("question")
				.setDescription("The question of the poll")
				.setRequired(true),
		)
		.addStringOption((option) =>
			option
				.setName("options")
				.setDescription("The options of the poll, seperated by commas")
				.setRequired(true),
		)
		.addBooleanOption((option) =>
			option
				.setName("multi_select")
				.setDescription("Allow multi selection of answers or not")
				.setRequired(true),
		)
		.addIntegerOption((option) =>
			option
				.setName("duration")
				.setDescription("Duration of poll in hours")
				.setRequired(true),
		),
	category: "utility",
	async execute(interaction) {
		const question = interaction.options.getString("question");
		const options = interaction.options.getString("options").split(",");
		const multiSelect = interaction.options.getBoolean("multi_select");
		const duration = interaction.options.getInteger("duration");
		await interaction.reply({
			poll: {
				question: { text: question },
				answers: options.map((option) => ({ text: option })),
				allowMultiselect: multiSelect,
				duration: duration,
				layoutType: PollLayoutType.Default,
			},
		});
	},
};
