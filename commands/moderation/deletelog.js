// commands/moderation/deletelog.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const ModerationLog = require('../../models/ModerationLog');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deletelog')
		.setDescription('Delete a moderation log/logs by log number/range.')
		.addIntegerOption(option =>
			option
				.setName('lognumber')
				.setDescription('The log number to delete')
				.setRequired(false)
		)
		.addStringOption(option =>
			option
				.setName('logrange')
				.setDescription('The range of log numbers to delete (e.g., 1-5)')
				.setRequired(false)
		),
	category: 'moderation',
	async execute(interaction) {
		const logNumber = interaction.options.getInteger('lognumber');
		const logRange = interaction.options.getString('logrange');

		if (!logNumber && !logRange) {
			await interaction.reply(
				'Please provide either a log number or a range of log numbers to delete.'
			);
			return;
		}

		try {
			if (logNumber) {
				const log = await ModerationLog.findOneAndDelete({ logNumber: logNumber });

				if (log) {
					await interaction.reply(`Successfully deleted log #${logNumber}.`);
				} else {
					await interaction.reply(`No log found with log number ${logNumber}.`);
				}
			} else if (logRange) {
				const [start, end] = logRange.split('-').map(num => parseInt(num.trim()));

				if (isNaN(start) || isNaN(end)) {
					await interaction.reply(
						'Invalid log range. Please provide a valid range (e.g., 1-5).'
					);
					return;
				}

				const deletedLogs = await ModerationLog.deleteMany({
					logNumber: { $gte: start, $lte: end },
				});

				if (deletedLogs.deletedCount > 0) {
					await interaction.reply(
						`Successfully deleted ${deletedLogs.deletedCount} logs in the range #${start}-#${end}.`
					);
				} else {
					await interaction.reply(`No logs found in the range #${start}-#${end}.`);
				}
			}
		} catch (error) {
			console.error(error);
			await interaction.reply('Failed to delete the log(s). Please try again later.');
		}
	},
};
