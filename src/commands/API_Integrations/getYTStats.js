const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const { google } = require("googleapis");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    description_full:
        "Get detailed YouTube channel statistics including subscriber count, view count, latest videos, and more. Supports channel URLs, IDs, handles, and video URLs.",
    usage: "/ytstats <channel>",
    examples: [
        "/ytstats @Markiplier",
        "/ytstats https://youtube.com/@PewDiePie",
        "/ytstats https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        "/ytstats UC_x5XG1OV2P6uZZ5FSM9Ttw",
    ],

    data: new SlashCommandBuilder()
        .setName("ytstats")
        .setDescription("Get YouTube channel statistics")
        .addStringOption((option) =>
            option
                .setName("channel")
                .setDescription("Channel URL, ID, handle (@username), or video URL")
                .setRequired(true)
                .setMinLength(2)
                .setMaxLength(200),
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const channelInput = interaction.options.getString("channel");
            const apiKey = process.env.YOUTUBE_API_KEY;

            // Validate API key
            if (!apiKey) {
                await handleError(
                    interaction,
                    new Error("API key missing"),
                    "CONFIGURATION",
                    "The YouTube API is not properly configured. Please contact the bot administrator.",
                );
                return;
            }

            try {
                const youtube = google.youtube({
                    version: "v3",
                    auth: apiKey,
                });

                // Extract channel ID with improved error handling
                const channelId = await extractChannelId(youtube, channelInput).catch((error) => {
                    if (error.code === 403) throw error;
                    return null;
                });

                if (!channelId) {
                    await handleError(
                        interaction,
                        new Error("Invalid channel"),
                        "VALIDATION",
                        "Could not find a valid YouTube channel. Please check your input and try again.",
                    );
                    return;
                }

                // Get channel data with additional fields
                const channelData = await getChannelData(youtube, channelId);
                if (!channelData) {
                    await handleError(
                        interaction,
                        new Error("Channel not found"),
                        "NOT_FOUND",
                        "The specified YouTube channel could not be found.",
                    );
                    return;
                }

                // Get latest videos and playlists data in parallel0.
                const [latestVideos, playlistsData] = await Promise.all([
                    getLatestVideos(youtube, channelId),
                    getPlaylistsCount(youtube, channelId)
                ]);

                // Create embed and buttons
                const embed = createChannelEmbed(
                    channelData,
                    latestVideos,
                    channelId,
                    playlistsData,
                );
                const components = createChannelButtons(channelData, latestVideos);

                await interaction.editReply({
                    embeds: [embed],
                    components: [components],
                });
            } catch (error) {
                if (error.code === 403) {
                    await handleError(
                        interaction,
                        error,
                        "API_ERROR",
                        "The YouTube API quota has been exceeded. Please try again tomorrow.",
                    );
                } else if (error.code === 404) {
                    await handleError(
                        interaction,
                        error,
                        "NOT_FOUND",
                        "The specified YouTube channel or video could not be found.",
                    );
                } else if (error.code === 400) {
                    await handleError(
                        interaction,
                        error,
                        "VALIDATION",
                        "Invalid input format. Please provide a valid YouTube channel URL, ID, or handle.",
                    );
                } else {
                    await handleError(
                        interaction,
                        error,
                        "API_ERROR",
                        "An error occurred while fetching YouTube data. Please try again later.",
                    );
                }
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while processing the YouTube statistics request.",
            );
        }
    },
};

