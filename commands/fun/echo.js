const {
	SlashCommandBuilder,
	ChannelType,
	EmbedBuilder,
	PermissionFlagsBits,
} = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("echo")
		.setDescription("Replies with your input!")
		.addStringOption((option) =>
			option
				.setName("input")
				.setDescription("The input to echo back")
				.setMaxLength(2000)
				.setRequired(true),
		)
		.addChannelOption((option) =>
			option
				.setName("channel")
				.setDescription("The channel to echo into")
				.addChannelTypes(ChannelType.GuildText)
				.setRequired(true),
		)
		.addBooleanOption((option) =>
			option
				.setName("embed")
				.setDescription("Whether or not the echo should be embedded"),
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
	category: "fun",
	async execute(interaction) {
		const input = interaction.options.getString("input");
		const channel = interaction.options.getChannel("channel");
		const useEmbed = interaction.options.getBoolean("embed");

		// Check if the bot has permission to send messages in the target channel
		// if (!channel || !channel.permissionsFor(interaction.guild.me).has(PermissionFlagsBits.SendMessages)) {
		//     return interaction.reply({
		//         content: `I don't have permission to send messages in ${channel}.`,
		//         ephemeral: true
		//     });
		// }

		try {
			if (useEmbed) {
				const echoEmbed = new EmbedBuilder()
					.setColor("#0099ff")
					.setTitle(`Echoed by ${interaction.user.tag}`)
					.setDescription(`**Message:** ${input}`)
					.setFooter({
						text: `Echoed by ${interaction.user.tag}`,
						iconURL: interaction.user.displayAvatarURL({
							dynamic: true,
						}),
					})
					.setTimestamp();

				await channel.send({ embeds: [echoEmbed] });
			} else {
				await channel.send(
					`**Message:** ${input}\n*Echoed by: ${interaction.user.tag}*`,
				);
			}

			await interaction.reply({
				content: `Message echoed successfully in ${channel}.`,
				ephemeral: true,
			});
		} catch (error) {
			console.error("Error sending echo message:", error);
			await interaction.reply({
				content: "There was an error trying to execute that command.",
				ephemeral: true,
			});
		}
	},
};
