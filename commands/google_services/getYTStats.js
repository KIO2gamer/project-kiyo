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
                .setRequired(true),
        ),
    description_full:
        'Get YouTube channel statistics for a given channel ID, URL, handle, or video URL.',
    usage: '/youtube_stats <channel_link / channel_id / channel_handle / video_link>',
    examples: [
        '/youtube_stats https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw',
        '/youtube_stats UC_x5XG1OV2P6uZZ5FSM9Ttw',
        '/youtube_stats https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    ],
    category: 'google_services',
    async execute(interaction) {
        const channelInput = interaction.options.getString('channel');
        const channelId = await extractChannelId(channelInput);

        if (!channelId) {
            return interaction.editReply(
                'Invalid YouTube channel ID, URL, handle, or video URL. Please provide a valid input.',
            );
        }

        try {
            const youtube = google.youtube({
                version: 'v3',
                auth: process.env.YOUTUBE_API_KEY,
            });

            const response = await youtube.channels.list({
                part: 'snippet,statistics,brandingSettings',
                id: channelId,
            });

            if (response.data.items.length === 0) {
                return interaction.editReply(
                    'No channel found with the provided ID.',
                );
            }

            const channel = response.data.items[0];
            const { title, description, thumbnails, publishedAt, country } =
                channel.snippet;
            const {
                viewCount,
                subscriberCount,
                videoCount,
                hiddenSubscriberCount,
            } = channel.statistics;
            const {
                keywords,
                channel: { featuredChannelsUrls },
            } = channel.brandingSettings;

            // Fetch the latest video
            const videosResponse = await youtube.search.list({
                part: 'id,snippet',
                channelId: channelId,
                type: 'video',
                order: 'date',
                maxResults: 1,
            });

            let latestVideoTitle = 'N/A';
            let latestVideoPublishedAt = 'N/A';
            let latestVideoViews = 'N/A';
            let latestVideoLikes = 'N/A';
            let latestVideoComments = 'N/A';

            if (videosResponse.data.items.length > 0) {
                const videoId = videosResponse.data.items[0].id.videoId;
                latestVideoTitle = videosResponse.data.items[0].snippet.title;
                latestVideoPublishedAt =
                    videosResponse.data.items[0].snippet.publishedAt;

                const videoResponse = await youtube.videos.list({
                    part: 'statistics',
                    id: videoId,
                });

                if (videoResponse.data.items.length > 0) {
                    const videoStats = videoResponse.data.items[0].statistics;
                    latestVideoViews = videoStats.viewCount || 'N/A';
                    latestVideoLikes = videoStats.likeCount || 'N/A';
                    latestVideoComments = videoStats.commentCount || 'N/A';
                }
            }

            const embed = {
                color: 0xff0000,
                title: title,
                description: description,
                thumbnail: {
                    url: thumbnails.default.url,
                },
                fields: [
                    {
                        name: 'Channel Created',
                        value: new Date(publishedAt).toDateString(),
                        inline: true,
                    },
                    { name: 'Country', value: country || 'N/A', inline: true },
                    {
                        name: 'Subscribers',
                        value: hiddenSubscriberCount
                            ? 'Hidden'
                            : subscriberCount,
                        inline: true,
                    },
                    { name: 'Total Views', value: viewCount, inline: true },
                    { name: 'Video Count', value: videoCount, inline: true },
                    {
                        name: 'Keywords',
                        value: keywords
                            ? keywords.join(', ').substring(0, 1024)
                            : 'N/A',
                    },
                    {
                        name: 'Featured Channels',
                        value: featuredChannelsUrls
                            ? featuredChannelsUrls.join(', ')
                            : 'None',
                    },
                    { name: 'Latest Video', value: latestVideoTitle },
                    {
                        name: 'Published',
                        value: new Date(latestVideoPublishedAt).toDateString(),
                        inline: true,
                    },
                    { name: 'Views', value: latestVideoViews, inline: true },
                    { name: 'Likes', value: latestVideoLikes, inline: true },
                    {
                        name: 'Comments',
                        value: latestVideoComments,
                        inline: true,
                    },
                ],
                footer: {
                    text: `Channel ID: ${channelId}`,
                },
            };

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error fetching YouTube stats:', error);
            await interaction.editReply(
                'An error occurred while fetching YouTube statistics. Please try again later.',
            );
        }
    },
};

async function extractChannelId(input) {
    // Check if input is already a channel ID
    if (/^UC[\w-]{21}[AQgw]$/.test(input)) {
        return input;
    }

    // Check if input is a channel URL
    const channelUrlMatch = input.match(
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/(UC[\w-]{21}[AQgw])/,
    );
    if (channelUrlMatch) {
        return channelUrlMatch[1];
    }

    // Check if input is a video URL
    const videoUrlMatch = input.match(
        /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([\w-]{11})/,
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

    // Check if input is a YouTube handle
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
