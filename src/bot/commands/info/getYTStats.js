const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { google } = require('googleapis');
const { handleError } = require('./../../utils/errorHandler');

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full: 'Get detailed YouTube channel statistics including subscriber count, view count, latest videos, and more. Supports channel URLs, IDs, handles, and video URLs.',
	usage: '/ytstats <channel>',
	examples: [
		'/ytstats @Markiplier',
		'/ytstats https://youtube.com/@PewDiePie',
		'/ytstats https://www.youtube.com/watch?v=dQw4w9WgXcQ',
		'/ytstats UC_x5XG1OV2P6uZZ5FSM9Ttw'
	],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('ytstats')
		.setDescription('Get YouTube channel statistics')
		.addStringOption(option =>
			option
				.setName('channel')
				.setDescription('Channel URL, ID, handle (@username), or video URL')
				.setRequired(true)
				.setMinLength(2)
				.setMaxLength(200)
		),

	async execute(interaction) {
		try {
			await interaction.deferReply();

			const channelInput = interaction.options.getString('channel');
			const apiKey = process.env.YOUTUBE_API_KEY;

			// Validate API key
			if (!apiKey) {
				await handleError(
					interaction,
					new Error('API key missing'),
					'CONFIGURATION',
					'The YouTube API is not properly configured. Please contact the bot administrator.'
				);
				return;
			}

			try {
				const youtube = google.youtube({
					version: 'v3',
					auth: apiKey
				});

				// Extract channel ID with improved error handling
				const channelId = await extractChannelId(youtube, channelInput).catch(error => {
					if (error.code === 403) throw error;
					return null;
				});

				if (!channelId) {
					await handleError(
						interaction,
						new Error('Invalid channel'),
						'VALIDATION',
						'Could not find a valid YouTube channel. Please check your input and try again.'
					);
					return;
				}

				// Get channel data with additional fields
				const channelData = await getChannelData(youtube, channelId);
				if (!channelData) {
					await handleError(
						interaction,
						new Error('Channel not found'),
						'NOT_FOUND',
						'The specified YouTube channel could not be found.'
					);
					return;
				}

				// Get latest videos with enhanced details
				const latestVideos = await getLatestVideos(youtube, channelId);

				// Get channel playlists count
				const playlistsData = await getPlaylistsCount(youtube, channelId);

				// Create embed and buttons
				const embed = createChannelEmbed(channelData, latestVideos, channelId, playlistsData);
				const components = createChannelButtons(channelData, latestVideos);

				await interaction.editReply({
					embeds: [embed],
					components: [components]
				});

			} catch (error) {
				if (error.code === 403) {
					await handleError(
						interaction,
						error,
						'API_ERROR',
						'The YouTube API quota has been exceeded. Please try again tomorrow.'
					);
				} else if (error.code === 404) {
					await handleError(
						interaction,
						error,
						'NOT_FOUND',
						'The specified YouTube channel or video could not be found.'
					);
				} else if (error.code === 400) {
					await handleError(
						interaction,
						error,
						'VALIDATION',
						'Invalid input format. Please provide a valid YouTube channel URL, ID, or handle.'
					);
				} else {
					await handleError(
						interaction,
						error,
						'API_ERROR',
						'An error occurred while fetching YouTube data. Please try again later.'
					);
				}
			}
		} catch (error) {
			await handleError(
				interaction,
				error,
				'COMMAND_EXECUTION',
				'An error occurred while processing the YouTube statistics request.'
			);
		}
	}
};

