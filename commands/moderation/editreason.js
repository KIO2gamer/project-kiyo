// commands/moderation/editlog.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const ModerationLog = require('../../models/ModerationLog');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('editlog')
		.setDescription('Edit the reason for a specific log entry by log number.')
		.addIntegerOption(option =>
			option.setName('lognumber').setDescription('The log number to edit').setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('The new reason for the log entry')
				.setRequired(true)
		),
	category: 'moderation',
	async execute(interaction) {
		const logNumber = interaction.options.getInteger('lognumber');
		const newReason = interaction.options.getString('reason');

		try {
			const log = await ModerationLog.findOne({ logNumber: logNumber });

			if (log) {
				log.reason = newReason;
				await log.save();
				await interaction.reply(
					`Successfully updated reason for log #${logNumber} to: ${newReason}`
				);
			} else {
				await interaction.reply(`No log found with log number ${logNumber}.`);
			}
		} catch (error) {
			console.error(error);
			await interaction.reply('Failed to update the log. Please try again later.');
		}
	},
};