// Helper function to extract channel ID from various inputs
async function extractChannelId(youtube, input) {
    // Direct channel ID
    if (/^UC[\w-]{21}[AQgw]$/.test(input)) {
        return input;
    }

    // Channel URL with direct ID
    const channelMatch = input.match(/(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel|c)\/(UC[\w-]{21}[AQgw])/);
    if (channelMatch) {
        return channelMatch[1];
    }

    // Video URL - extract channel from video
    const videoMatch = input.match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
    if (videoMatch) {
        const response = await youtube.videos.list({
            part: "snippet",
            id: videoMatch[1],
        });
        if (response.data.items.length > 0) {
            return response.data.items[0].snippet.channelId;
        }
    }

    // Handle, custom URL, or search term - use single search call
    const searchTerm = input.includes("@") ? input.replace("@", "") : input.replace(/.*\//, "");
    const response = await youtube.search.list({
        part: "snippet",
        q: searchTerm,
        type: "channel",
        maxResults: 1,
    });
    
    return response.data.items.length > 0 ? response.data.items[0].snippet.channelId : null;
}

// Helper function to get channel data
async function getChannelData(youtube, channelId) {
    const response = await youtube.channels.list({
        part: "snippet,statistics,brandingSettings,contentDetails,status,topicDetails",
        id: channelId,
    });

    if (response.data.items.length === 0) {
        return null;
    }

    return response.data.items[0];
}

// Helper function to get latest videos with enhanced details
async function getLatestVideos(youtube, channelId) {
    const response = await youtube.search.list({
        part: "id,snippet",
        channelId: channelId,
        type: "video",
        order: "date",
        maxResults: 5,
    });

    if (response.data.items.length === 0) {
        return [];
    }

    // Get detailed stats for each video
    const videoIds = response.data.items.map((item) => item.id.videoId);
    const statsResponse = await youtube.videos.list({
        part: "statistics,contentDetails,liveStreamingDetails",
        id: videoIds.join(","),
    });

    // Combine video data
    return response.data.items.map((item, index) => {
        const statsItem = statsResponse.data.items[index];
        if (!statsItem) return item;
        
        item.statistics = statsItem.statistics || {};
        item.contentDetails = statsItem.contentDetails || {};
        item.liveStreamingDetails = statsItem.liveStreamingDetails || {};
        return item;
    });
}

// Helper function to get playlists count
async function getPlaylistsCount(youtube, channelId) {
    try {
        const response = await youtube.playlists.list({
            part: "id",
            channelId: channelId,
            maxResults: 0,
        });
        return {
            totalCount: response.data.pageInfo.totalResults,
            error: null,
        };
    } catch (error) {
        return {
            totalCount: 0,
            error: error.message,
        };
    }
}

// Helper function to format numbers
function formatNumber(num) {
    if (!num) return "0";
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + "B";
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}

// Helper function to format duration
function formatDuration(duration) {
    if (!duration) return "0:00";
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "0:00";

    const hours = parseInt(match[1] || "0", 10);
    const minutes = parseInt(match[2] || "0", 10);
    const seconds = parseInt(match[3] || "0", 10);

    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    } else {
        return `${minutes}:${seconds.toString().padStart(2, "0")}`;
    }
}

// Helper function to create channel buttons
function createChannelButtons(channelData, latestVideos) {
    const buttons = [];

    // Channel URL button
    buttons.push(
        new ButtonBuilder()
            .setLabel("Channel")
            .setStyle(ButtonStyle.Link)
            .setURL(`https://youtube.com/channel/${channelData.id}`)
    );

    // Latest video button (if available)
    if (latestVideos.length > 0) {
        buttons.push(
            new ButtonBuilder()
                .setLabel("Latest Video")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://youtube.com/watch?v=${latestVideos[0].id.videoId}`)
        );
    }

    // Custom URL button (if available)
    if (channelData.snippet.customUrl) {
        buttons.push(
            new ButtonBuilder()
                .setLabel("Custom URL")
                .setStyle(ButtonStyle.Link)
                .setURL(`https://youtube.com/${channelData.snippet.customUrl}`)
        );
    }

    const row = new ActionRowBuilder().addComponents(...buttons);
    return row;
}

// Helper functions for embed field creation
function createStatisticsField(statistics, playlistsData) {
    const fields = [
        `**Subscribers:** ${statistics.hiddenSubscriberCount ? "🔒 Hidden" : formatNumber(statistics.subscriberCount)}`,
        `**Total Views:** ${formatNumber(statistics.viewCount)}`,
        `**Total Videos:** ${formatNumber(statistics.videoCount)}`,
    ];
    
    if (playlistsData.totalCount) {
        fields.push(`**Playlists:** ${formatNumber(playlistsData.totalCount)}`);
    }
    
    return {
        name: "📊 Statistics",
        value: fields.join("\n"),
        inline: true,
    };
}