// Helper function to extract channel ID from various inputs
async function extractChannelId(youtube, input) {
	// Direct channel ID
	if (/^UC[\w-]{21}[AQgw]$/.test(input)) {
		return input;
	}

	// Channel URL patterns
	const urlPatterns = {
		channel: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel|c)\/(UC[\w-]{21}[AQgw])/,
		custom: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:c|user)\/([^\/\s?]+)/,
		handle: /(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([^\/\s?]+)/,
		video: /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/
	};

	// Check each URL pattern
	for (const [type, pattern] of Object.entries(urlPatterns)) {
		const match = input.match(pattern);
		if (match) {
			if (type === 'video') {
				try {
					const response = await youtube.videos.list({
						part: 'snippet',
						id: match[1]
					});
					if (response.data.items.length > 0) {
						return response.data.items[0].snippet.channelId;
					}
				} catch (error) {
					throw new Error('Failed to fetch video details: ' + error.message);
				}
			} else if (type === 'custom' || type === 'handle') {
				try {
					const response = await youtube.search.list({
						part: 'snippet',
						q: match[1],
						type: 'channel',
						maxResults: 1
					});
					if (response.data.items.length > 0) {
						return response.data.items[0].snippet.channelId;
					}
				} catch (error) {
					throw new Error('Failed to fetch channel by name: ' + error.message);
				}
			} else {
				return match[1];
			}
		}
	}

	// Handle (@username) if no URL patterns match
	if (input.includes('@')) {
		try {
			const response = await youtube.search.list({
				part: 'snippet',
				q: input.replace('@', ''),
				type: 'channel',
				maxResults: 1
			});
			if (response.data.items.length > 0) {
				return response.data.items[0].snippet.channelId;
			}
		} catch (error) {
			throw new Error('Failed to fetch channel by handle: ' + error.message);
		}
	}

	// Try direct search as last resort
	try {
		const response = await youtube.search.list({
			part: 'snippet',
			q: input,
			type: 'channel',
			maxResults: 1
		});
		if (response.data.items.length > 0) {
			return response.data.items[0].snippet.channelId;
		}
	} catch (error) {
		throw new Error('Failed to search for channel: ' + error.message);
	}

	return null;
}

// Helper function to get channel data
async function getChannelData(youtube, channelId) {
	const response = await youtube.channels.list({
		part: 'snippet,statistics,brandingSettings,contentDetails,status,topicDetails',
		id: channelId
	});

	if (response.data.items.length === 0) {
		return null;
	}

	return response.data.items[0];
}

// Helper function to get latest videos with enhanced details
async function getLatestVideos(youtube, channelId) {
	const response = await youtube.search.list({
		part: 'id,snippet',
		channelId: channelId,
		type: 'video',
		order: 'date',
		maxResults: 5
	});

	if (response.data.items.length === 0) {
		return [];
	}

	// Get detailed stats for each video
	const videoIds = response.data.items.map(item => item.id.videoId);
	const statsResponse = await youtube.videos.list({
		part: 'statistics,contentDetails,liveStreamingDetails',
		id: videoIds.join(',')
	});

	// Combine video data
	return response.data.items.map((item, index) => ({
		...item,
		statistics: statsResponse.data.items[index].statistics,
		contentDetails: statsResponse.data.items[index].contentDetails,
		liveStreamingDetails: statsResponse.data.items[index].liveStreamingDetails
	}));
}

// Helper function to get playlists count
async function getPlaylistsCount(youtube, channelId) {
	try {
		const response = await youtube.playlists.list({
			part: 'id',
			channelId: channelId,
			maxResults: 1
		});
		return {
			totalCount: response.data.pageInfo.totalResults,
			error: null
		};
	} catch (error) {
		return {
			totalCount: 0,
			error: error.message
		};
	}
}

// Helper function to format numbers
function formatNumber(num) {
	if (!num) return '0';
	if (num >= 1000000000) {
		return (num / 1000000000).toFixed(1) + 'B';
	}
	if (num >= 1000000) {
		return (num / 1000000).toFixed(1) + 'M';
	}
	if (num >= 1000) {
		return (num / 1000).toFixed(1) + 'K';
	}
	return num.toString();
}

// Helper function to format duration
function formatDuration(duration) {
	if (!duration) return '0:00';
	const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
	if (!match) return '0:00';

	const hours = (match[1] || '').replace('H', '');
	const minutes = (match[2] || '').replace('M', '');
	const seconds = (match[3] || '').replace('S', '');

	let result = '';
	if (hours) result += `${hours}:`;
	if (hours) {
		result += `${minutes.padStart(2, '0')}:`;
	} else {
		result += `${minutes || '0'}:`;
	}
	result += seconds.padStart(2, '0');
	return result;
}

