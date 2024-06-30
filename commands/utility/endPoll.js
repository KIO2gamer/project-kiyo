const { SlashCommandBuilder } = require("@discordjs/builders");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("end_poll")
		.setDescription("Ends a poll")
		.addStringOption((option) =>
			option
				.setName("message_id")
				.setDescription("Message ID of the poll"),
		)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("Channel where the poll is created"),
		),
	category: "utility",
	async execute(interaction) {
		const messageId = interaction.options.getString("message_id");
		const channel = interaction.options.getChannel("channel");
		const message = await channel.messages.fetch(messageId);
		message.poll.end();
		await interaction.reply("Poll Ended Succesfully!!!");
	},
};