function createChannelInfoField(snippet, status) {
    const fields = [
        `**Created:** <t:${Math.floor(new Date(snippet.publishedAt).getTime() / 1000)}:R>`,
        `**Country:** ${snippet.country || "Not specified"}`,
        `**Language:** ${snippet.defaultLanguage || "Not specified"}`,
    ];
    
    if (status.privacyStatus) fields.push(`**Privacy:** ${status.privacyStatus}`);
    if (status.madeForKids) fields.push("**Made for Kids:** Yes");
    
    return {
        name: "📅 Channel Info",
        value: fields.join("\n"),
        inline: true,
    };
}

// Helper function to create channel embed
function createChannelEmbed(channelData, latestVideos, channelId, playlistsData) {
    const { snippet, statistics, brandingSettings, status, topicDetails } =
        channelData;

    const embed = new EmbedBuilder()
        .setTitle(snippet.title)
        .setDescription(
            snippet.description 
                ? snippet.description.slice(0, 250) + (snippet.description.length > 250 ? "..." : "")
                : "No description available"
        )
        .setThumbnail(snippet.thumbnails.high?.url || snippet.thumbnails.default?.url)
        .setColor("#FF0000")
        .addFields(
            createStatisticsField(statistics, playlistsData),
            createChannelInfoField(snippet, status)
        );

    // Add topics if available (only process up to 5 to avoid unnecessary work)
    if (topicDetails?.topicCategories?.length > 0) {
        const maxTopics = 5;
        const total = Math.min(topicDetails.topicCategories.length, maxTopics);
        let topicsStr = "";
        for (let i = 0; i < total; i++) {
            const url = topicDetails.topicCategories[i];
            const topic = url.split("/").pop().replace(/_/g, " ");
            topicsStr += (i === 0 ? "" : "\n") + topic;
        }
        embed.addFields({
            name: "🏷️ Topics",
            value: topicsStr,
            inline: false,
        });
    }

    // Add latest videos
    if (latestVideos.length > 0) {
        const videoLines = [];
        for (let i = 0; i < latestVideos.length; i++) {
            const video = latestVideos[i];

            const {
                snippet: vSnippet = {},
                id: vId = {},
                statistics: vStats = {},
                contentDetails: vContent = {},
                liveStreamingDetails: vLive = {},
            } = video;

            const isLive = !vLive?.actualEndTime && Boolean(vLive?.scheduledStartTime);
            const duration = isLive ? "🔴 LIVE" : formatDuration(vContent.duration);
            const views = formatNumber(Number(vStats.viewCount || 0));
            const timestamp = isLive
                ? (vLive.actualStartTime || vLive.scheduledStartTime)
                : vSnippet.publishedAt;
            const tsSeconds = Math.floor(new Date(timestamp || Date.now()).getTime() / 1000);

            const title = (vSnippet.title || "Untitled").replace(/\n/g, " ");
            const videoId = vId.videoId || vId;

            videoLines.push(
                `[${title}](https://youtube.com/watch?v=${videoId})\n┗ ${duration} • ${views} views • <t:${tsSeconds}:R>`
            );
        }

        embed.addFields({
            name: "📺 Latest Videos",
            value: videoLines.join("\n\n"),
            inline: false,
        });
    }

    // Add featured channels if available
    if (brandingSettings.channel?.featuredChannelsUrls?.length > 0) {
        embed.addFields({
            name: "🤝 Featured Channels",
            value: `This channel features ${brandingSettings.channel.featuredChannelsUrls.length} other channels`,
            inline: false,
        });
    }

    embed
        .setFooter({
            text: `Channel ID: ${channelId}`,
            iconURL: "https://www.youtube.com/s/desktop/28b67e7f/img/favicon_144x144.png",
        })
        .setTimestamp();

    return embed;
}
