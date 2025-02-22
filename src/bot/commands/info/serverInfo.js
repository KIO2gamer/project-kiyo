const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { handleError } = require('../../utils/errorHandler.js');

module.exports = {
	description_full:
		'Displays comprehensive information about the current Discord server, including its name, owner, creation date, member count, channels, roles, emojis, and more.',
	usage: '/server_info',
	examples: ['/server_info'],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('server_info')
		.setDescription('Get info about a server!'),

	async execute(interaction) {
		try {
			await sendServerInfo(interaction);
		} catch (error) {
			console.error('Error executing server_info command:', error);
			await handleError(interaction, error);
		}
	},
};

async function sendServerInfo(interaction) {
	const { guild } = interaction;

	try {
		const owner = await guild.fetchOwner();
		const serverInfoEmbed = new EmbedBuilder()
			.setTitle('__Server Information__')
			.setThumbnail(guild.iconURL({ dynamic: true, size: 512 }))
			.addFields(
				{ name: '📋 Name', value: guild.name, inline: true },
				{
					name: '📝 Description',
					value: guild.description || 'No description',
					inline: false,
				},
				{
					name: '👑 Owner',
					value: `${owner.user.tag}`,
					inline: true,
				},
				{
					name: '🆔 Server ID',
					value: `\`${guild.id}\``,
					inline: true,
				},
				{
					name: '📅 Created',
					value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
					inline: true,
				},
				{
					name: '📊 Channels',
					value: `Text: ${guild.channels.cache.filter((channel) => channel.type === 0).size}\nVoice: ${guild.channels.cache.filter((channel) => channel.type === 2).size}\nCategory: ${guild.channels.cache.filter((channel) => channel.type === 4).size}\nForums: ${guild.channels.cache.filter((channel) => channel.type === 15).size}`,
					inline: true,
				},
				{
					name: '👥 Members',
					value: `**Total: ${guild.memberCount}**\nOnline: ${guild.members.cache.filter((member) => member.presence?.status === 'online').size}\nDND: ${guild.members.cache.filter((member) => member.presence?.status === 'dnd').size}\nIdle: ${guild.members.cache.filter((member) => member.presence?.status === 'idle').size}\nOffline: ${guild.members.cache.filter((member) => !member.presence || member.presence.status === 'offline').size}`,
					inline: true,
				},
				{
					name: '🎭 Roles',
					value: `${guild.roles.cache.size}`,
					inline: true,
				},
				{
					name: '😁 Emojis',
					value: `${guild.emojis.cache.size}`,
					inline: true,
				},
				{
					name: '🔰 Boost Level',
					value: `${guild.premiumTier} (${guild.premiumSubscriptionCount} boosts)`,
					inline: true,
				},
				{
					name: '🛡️ Verification Level',
					value: getVerificationLevelText(guild.verificationLevel),
					inline: true,
				},
				{
					name: '⚙️ System Channel',
					value: `AFK: ${guild.afkChannel ? guild.afkChannel.name : 'None'}\nTimeout: ${guild.afkTimeout / 60}m\nSystem: ${guild.systemChannel ? guild.systemChannel.name : 'None'}`,
					inline: true,
				},
				{
					name: '🔒 MFA Level',
					value: getMfaLevelText(guild.mfaLevel),
					inline: true,
				},
				{
					name: '🌍 Locale',
					value: `${guild.preferredLocale}`,
					inline: true,
				},
				{
					name: '🔗 Vanity URL',
					value: guild.vanityURLCode || 'None',
					inline: true,
				},
			)
			.setColor(0x00ae86)
			.setFooter({
				text: `Requested by ${interaction.user.tag}`,
				iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
			});

		await interaction.reply({ embeds: [serverInfoEmbed] });
	} catch (error) {
		console.error('Error fetching server information:', error);
		await handleError(interaction, error);
	}
}

function getVerificationLevelText(level) {
	switch (level) {
		case 0:
			return 'None';
		case 1:
			return 'Low';
		case 2:
			return 'Medium';
		case 3:
			return 'High';
		case 4:
			return 'Very High';
		default:
			return 'Unknown';
	}
}

function getMfaLevelText(level) {
	return level === 0 ? 'None' : 'Elevated';
}
