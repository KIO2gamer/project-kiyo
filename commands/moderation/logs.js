const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ModerationLog = require('../../bot_utils/ModerationLog');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('logs')
		.setDescription('Show the moderation logs.')
		.addIntegerOption(option =>
			option.setName('limit').setDescription('The number of logs per page').setRequired(false)
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
				.setName('logrange')
				.setDescription('The range of log numbers to search for (e.g., 1-5)')
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
		const limit = interaction.options.getInteger('limit') || 5;
		const user = interaction.options.getUser('user');
		const logNumber = interaction.options.getInteger('lognumber');
		const logRange = interaction.options.getString('logrange');
		const action = interaction.options.getString('action');
		const moderator = interaction.options.getUser('moderator');
		let page = 1;

		try {
			let query = {};

			if (logNumber) {
				query.logNumber = logNumber;
			}
			if (logRange) {
				const [start, end] = logRange.split('-').map(num => parseInt(num.trim()));
				if (!isNaN(start) && !isNaN(end)) {
					query.logNumber = { $gte: start, $lte: end };
				} else {
					return interaction.reply(
						'Invalid log range. Please provide a valid range (e.g., 1-5).'
					);
				}
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

			const logs = await ModerationLog.find(query).sort({ logNumber: -1 });

			if (logs.length === 0) {
				return interaction.reply('No moderation logs found.');
			}

			const totalPages = Math.ceil(logs.length / limit);

			const generateEmbed = page => {
				const start = (page - 1) * limit;
				const end = page * limit;
				const currentLogs = logs.slice(start, end);

				const embed = new EmbedBuilder()
					.setTitle('Moderation Logs')
					.setColor('#FF0000')
					.setTimestamp()
					.setFooter({ text: `Page ${page} of ${totalPages}` });

				const formatter = new Intl.DateTimeFormat('en-US', {
					year: 'numeric',
					month: 'long',
					day: 'numeric',
					hour: 'numeric',
					minute: 'numeric',
					second: 'numeric',
					timeZoneName: 'short',
				});

				const logDescriptions = currentLogs
					.map(log => {
						const moderatorMention = `<@${log.moderator}>`;
						const punishedUser = `<@${log.user}>`;
						const formattedTimestamp = formatter.format(new Date(log.timestamp));

						return `**Log #${log.logNumber}**\n**Action**: ${log.action}\n**Moderator**: ${moderatorMention}\n**User**: ${punishedUser}\n**Reason**: ${log.reason}\n**Time**: ${formattedTimestamp}\n`;
					})
					.join('\n');

				embed.setDescription(logDescriptions);
				return embed;
			};

			const generateButtons = page => {
				const row = new ActionRowBuilder();
				if (page > 1) {
					row.addComponents(
						new ButtonBuilder()
							.setCustomId('prev')
							.setLabel('Previous')
							.setStyle(ButtonStyle.Primary)
					);
				}

				if (page < totalPages) {
					row.addComponents(
						new ButtonBuilder()
							.setCustomId('next')
							.setLabel('Next')
							.setStyle(ButtonStyle.Primary)
					);
				}

				return row.components.length > 0 ? [row] : [];
			};

			const embed = generateEmbed(page);
			const buttons = generateButtons(page);

			const message = await interaction.reply({
				embeds: [embed],
				components: buttons,
				fetchReply: true,
			});

			const filter = i => i.user.id === interaction.user.id;
			const collector = message.createMessageComponentCollector({ filter, time: 60000 });

			collector.on('collect', async i => {
				if (i.customId === 'prev') {
					page--;
				} else if (i.customId === 'next') {
					page++;
				}

				const embed = generateEmbed(page);
				const buttons = generateButtons(page);

				await i.update({ embeds: [embed], components: buttons });
			});

			collector.on('end', () => {
				if (message) {
					message.edit({ components: [] });
				}
			});
		} catch (error) {
			console.error(error);
			await interaction.reply('Failed to retrieve logs.');
		}
	},
};
