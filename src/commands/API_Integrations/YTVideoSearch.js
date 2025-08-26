const {  ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, MessageFlags, SlashCommandBuilder } = require("discord.js");

const { google } = require("googleapis");

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
});

const pageSize = 3; // Number of results per page

module.exports = {
    data: new SlashCommandBuilder()
        .setName("youtube_search")
        .setDescription("Search for YouTube videos")
        .addStringOption((option) =>
            option.setName("query").setDescription("The search query").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("channel").setDescription("Filter by channel name").setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("duration")
                .setDescription("Filter by video duration")
                .setRequired(false)
                .addChoices(
                    { name: "Any", value: "any" },
                    { name: "Short (< 4 minutes)", value: "short" },
                    { name: "Medium (4-20 minutes)", value: "medium" },
                    { name: "Long (> 20 minutes)", value: "long" },
                ),
        )
        .addStringOption((option) =>
            option
                .setName("order")
                .setDescription("Order of search results")
                .setRequired(false)
                .addChoices(
                    { name: "Relevance", value: "relevance" },
                    { name: "Date", value: "date" },
                    { name: "View Count", value: "viewCount" },
                    { name: "Rating", value: "rating" },
                ),
        )
        .addIntegerOption((option) =>
            option
                .setName("max_results")
                .setDescription("Maximum number of results per page (1-10)")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(10),
        ),
    description_full:
        "Search for YouTube videos with optional filters for channel, duration, order, type, and max results. Results are displayed in an embedded message with pagination.",
    usage: "/youtube_search <query> [channel] [duration] [order] [type] [max_results]",
    examples: [
        "/youtube_search query:cats",
        "/youtube_search query:\"funny videos\" channel:PewDiePie",
        "/youtube_search query:tutorials duration:long order:viewCount type:episode max_results:10",
    ],

    async execute(interaction) {
        // Check if API key is configured
        if (!process.env.YOUTUBE_API_KEY) {
            await interaction.reply({
                content:
                    "YouTube search service is not properly configured. Please contact an administrator.",
                ephemeral: true,
            });
            return;
        }

        const query = interaction.options.getString("query");
        const channelFilter = interaction.options.getString("channel");
        const durationFilter = interaction.options.getString("duration") || "any";
        const orderFilter = interaction.options.getString("order") || "relevance";
        const maxResults = interaction.options.getInteger("max_results") || pageSize;
        let currentPage = 1;
        let nextPageToken = "";
        let prevPageToken = "";

        // Function to convert ISO 8601 duration to human-readable format
        function formatDuration(duration) {
            const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
            if (!match) {
                return "N/A";
            }

            const timeUnits = [
                { unit: "hour", value: match[1] },
                { unit: "minute", value: match[2] },
                { unit: "second", value: match[3] },
            ];

            const formattedDuration = timeUnits
                .filter((timeUnit) => timeUnit.value)
                .map((timeUnit) => {
                    const value = parseInt(timeUnit.value);
                    return `${value} ${timeUnit.unit}${value > 1 ? "s" : ""}`;
                })
                .join(" ");

            return formattedDuration.trim();
        }

        // Function to fetch and display results
        const displayResults = async () => {
            try {
                const searchParams = await buildSearchParams();
                const searchResponse = await youtube.search.list(searchParams);
                const videoDetails = await fetchVideoDetails(searchResponse);
                const results = searchResponse.data;

                nextPageToken = results.nextPageToken || "";
                prevPageToken = currentPage > 1 ? results.prevPageToken || "" : "";

                // Handle case when there are no results
                if (results.items.length === 0) {
                    return {
                        content: `No results found for "${query}".`,
                        embeds: [],
                    };
                }

                const embed = buildEmbed(results, videoDetails);
                const row = buildActionRow();

                return {
                    embeds: [embed],
                    components: row ? [row] : [],
                };
            } catch (error) {
                console.error("Error fetching YouTube results:", error);

                let errorMessage = "An error occurred while searching YouTube.";

                if (error.code === 403) {
                    errorMessage = "YouTube API quota exceeded. Please try again tomorrow.";
                } else if (error.code === 400) {
                    errorMessage = "Invalid search parameters. Please check your input.";
                } else if (error.code === 404) {
                    errorMessage = "No results found for your search.";
                }

                return {
                    content: errorMessage,
                    embeds: [],
                    components: [],
                };
            }
        };

        // Function to build search parameters
        const buildSearchParams = async () => {
            const searchParams = {
                part: "snippet",
                q: query,
                type: "video",
                maxResults: maxResults,
                pageToken: nextPageToken || prevPageToken || "",
                order: orderFilter,
            };

            if (channelFilter) {
                searchParams.channelId = await getChannelId(channelFilter);
            }

            if (durationFilter !== "any") {
                searchParams.videoDuration = durationFilter;
            }

            return searchParams;
        };

        // Function to fetch video details
        const fetchVideoDetails = async (searchResponse) => {
            const videoIds = searchResponse.data.items.map((item) => item.id.videoId).join(",");

            const videoResponse = await youtube.videos.list({
                part: "contentDetails,statistics",
                id: videoIds,
            });

            return videoResponse.data.items.reduce((acc, item) => {
                acc[item.id] = {
                    contentDetails: item.contentDetails,
                    statistics: item.statistics,
                };
                return acc;
            }, {});
        };

        // Function to build embed message
        const buildEmbed = (results, videoDetails) => {
            const embed = new EmbedBuilder()
                .setColor("#FF0000")
                .setTitle(`YouTube Search Results for "${query}"`)
                .setDescription(`Page ${currentPage}`);

            results.items.forEach((item, index) => {
                const details = videoDetails[item.id.videoId];
                const duration = details ? formatDuration(details.contentDetails.duration) : "N/A";
                const views = details
                    ? parseInt(details.statistics.viewCount).toLocaleString()
                    : "N/A";
                const likes = details
                    ? parseInt(details.statistics.likeCount).toLocaleString()
                    : "N/A";

                // Combine information into a single field
                const videoInfo =
                    `**Channel:** ${item.snippet.channelTitle}\n` +
                    `**Published:** ${new Date(item.snippet.publishedAt).toLocaleDateString()}\n` +
                    `**Duration:** ${duration}\n` +
                    `**Views:** ${views}\n` +
                    `**Likes:** ${likes}`;

                embed.addFields({
                    name: `${(currentPage - 1) * maxResults + index + 1}. ${item.snippet.title}`,
                    value: `[Watch Video](https://www.youtube.com/watch?v=${item.id.videoId})\n\n${videoInfo}`,
                });
            });

            return embed;
        };

        // Function to build action row with buttons
        const buildActionRow = () => {
            const buttons = [];
            if (prevPageToken) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId("prev")
                        .setLabel("Previous")
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(currentPage === 1), // Disable 'Previous' on first page
                );
            }
            if (nextPageToken) {
                buttons.push(
                    new ButtonBuilder()
                        .setCustomId("next")
                        .setLabel("Next")
                        .setStyle(ButtonStyle.Primary),
                );
            }

            return buttons.length > 0 ? new ActionRowBuilder().addComponents(buttons) : null;
        };
        // Function to get channel ID from channel name
        const getChannelId = async (channelName) => {
            try {
                const response = await youtube.search.list({
                    part: "snippet",
                    type: "channel",
                    q: channelName,
                    maxResults: 1,
                });

                if (response.data.items.length > 0) {
                    return response.data.items[0].id.channelId;
                }
                return null;
            } catch (error) {
                console.error("Error fetching channel ID:", error);
                return null;
            }
        };

        // Send initial message with the first page of results
        const message = await interaction.reply(await displayResults());

        // Create button collector for pagination
        const collector = message.createMessageComponentCollector({
            time: 60000, // Collector lasts for 60 seconds
        });

        collector.on("collect", async (i) => {
            // Ensure the user interacting with the buttons is the original one
            if (i.user.id !== interaction.user.id) {
                return i.reply({
                    content: "You are not allowed to interact with these buttons.",
                    flags: MessageFlags.Ephemeral,
                });
            }

            // Update the page and refresh the results
            if (i.customId === "prev") {
                currentPage--;
            } else if (i.customId === "next") {
                currentPage++;
            }

            // Update the message with the new page of results
            await i.update(await displayResults());
        });

        collector.on("end", () => {
            message.edit({ components: [] }).catch(console.error); // Remove buttons after the collector ends
        });
    },
};
