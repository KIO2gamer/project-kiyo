// commands/moderation/deletelog.js
const { SlashCommandBuilder } = require('@discordjs/builders');
const ModerationLog = require('../../models/ModerationLog');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('deletelog')
		.setDescription('Delete a moderation log by log number.')
		.addIntegerOption(option =>
			option.setName('lognumber').setDescription('The log number to delete').setRequired(true)
		),
	category: 'moderation',
	async execute(interaction) {
		const logNumber = interaction.options.getInteger('lognumber');

		try {
			const log = await ModerationLog.findOneAndDelete({
				logNumber: logNumber,
			});

			if (log) {
				await interaction.reply(`Successfully deleted log #${logNumber}.`);
			} else {
				await interaction.reply(`No log found with log number ${logNumber}.`);
			}
		} catch (error) {
			console.error(error);
			await interaction.reply('Failed to delete the log. Please try again later.');
		}
	},
};