// Helper function to create channel buttons
function createChannelButtons(channelData, latestVideos) {
	const row = new ActionRowBuilder();

	// Channel URL button
	row.addComponents(
		new ButtonBuilder()
			.setLabel('Channel')
			.setStyle(ButtonStyle.Link)
			.setURL(`https://youtube.com/channel/${channelData.id}`)
	);

	// Latest video button (if available)
	if (latestVideos.length > 0) {
		row.addComponents(
			new ButtonBuilder()
				.setLabel('Latest Video')
				.setStyle(ButtonStyle.Link)
				.setURL(`https://youtube.com/watch?v=${latestVideos[0].id.videoId}`)
		);
	}

	// Custom URL button (if available)
	if (channelData.snippet.customUrl) {
		row.addComponents(
			new ButtonBuilder()
				.setLabel('Custom URL')
				.setStyle(ButtonStyle.Link)
				.setURL(`https://youtube.com/${channelData.snippet.customUrl}`)
		);
	}

	return row;
}

// Helper function to create channel embed
function createChannelEmbed(channelData, latestVideos, channelId, playlistsData) {
	const {
		snippet,
		statistics,
		brandingSettings,
		contentDetails,
		status,
		topicDetails
	} = channelData;

	const embed = new EmbedBuilder()
		.setTitle(snippet.title)
		.setDescription(snippet.description?.slice(0, 250) + (snippet.description?.length > 250 ? '...' : ''))
		.setThumbnail(snippet.thumbnails.high?.url || snippet.thumbnails.default?.url)
		.setColor('#FF0000')
		.addFields(
			{
				name: '📊 Statistics',
				value: [
					`**Subscribers:** ${statistics.hiddenSubscriberCount ? '🔒 Hidden' : formatNumber(statistics.subscriberCount)}`,
					`**Total Views:** ${formatNumber(statistics.viewCount)}`,
					`**Total Videos:** ${formatNumber(statistics.videoCount)}`,
					playlistsData.totalCount ? `**Playlists:** ${formatNumber(playlistsData.totalCount)}` : null,
				].filter(Boolean).join('\n'),
				inline: true
			},
			{
				name: '📅 Channel Info',
				value: [
					`**Created:** <t:${Math.floor(new Date(snippet.publishedAt).getTime() / 1000)}:R>`,
					`**Country:** ${snippet.country || 'Not specified'}`,
					`**Language:** ${snippet.defaultLanguage || 'Not specified'}`,
					status.privacyStatus ? `**Privacy:** ${status.privacyStatus}` : null,
					status.madeForKids ? '**Made for Kids:** Yes' : null,
				].filter(Boolean).join('\n'),
				inline: true
			}
		);

	// Add topics if available
	if (topicDetails?.topicCategories?.length > 0) {
		const topics = topicDetails.topicCategories.map(url =>
			url.split('/').pop().replace(/_/g, ' ')
		);
		embed.addFields({
			name: '🏷️ Topics',
			value: topics.slice(0, 5).join('\n'),
			inline: false
		});
	}

	// Add latest videos
	if (latestVideos.length > 0) {
		const videoList = latestVideos.map(video => {
			const isLive = video.liveStreamingDetails?.actualEndTime === undefined &&
				video.liveStreamingDetails?.scheduledStartTime !== undefined;
			const duration = isLive ? '🔴 LIVE' : formatDuration(video.contentDetails.duration);
			const views = formatNumber(video.statistics.viewCount);
			const timestamp = isLive ?
				(video.liveStreamingDetails.actualStartTime || video.liveStreamingDetails.scheduledStartTime) :
				video.snippet.publishedAt;

			return [
				`[${video.snippet.title}](https://youtube.com/watch?v=${video.id.videoId})`,
				`┗ ${duration} • ${views} views • <t:${Math.floor(new Date(timestamp).getTime() / 1000)}:R>`
			].join('\n');
		});

		embed.addFields({
			name: '📺 Latest Videos',
			value: videoList.join('\n\n'),
			inline: false
		});
	}

	// Add featured channels if available
	if (brandingSettings.channel?.featuredChannelsUrls?.length > 0) {
		embed.addFields({
			name: '🤝 Featured Channels',
			value: `This channel features ${brandingSettings.channel.featuredChannelsUrls.length} other channels`,
			inline: false
		});
	}

	embed.setFooter({
		text: `Channel ID: ${channelId}`,
		iconURL: 'https://www.youtube.com/s/desktop/28b67e7f/img/favicon_144x144.png'
	}).setTimestamp();

	return embed;
}
