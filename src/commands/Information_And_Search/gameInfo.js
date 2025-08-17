const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
} = require("discord.js");
const axios = require("axios");
const { handleError } = require("../../utils/errorHandler");
require("dotenv").config();

const { MessageFlags } = require("discord.js");

module.exports = {
    description_full:
        "Get detailed information about video games, including release date, ratings, platforms, genres, and more. Uses the IGDB database.",
    usage: "/game_info <title>",
    examples: [
        "/game_info \"The Legend of Zelda\"",
        "/game_info \"Red Dead Redemption 2\"",
        "/game_info \"Minecraft\"",
    ],

    data: new SlashCommandBuilder()
        .setName("game_info")
        .setDescription("Get detailed information about a video game")
        .addStringOption((option) =>
            option
                .setName("title")
                .setDescription("The title of the game to search for")
                .setRequired(true)
                .setMinLength(2)
                .setMaxLength(100),
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const gameTitle = interaction.options.getString("title");
            const clientId = process.env.IGDB_CLIENT_ID;
            const clientSecret = process.env.IGDB_CLIENT_SECRET;

            // Validate API credentials
            if (!clientId || !clientSecret) {
                await handleError(
                    interaction,
                    new Error("API configuration missing"),
                    "CONFIGURATION",
                    "The IGDB API is not properly configured. Please contact the bot administrator.",
                );
                return;
            }

            try {
                const accessToken = await getAccessToken(clientId, clientSecret);

                // Comprehensive game query
                const query = `
					search "${gameTitle}";
					fields name, summary, first_release_date, rating, rating_count,
						platforms.name, genres.name, cover.url, websites.*, 
						involved_companies.company.name, involved_companies.developer,
						involved_companies.publisher, aggregated_rating,
						aggregated_rating_count, total_rating, total_rating_count,
						game_modes.name, themes.name, status;
					limit 5;
				`;

                const response = await axios({
                    url: "https://api.igdb.com/v4/games",
                    method: "POST",
                    headers: {
                        "Client-ID": clientId,
                        Authorization: `Bearer ${accessToken}`,
                        Accept: "application/json",
                        "Content-Type": "text/plain",
                    },
                    data: query,
                });

                const games = response.data;

                if (!games || games.length === 0) {
                    await handleError(
                        interaction,
                        new Error("No games found"),
                        "NOT_FOUND",
                        `No games found matching "${gameTitle}". Try using a different search term.`,
                    );
                    return;
                }

                // Check for an exact match first
                const exactMatch = games.find(
                    (game) => game.name.toLowerCase() === gameTitle.toLowerCase(),
                );

                if (exactMatch) {
                    const embed = createGameEmbed(exactMatch);
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }

                // If only one game found, show it directly
                if (games.length === 1) {
                    const embed = createGameEmbed(games[0]);
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }

                // Multiple results: Create selection menu
                const options = games.map((game, index) => ({
                    label: game.name.substring(0, 100),
                    description: game.first_release_date
                        ? `Released: ${new Date(game.first_release_date * 1000).getFullYear()}`
                        : "Release date unknown",
                    value: String(index),
                    emoji: "🎮",
                }));

                const row = new ActionRowBuilder().addComponents(
                    new StringSelectMenuBuilder()
                        .setCustomId("select_game")
                        .setPlaceholder("Select a game")
                        .addOptions(options),
                );

                const listEmbed = new EmbedBuilder()
                    .setTitle("Multiple Games Found")
                    .setDescription(
                        `Found ${games.length} games matching "${gameTitle}"\nPlease select the correct game from the list below:`,
                    )
                    .setColor("Blue")
                    .setFooter({
                        text: "Selection will expire in 30 seconds",
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                    });

                const embed_response = await interaction.editReply({
                    embeds: [listEmbed],
                    components: [row],
                });

                // Create collector for selection
                const collector = embed_response.createMessageComponentCollector({
                    filter: (i) =>
                        i.customId === "select_game" && i.user.id === interaction.user.id,
                    time: 30000,
                    max: 1,
                });

                collector.on("collect", async (i) => {
                    await i.deferUpdate();
                    const selectedGame = games[parseInt(i.values[0])];
                    const embed = createGameEmbed(selectedGame);
                    await interaction.editReply({
                        embeds: [embed],
                        components: [],
                    });
                });

                collector.on("end", async (collected) => {
                    if (collected.size === 0) {
                        const timeoutEmbed = new EmbedBuilder()
                            .setTitle("Selection Timed Out")
                            .setDescription(
                                "No selection was made within 30 seconds. Please try the command again.",
                            )
                            .setColor("Red");

                        await interaction.editReply({
                            embeds: [timeoutEmbed],
                            components: [],
                        });
                    }
                });
            } catch (error) {
                if (error.response?.status === 429) {
                    await handleError(
                        interaction,
                        error,
                        "RATE_LIMIT",
                        "The API rate limit has been reached. Please try again in a few minutes.",
                    );
                } else {
                    await handleError(
                        interaction,
                        error,
                        "API_ERROR",
                        "Failed to fetch game data from IGDB. Please try again later.",
                    );
                }
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while processing the game information request.",
            );
        }
    },
};

