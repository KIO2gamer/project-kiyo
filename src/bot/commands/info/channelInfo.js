const {
	SlashCommandBuilder,
	EmbedBuilder,
	PermissionsBitField,
	ChannelType,
} = require('discord.js');
const { handleError } = require('../utils/errorHandler');
const { getChannelType } = require('../utils/channelTypes');
const {
	formatCategorizedPermissions,
	splitPermissionText,
	formatChannelPermissions
} = require('../utils/permissionFormatter');

module.exports = {
	description_full:
		'Provides detailed information about a specific channel, including its ID, type, creation date, topic, position, permissions, and more specialized details based on channel type.',
	usage: '/channel_info <channel>',
	examples: [
		'/channel_info #general',
		'/channel_info 123456789012345678 (channel ID)',
	],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('channel_info')
		.setDescription('Provides detailed information about a specific channel')
		.addChannelOption((option) =>
			option
				.setName('channel')
				.setDescription('The channel to get information about')
				.setRequired(true),
		),
	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');

		try {
			// Get permissions using the utility function
			const getPermissions = (channel, guild) => {
				const permissions = channel.permissionsFor(guild.roles.everyone);
				if (!permissions) return 'No permissions';

				// Use the utility function for formatting categorized permissions
				return formatCategorizedPermissions(permissions, {
					checkmark: true,
					headers: true,
					maxLength: 1024
				});
			};

			// Initialize the embed
			const embed = new EmbedBuilder()
				.setTitle(`${getChannelIcon(channel)} Channel Info: ${channel.name}`)
				.setColor(interaction.guild.members.me.displayHexColor)
				.setThumbnail(interaction.guild.iconURL())
				.addFields(
					{ name: '📋 ID', value: `\`${channel.id}\``, inline: true },
					{ name: '📁 Type', value: getChannelType(channel), inline: true },
					{
						name: '🕒 Created',
						value: `<t:${Math.floor(channel.createdAt.getTime() / 1000)}:R>`,
						inline: true
					}
				);

			// Add fields based on channel type
			if (channel.type === ChannelType.GuildText ||
				channel.type === ChannelType.GuildAnnouncement) {
				embed.addFields(
					{
						name: '📢 Topic',
						value: channel.topic || 'No topic set',
						inline: false
					},
					{
						name: '🔞 NSFW',
						value: channel.nsfw ? 'Yes' : 'No',
						inline: true
					},
					{
						name: '⏱️ Rate Limit',
						value: channel.rateLimitPerUser
							? `${channel.rateLimitPerUser} seconds`
							: 'No slow mode',
						inline: true
					},
					{
						name: '🧵 Threads',
						value: channel.threads?.cache.size
							? `${channel.threads.cache.size} active threads`
							: 'No active threads',
						inline: true
					}
				);
			}

			// Voice channel specific info
			if (channel.type === ChannelType.GuildVoice ||
				channel.type === ChannelType.GuildStageVoice) {
				embed.addFields(
					{
						name: '🎤 Bitrate',
						value: `${channel.bitrate / 1000} kbps`,
						inline: true
					},
					{
						name: '👥 User Limit',
						value: channel.userLimit ? `${channel.userLimit} users` : 'Unlimited',
						inline: true
					},
					{
						name: '🔊 Members Connected',
						value: `${channel.members.size} members`,
						inline: true
					},
					{
						name: '🎥 Video Quality',
						value: channel.videoQualityMode === 1 ? 'Auto' : 'Full',
						inline: true
					}
				);
			}

			// Forum channel specific info
			if (channel.type === ChannelType.GuildForum) {
				embed.addFields(
					{
						name: '📢 Topic',
						value: channel.topic || 'No topic set',
						inline: false
					},
					{
						name: '📝 Posts',
						value: `${channel.threads?.cache.size || 0} posts`,
						inline: true
					},
					{
						name: '🏷️ Available Tags',
						value: channel.availableTags?.length
							? channel.availableTags.map(tag => tag.name).join(', ')
							: 'No tags configured',
						inline: false
					}
				);
			}

			// Add category and position info for all channel types
			if (channel.parent) {
				embed.addFields(
					{
						name: '📂 Category',
						value: channel.parent.name,
						inline: true
					},
					{
						name: '📊 Position',
						value: `${channel.position + 1} of ${channel.parent.children.cache.size}`,
						inline: true
					}
				);
			} else if (channel.type !== ChannelType.GuildCategory) {
				embed.addFields({
					name: '📂 Category',
					value: 'None (Top-level channel)',
					inline: true
				});
			}

			// Add permissions info - using the utility function and splitting if needed
			const permissionText = getPermissions(channel, interaction.guild);

			// Use the splitPermissionText utility function to handle long permission lists
			const permissionParts = splitPermissionText(permissionText);

			// Add each part as a separate field
			for (let i = 0; i < permissionParts.length; i++) {
				embed.addFields({
					name: i === 0 ? '🔐 Default Permissions' : '🔐 Default Permissions (continued)',
					value: permissionParts[i],
					inline: false
				});
			}

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			await handleError(interaction, error);
		}
	},
};

// Helper function to get an appropriate emoji based on channel type
function getChannelIcon(channel) {
	switch (channel.type) {
		case ChannelType.GuildText: return '💬';
		case ChannelType.GuildVoice: return '🔊';
		case ChannelType.GuildCategory: return '📂';
		case ChannelType.GuildAnnouncement: return '📢';
		case ChannelType.AnnouncementThread:
		case ChannelType.PublicThread:
		case ChannelType.PrivateThread: return '🧵';
		case ChannelType.GuildStageVoice: return '🎭';
		case ChannelType.GuildForum: return '📋';
		default: return '📝';
	}
}