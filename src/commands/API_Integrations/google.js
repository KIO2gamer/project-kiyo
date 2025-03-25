const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { handleError } = require("../../utils/errorHandler");
const axios = require("axios");

// Constants for styling
const GOOGLE_COLORS = {
    blue: "#4285F4",
    red: "#EA4335",
    yellow: "#FBBC05",
    green: "#34A853",
};
const MAX_RESULTS = 3; // Reduced for cleaner output

module.exports = {
    description_full: "Searches Google and shows the top results in a clean format",
    usage: "/google <query>",
    examples: ["/google discord.js guide", "/google how to make pasta"],

    data: new SlashCommandBuilder()
        .setName("google")
        .setDescription("Search Google for information")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("What do you want to search for?")
                .setRequired(true),
        )
        .addBooleanOption((option) =>
            option
                .setName("private")
                .setDescription("Keep results visible only to you (default: true)")
                .setRequired(false),
        ),

    async execute(interaction) {
        const query = interaction.options.getString("query");
        const isPrivate = interaction.options.getBoolean("private") ?? true;

        await interaction.deferReply({ ephemeral: isPrivate });

        // Check API configuration
        const apiKey = process.env.GOOGLE_API_KEY;
        const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

        if (!apiKey || !searchEngineId) {
            return await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setColor(GOOGLE_COLORS.red)
                        .setTitle("⚙️ Google Search Not Configured")
                        .setDescription(
                            "This command needs to be set up by the server admin first.",
                        ),
                ],
            });
        }

        try {
            // Perform search
            const response = await axios.get("https://www.googleapis.com/customsearch/v1", {
                params: {
                    key: apiKey,
                    cx: searchEngineId,
                    q: query,
                    num: MAX_RESULTS + 2, // Request extra results in case some are filtered
                },
            });

            const results = response.data.items || [];

            // Handle no results
            if (results.length === 0) {
                return await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(GOOGLE_COLORS.blue)
                            .setTitle(`🔍 No results found`)
                            .setDescription(
                                `Nothing found for: "${query}"\nTry different keywords or check your spelling.`,
                            )
                            .setThumbnail(
                                "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
                            ),
                    ],
                });
            }

            // Create the search results embed
            const embed = new EmbedBuilder()
                .setColor(GOOGLE_COLORS.blue)
                .setTitle(`🔍 Google Search Results`)
                .setDescription(`Search query: **${query}**`)
                .setThumbnail(
                    "https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png",
                )
                .setURL(`https://www.google.com/search?q=${encodeURIComponent(query)}`)
                .setFooter({
                    text: `Click the title to see all results • Powered by Google`,
                    iconURL: "https://www.google.com/favicon.ico",
                })
                .setTimestamp();

            // Add top results as fields (cleaner than description)
            results.slice(0, MAX_RESULTS).forEach((item, index) => {
                // Clean up snippets, removing HTML and excess whitespace
                let snippet = item.snippet || "No description available";
                snippet = snippet.replace(/(\r\n|\n|\r)/gm, " ").trim();

                // Truncate snippet if needed
                if (snippet.length > 120) {
                    snippet = snippet.substring(0, 120) + "...";
                }

                // Add result as a field
                embed.addFields({
                    name: `${index + 1}. ${item.title}`,
                    value: `${snippet}\n[View page](${item.link})`,
                });
            });

            // Add a view all results button link
            embed.addFields({
                name: `Want more results?`,
                value: `[View all results on Google](https://www.google.com/search?q=${encodeURIComponent(query)})`,
            });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error("Google search error:", error);

            // Create a simple, clean error message
            const errorEmbed = new EmbedBuilder()
                .setColor(GOOGLE_COLORS.red)
                .setTitle("⚠️ Search Failed")
                .setDescription("Something went wrong with your search request.")
                .addFields({
                    name: "What happened?",
                    value:
                        error.response?.data?.error?.message ||
                        "Could not connect to Google Search. Please try again later.",
                })
                .setFooter({ text: "This is most likely a temporary issue" });

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