// Helper function to get access token
async function getAccessToken(clientId, clientSecret) {
    try {
        const params = new URLSearchParams();
        params.append("client_id", clientId);
        params.append("client_secret", clientSecret);
        params.append("grant_type", "client_credentials");

        const response = await axios.post("https://id.twitch.tv/oauth2/token", params);
        return response.data.access_token;
    } catch (error) {
        throw new Error("Failed to obtain API access token: " + error.message);
    }
}

// Helper function to create game embed
function createGameEmbed(gameData) {
    const embed = new EmbedBuilder().setColor("Blue").setTitle(gameData.name);

    // Set thumbnail if cover exists
    if (gameData.cover?.url) {
        embed.setThumbnail(`https:${gameData.cover.url.replace("t_thumb", "t_cover_big")}`);
    }

    // Add description/summary
    if (gameData.summary) {
        embed.setDescription(
            gameData.summary.length > 2048
                ? gameData.summary.substring(0, 2045) + "..."
                : gameData.summary,
        );
    }

    // Basic information field
    const basicInfo = [
        gameData.first_release_date
            ? `**Released:** <t:${gameData.first_release_date}:D>`
            : "**Released:** Unknown",
        gameData.status ? `**Status:** ${formatGameStatus(gameData.status)}` : null,
        gameData.platforms?.length
            ? `**Platforms:** ${gameData.platforms.map((p) => p.name).join(", ")}`
            : null,
        gameData.genres?.length
            ? `**Genres:** ${gameData.genres.map((g) => g.name).join(", ")}`
            : null,
        gameData.themes?.length
            ? `**Themes:** ${gameData.themes.map((t) => t.name).join(", ")}`
            : null,
        gameData.game_modes?.length
            ? `**Game Modes:** ${gameData.game_modes.map((m) => m.name).join(", ")}`
            : null,
    ]
        .filter(Boolean)
        .join("\n");

    embed.addFields({ name: "📋 Game Information", value: basicInfo, inline: false });

    // Ratings field
    if (gameData.rating || gameData.aggregated_rating || gameData.total_rating) {
        const ratings = [
            gameData.rating
                ? `**User Rating:** ${(gameData.rating / 10).toFixed(1)}/10 (${gameData.rating_count} ratings)`
                : null,
            gameData.aggregated_rating
                ? `**Critic Rating:** ${(gameData.aggregated_rating / 10).toFixed(1)}/10 (${gameData.aggregated_rating_count} reviews)`
                : null,
            gameData.total_rating
                ? `**Overall Rating:** ${(gameData.total_rating / 10).toFixed(1)}/10 (${gameData.total_rating_count} total)`
                : null,
        ]
            .filter(Boolean)
            .join("\n");

        if (ratings) {
            embed.addFields({ name: "⭐ Ratings", value: ratings, inline: false });
        }
    }

    // Companies field
    if (gameData.involved_companies?.length) {
        const developers = gameData.involved_companies
            .filter((ic) => ic.developer)
            .map((ic) => ic.company.name);
        const publishers = gameData.involved_companies
            .filter((ic) => ic.publisher)
            .map((ic) => ic.company.name);

        const companies = [
            developers.length ? `**Developers:** ${developers.join(", ")}` : null,
            publishers.length ? `**Publishers:** ${publishers.join(", ")}` : null,
        ]
            .filter(Boolean)
            .join("\n");

        if (companies) {
            embed.addFields({ name: "🏢 Companies", value: companies, inline: false });
        }
    }

    // Links field
    if (gameData.websites?.length) {
        const links = gameData.websites
            .map((site) => {
                const type = formatWebsiteType(site.category);
                return `[${type}](${site.url})`;
            })
            .join(" • ");

        embed.addFields({ name: "🔗 Links", value: links, inline: false });
    }

    embed
        .setFooter({
            text: "Data provided by IGDB",
            iconURL: "https://www.igdb.com/favicon.ico",
        })
        .setTimestamp();

    return embed;
}

// Helper function to format website types
function formatWebsiteType(category) {
    const types = {
        1: "Official",
        2: "Wikia",
        3: "Wikipedia",
        4: "Facebook",
        5: "Twitter",
        6: "Twitch",
        8: "Instagram",
        9: "YouTube",
        10: "App Store",
        11: "Google Play",
        12: "Steam",
        13: "Subreddit",
        14: "Epic Games",
        15: "GOG",
        16: "Discord",
    };
    return types[category] || "Website";
}

// Helper function to format game status
function formatGameStatus(status) {
    const statuses = {
        0: "Released",
        2: "Alpha",
        3: "Beta",
        4: "Early Access",
        5: "Offline",
        6: "Cancelled",
        7: "Rumored",
        8: "Delisted",
    };
    return statuses[status] || "Unknown";
}
