const { SlashCommandBuilder, EmbedBuilder, version: djsVersion } = require('discord.js');
const { formatUptime } = require('../../utils/formatUptime');
const os = require('os');
const { version } = require('../../../../package.json');

module.exports = {
	description_full:
		'Displays detailed information about the bot, including version, uptime, system statistics, and more.',
	usage: '/bot_info',
	examples: ['/bot_info'],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('bot_info')
		.setDescription('Displays information about the bot'),

	async execute(interaction) {
		try {
			const client = interaction.client;

			// Calculate uptime in seconds
			const uptimeSeconds = Math.floor(client.uptime / 1000);

			// Calculate memory usage
			const memoryUsage = process.memoryUsage();
			const memoryUsedMB = Math.round(memoryUsage.rss / 1024 / 1024);
			const memoryTotal = Math.round(os.totalmem() / 1024 / 1024);
			const memoryPercentage = ((memoryUsedMB / memoryTotal) * 100).toFixed(1);

			// Calculate guild statistics
			const totalGuilds = client.guilds.cache.size;
			const totalUsers = client.guilds.cache.reduce(
				(acc, guild) => acc + (guild.memberCount || 0),
				0
			);
			const totalChannels = client.channels.cache.size;

			// Create the embed
			const embed = new EmbedBuilder()
				.setColor('#00FF00')
				.setTitle('🤖 Bot Information')
				.setThumbnail(client.user.displayAvatarURL({ dynamic: true }))
				.addFields(
					{
						name: '📋 General',
						value: [
							`**Name:** ${client.user.username}`,
							`**ID:** ${client.user.id}`,
							`**Created:** <t:${Math.floor(client.user.createdTimestamp / 1000)}:R>`,
							`**Version:** v${version}`,
							`**Uptime:** ${formatUptime(uptimeSeconds)}`,
							`**Developer:** [KIO2gamer](https://kio2gamer.carrd.co/)`,
							`**GitHub:** [project-kiyo](https://github.com/KIO2gamer/discordbot)`,
						].join('\n'),
						inline: false,
					},
					{
						name: '📊 Statistics',
						value: [
							`**Servers:** ${totalGuilds.toLocaleString()}`,
							`**Users:** ${totalUsers.toLocaleString()}`,
							`**Channels:** ${totalChannels.toLocaleString()}`,
							`**Commands:** ${client.commands.size.toLocaleString()}`,
						].join('\n'),
						inline: true,
					},
					{
						name: '💻 System',
						value: [
							`**Platform:** ${process.platform} (${os.type()})`,
							`**Memory:** ${memoryUsedMB}MB / ${memoryTotal}MB (${memoryPercentage}%)`,
							`**Node.js:** ${process.version}`,
							`**Discord.js:** v${djsVersion}`,
						].join('\n'),
						inline: true,
					},
				)
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL({ dynamic: true })
				})
				.setTimestamp();

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error('Error executing bot_info command:', error);
			await interaction.reply({
				content: 'There was an error executing this command. Please try again later.',
				ephemeral: true,
			});
		}
	},
}; 