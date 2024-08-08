const { SlashCommandBuilder } = require('@discordjs/builders');
const { EmbedBuilder } = require('discord.js');
const moment = require('moment'); // For date manipulation

module.exports = {
	data: new SlashCommandBuilder()
		.setName('reactionstats')
		.setDescription(
			'Displays statistics on reactions given in a specific channel or server-wide.'
		)
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('The channel to get reaction stats from (optional)')
				.setRequired(false)
		)
		.addStringOption(option =>
			option
				.setName('timeframe')
				.setDescription('The timeframe to get stats for (e.g., "24h", "7d")')
				.setRequired(false)
		),
	category: 'info',
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');
		const timeframe = interaction.options.getString('timeframe') || '7d';
		const endDate = new Date();
		const startDate = moment()
			.subtract(parseInt(timeframe.slice(0, -1)), timeframe.slice(-1))
			.toDate();

		let messages;
		if (channel) {
			messages = await channel.messages.fetch({ limit: 100 });
		} else {
			messages = await interaction.guild.channels.cache.reduce(async (acc, ch) => {
				if (ch.isTextBased()) {
					const msgs = await ch.messages.fetch({ limit: 100 });
					return (await acc).concat(msgs);
				}
				return acc;
			}, Promise.resolve([]));
		}

		const reactionCounts = {};
		const userReactionCounts = {};

		messages.forEach(msg => {
			if (msg.createdAt >= startDate && msg.createdAt <= endDate) {
				msg.reactions.cache.forEach(reaction => {
					const emoji = reaction.emoji.name;
					reactionCounts[emoji] = (reactionCounts[emoji] || 0) + reaction.count;

					reaction.users.cache.forEach(user => {
						userReactionCounts[user.id] = (userReactionCounts[user.id] || 0) + 1;
					});
				});
			}
		});

		const sortedReactions = Object.entries(reactionCounts).sort((a, b) => b[1] - a[1]);
		const sortedUsers = Object.entries(userReactionCounts).sort((a, b) => b[1] - a[1]);

		const embed = new EmbedBuilder()
			.setTitle('Reaction Stats')
			.setDescription(
				`Reaction statistics from ${channel ? `<#${channel.id}>` : 'the server'} over the past ${timeframe}`
			)
			.addFields([
				{
					name: 'Top Reactions',
					value:
						sortedReactions.map(([emoji, count]) => `${emoji}: ${count}`).join('\n') ||
						'No reactions',
				},
				{
					name: 'Top Reactors',
					value:
						sortedUsers.map(([user, count]) => `<@${user}>: ${count}`).join('\n') ||
						'No reactors',
				},
			])
			.setTimestamp();

		await interaction.reply({ embeds: [embed] });
	},
};
