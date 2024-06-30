// commands/moderation/logs.js
const { SlashCommandBuilder } = require("@discordjs/builders");
const { EmbedBuilder } = require("discord.js");
const ModerationLog = require("../../models/ModerationLog");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("logs")
		.setDescription("Show the moderation logs.")
		.addIntegerOption((option) =>
			option
				.setName("limit")
				.setDescription("The number of logs to retrieve")
				.setRequired(false),
		)
		.addUserOption((option) =>
			option
				.setName("user")
				.setDescription("The user to filter logs by")
				.setRequired(false),
		)
		.addIntegerOption((option) =>
			option
				.setName("lognumber")
				.setDescription("The log number to search for")
				.setRequired(false),
		),
	category: "moderation",
	async execute(interaction) {
		const limit = interaction.options.getInteger("limit") || 10;
		const user = interaction.options.getUser("user");
		const logNumber = interaction.options.getInteger("lognumber");

		try {
			let logs;

			if (logNumber) {
				// Fetch log by logNumber
				logs = await ModerationLog.find({ logNumber: logNumber });

				if (logs.length === 0) {
					return interaction.reply(
						`No moderation log found for log number ${logNumber}.`,
					);
				}
			} else if (user) {
				// Fetch logs for a specific user
				logs = await ModerationLog.find({ user: user.id })
					.sort({ logNumber: -1 })
					.limit(limit);
			} else {
				// Fetch latest logs
				logs = await ModerationLog.find()
					.sort({ logNumber: -1 })
					.limit(limit);
			}

			if (logs.length === 0) {
				return interaction.reply("No moderation logs found.");
			}

			const embed = new EmbedBuilder()
				.setTitle("Moderation Logs")
				.setColor("#FF0000")
				.setTimestamp();

			const formatter = new Intl.DateTimeFormat("en-US", {
				year: "numeric",
				month: "long",
				day: "numeric",
				hour: "numeric",
				minute: "numeric",
				second: "numeric",
				timeZoneName: "short",
			});

			const logDescriptions = logs
				.map((log) => {
					const moderator = `<@${log.moderator}>`;
					const punishedUser = `<@${log.user}>`;
					const formattedTimestamp = formatter.format(
						new Date(log.timestamp),
					);

					return `**Log #${log.logNumber}**\n**Action**: ${log.action}\n**Moderator**: ${moderator}\n**User**: ${punishedUser}\n**Reason**: ${log.reason}\n**Time**: ${formattedTimestamp}\n`;
				})
				.join("\n");

			embed.setDescription(logDescriptions);

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error(error);
			await interaction.reply("Failed to retrieve logs.");
		}
	},
};
