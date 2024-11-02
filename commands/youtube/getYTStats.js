const { SlashCommandBuilder } = require('discord.js');
const { google } = require('googleapis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('youtube_stats')
        .setDescription('Get YouTube channel statistics')
        .addStringOption((option) =>
            option
                .setName('channel')
                .setDescription('YouTube channel ID, URL, handle, or video URL')
                .setRequired(true)
        ),
    description_full:
        'Get YouTube channel statistics for a given channel ID, URL, handle, or video URL.',
    usage: '/youtube_stats <channel_link / channel_id / channel_handle / video_link>',
    examples: [
        '/youtube_stats https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw',
        '/youtube_stats UC_x5XG1OV2P6uZZ5FSM9Ttw',
        '/youtube_stats https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ],
    category: 'youtube',
    async execute(interaction) {
        const channelInput = interaction.options.getString('channel');
        const channelId = await extractChannelId(channelInput);

        if (!channelId) {
            return interaction.editReply(
                'Invalid YouTube channel ID, URL, handle, or video URL. Please provide a valid input.'
            );
        }

        try {
            const youtube = google.youtube({
                version: 'v3',
                auth: process.env.YOUTUBE_API_KEY,
            });

            const channelData = await getChannelData(youtube, channelId);
            if (!channelData) {
                return interaction.editReply(
                    'No channel found with the provided ID.'
                );
            }

            const latestVideoData = await getLatestVideoData(
                youtube,
                channelId
            );

            const embed = createEmbed(channelData, latestVideoData, channelId);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching YouTube stats:', error);
            await interaction.editReply(
                'An error occurred while fetching YouTube statistics. Please try again later.'
            );
        }
    },
};

async function extractChannelId(input) {
    if (isChannelId(input)) {
        return input;
    }

    const channelIdFromUrl = extractChannelIdFromUrl(input);
    if (channelIdFromUrl) {
        return channelIdFromUrl;
    }

    const channelIdFromVideo = await extractChannelIdFromVideo(input);
    if (channelIdFromVideo) {
        return channelIdFromVideo;
    }

    const channelIdFromHandle = await extractChannelIdFromHandle(input);
    if (channelIdFromHandle) {
        return channelIdFromHandle;
    }

    return null;
}

function isChannelId(input) {
    return /^UC[\w-]{21}[AQgw]$/.test(input);
}

function extractChannelIdFromUrl(input) {
    const channelUrlMatch = input.match(
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/(UC[\w-]{21}[AQgw])/
    );
    return channelUrlMatch ? channelUrlMatch[1] : null;
}

async function extractChannelIdFromVideo(input) {
    const videoUrlMatch = input.match(
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/
    );
    if (videoUrlMatch) {
        const videoId = videoUrlMatch[1];
        try {
            const youtube = google.youtube({
                version: 'v3',
                auth: process.env.YOUTUBE_API_KEY,
            });

            const response = await youtube.videos.list({
                part: 'snippet',
                id: videoId,
            });

            if (response.data.items.length > 0) {
                return response.data.items[0].snippet.channelId;
            }
        } catch (error) {
            console.error('Error fetching video details:', error);
        }
    }
    return null;
}

async function extractChannelIdFromHandle(input) {
    if (input.startsWith('@')) {
        try {
            const youtube = google.youtube({
                version: 'v3',
                auth: process.env.YOUTUBE_API_KEY,
            });

            const response = await youtube.search.list({
                part: 'snippet',
                q: input,
                type: 'channel',
                maxResults: 1,
            });

            if (response.data.items.length > 0) {
                return response.data.items[0].snippet.channelId;
            }
        } catch (error) {
            console.error('Error fetching channel details:', error);
        }
    }
    return null;
}

async function getChannelData(youtube, channelId) {
    const response = await youtube.channels.list({
        part: 'snippet,statistics,brandingSettings',
        id: channelId,
    });

    if (response.data.items.length === 0) {
        return null;
    }

    const channel = response.data.items[0];
    return {
        title: channel.snippet.title,
        description: channel.snippet.description,
        thumbnails: channel.snippet.thumbnails,
        publishedAt: channel.snippet.publishedAt,
        country: channel.snippet.country,
        viewCount: channel.statistics.viewCount,
        subscriberCount: channel.statistics.subscriberCount,
        videoCount: channel.statistics.videoCount,
        hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount,
        keywords: channel.brandingSettings.keywords,
        featuredChannelsUrls:
            channel.brandingSettings.channel.featuredChannelsUrls,
    };
}

async function getLatestVideoData(youtube, channelId) {
    const videosResponse = await youtube.search.list({
        part: 'id,snippet',
        channelId: channelId,
        type: 'video',
        order: 'date',
        maxResults: 1,
    });

    if (videosResponse.data.items.length === 0) {
        return {
            latestVideoTitle: 'N/A',
            latestVideoPublishedAt: 'N/A',
            latestVideoViews: 'N/A',
            latestVideoLikes: 'N/A',
            latestVideoComments: 'N/A',
        };
    }

    const videoId = videosResponse.data.items[0].id.videoId;
    const latestVideoTitle = videosResponse.data.items[0].snippet.title;
    const latestVideoPublishedAt =
        videosResponse.data.items[0].snippet.publishedAt;

    const videoResponse = await youtube.videos.list({
        part: 'statistics',
        id: videoId,
    });

    if (videoResponse.data.items.length === 0) {
        return {
            latestVideoTitle,
            latestVideoPublishedAt,
            latestVideoViews: 'N/A',
            latestVideoLikes: 'N/A',
            latestVideoComments: 'N/A',
        };
    }

    const videoStats = videoResponse.data.items[0].statistics;
    return {
        latestVideoTitle,
        latestVideoPublishedAt,
        latestVideoViews: videoStats.viewCount || 'N/A',
        latestVideoLikes: videoStats.likeCount || 'N/A',
        latestVideoComments: videoStats.commentCount || 'N/A',
    };
}

function createEmbed(channelData, latestVideoData, channelId) {
    return {
        color: 0xff0000,
        title: channelData.title,
        description: channelData.description,
        thumbnail: {
            url: channelData.thumbnails.default.url,
        },
        fields: createFields(channelData, latestVideoData),
        footer: {
            text: `Channel ID: ${channelId}`,
        },
    };
}

function createFields(channelData, latestVideoData) {
    return [
        {
            name: 'Channel Created',
            value: new Date(channelData.publishedAt).toDateString(),
            inline: true,
        },
        {
            name: 'Country',
            value: channelData.country || 'N/A',
            inline: true,
        },
        {
            name: 'Subscribers',
            value: channelData.hiddenSubscriberCount
                ? 'Hidden'
                : channelData.subscriberCount,
            inline: true,
        },
        { name: 'Total Views', value: channelData.viewCount, inline: true },
        {
            name: 'Video Count',
            value: channelData.videoCount,
            inline: true,
        },
        {
            name: 'Keywords',
            value: channelData.keywords
                ? channelData.keywords.join(', ').substring(0, 1024)
                : 'N/A',
        },
        {
            name: 'Featured Channels',
            value: channelData.featuredChannelsUrls
                ? channelData.featuredChannelsUrls.join(', ')
                : 'None',
        },
        { name: 'Latest Video', value: latestVideoData.latestVideoTitle },
        {
            name: 'Published',
            value: new Date(
                latestVideoData.latestVideoPublishedAt
            ).toDateString(),
            inline: true,
        },
        {
            name: 'Views',
            value: latestVideoData.latestVideoViews,
            inline: true,
        },
        {
            name: 'Likes',
            value: latestVideoData.latestVideoLikes,
            inline: true,
        },
        {
            name: 'Comments',
            value: latestVideoData.latestVideoComments,
            inline: true,
        },
    ];
}
