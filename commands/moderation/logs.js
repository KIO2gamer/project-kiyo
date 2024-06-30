const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const ModerationLog = require('../../models/ModerationLog');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('logs')
		.setDescription('Show the moderation logs.')
		.addIntegerOption(option =>
			option
				.setName('limit')
				.setDescription('The number of logs to retrieve')
				.setRequired(false)
		)
		.addUserOption(option =>
			option.setName('user').setDescription('The user to filter logs by').setRequired(false)
		)
		.addIntegerOption(option =>
			option
				.setName('lognumber')
				.setDescription('The log number to search for')
				.setRequired(false)
		)
		.addStringOption(option =>
			option
				.setName('action')
				.setDescription('The action to filter logs by')
				.setRequired(false)
				.addChoices(
					{ name: 'warn', value: 'warn' },
					{ name: 'ban', value: 'ban' },
					{ name: 'timeout', value: 'timeout' },
					{ name: 'kick', value: 'kick' },
					{ name: 'tempban', value: 'tempban' },
					{ name: 'unban', value: 'unban' }
				)
		)
		.addUserOption(option =>
			option
				.setName('moderator')
				.setDescription('The moderator to filter logs by')
				.setRequired(false)
		),
	category: 'moderation',
	async execute(interaction) {
		const limit = interaction.options.getInteger('limit') || 10;
		const user = interaction.options.getUser('user');
		const logNumber = interaction.options.getInteger('lognumber');
		const action = interaction.options.getString('action');
		const moderator = interaction.options.getUser('moderator');

		try {
			let query = {};

			if (logNumber) {
				query.logNumber = logNumber;
			}
			if (user) {
				query.user = user.id;
			}
			if (action) {
				query.action = action;
			}
			if (moderator) {
				query.moderator = moderator.id;
			}

			let logs = await ModerationLog.find(query).sort({ logNumber: -1 }).limit(limit);

			if (logs.length === 0) {
				return interaction.reply('No moderation logs found.');
			}

			const embed = new EmbedBuilder()
				.setTitle('Moderation Logs')
				.setColor('#FF0000')
				.setTimestamp();

			const formatter = new Intl.DateTimeFormat('en-US', {
				year: 'numeric',
				month: 'long',
				day: 'numeric',
				hour: 'numeric',
				minute: 'numeric',
				second: 'numeric',
				timeZoneName: 'short',
			});

			const logDescriptions = logs
				.map(log => {
					const moderatorMention = `<@${log.moderator}>`;
					const punishedUser = `<@${log.user}>`;
					const formattedTimestamp = formatter.format(new Date(log.timestamp));

					return `**Log #${log.logNumber}**\n**Action**: ${log.action}\n**Moderator**: ${moderatorMention}\n**User**: ${punishedUser}\n**Reason**: ${log.reason}\n**Time**: ${formattedTimestamp}\n`;
				})
				.join('\n');

			embed.setDescription(logDescriptions);

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error(error);
			await interaction.reply('Failed to retrieve logs.');
		}
	},
};
