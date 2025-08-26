const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");


module.exports = {
    description_full:
        "Searches for and displays photos from Pexels based on your query. You can customize the number of photos, orientation, size, and even request a random photo.",
    usage: "/photo <query:search_term> [count:1-5] [orientation:landscape/portrait/square] [size:small/medium/large] [random:true/false]",
    examples: [
        "/photo query:cats count:3",
        "/photo query:mountains orientation:landscape",
        "/photo query:flowers random:true",
    ],

    data: new SlashCommandBuilder()
        .setName("photo")
        .setDescription("Search for a photo.")
        .addStringOption((option) =>
            option.setName("query").setDescription("The search query").setRequired(true),
        )
        .addIntegerOption((option) =>
            option
                .setName("count")
                .setDescription("Number of photos to fetch (1-5)")
                .setMinValue(1)
                .setMaxValue(5),
        )
        .addStringOption((option) =>
            option
                .setName("orientation")
                .setDescription("Photo orientation")
                .addChoices(
                    { name: "Landscape", value: "landscape" },
                    { name: "Portrait", value: "portrait" },
                    { name: "Square", value: "square" },
                ),
        )
        .addStringOption((option) =>
            option
                .setName("size")
                .setDescription("Photo size")
                .addChoices(
                    { name: "Small", value: "small" },
                    { name: "Medium", value: "medium" },
                    { name: "Large", value: "large" },
                ),
        )
        .addBooleanOption((option) =>
            option.setName("random").setDescription("Fetch a random photo"),
        ),

    async execute(interaction) {
        const query = interaction.options.getString("query");
        const count = interaction.options.getInteger("count") || 1;
        const orientation = interaction.options.getString("orientation");
        const size = interaction.options.getString("size");

        const apiKey = process.env.PEXELS_API_KEY;
        const baseUrl = "https://api.pexels.com/v1/search";
        const params = new URLSearchParams({
            query: query,
            per_page: count.toString(),
        });

        if (orientation) {
            params.append("orientation", orientation);
        }

        if (size) {
            params.append("size", size);
        }

        const url = `${baseUrl}?${params.toString()}`;

        // Check if API key is configured
        if (!apiKey) {
            await interaction.reply({
                content:
                    "Photo search service is not properly configured. Please contact an administrator.",
                ephemeral: true,
            });
            return;
        }

        try {
            const response = await fetch(url, {
                headers: {
                    Authorization: apiKey,
                },
            });
            const data = await response.json();

            if (data.photos && data.photos.length > 0) {
                const embeds = data.photos.map((photo) => {
                    return new EmbedBuilder()
                        .setTitle(`Photo by ${photo.photographer}`)
                        .setImage(photo.src.original)
                        .setURL(photo.url);
                });

                await interaction.reply({ embeds });
            } else {
                await interaction.reply("Sorry, I could not find any photos for that query.");
            }
        } catch (error) {
            console.error("Error fetching photo:", error);

            let errorMessage = "There was an error trying to fetch the photo.";

            if (error.message?.includes("401") || error.message?.includes("Unauthorized")) {
                errorMessage =
                    "Photo service authentication failed. Please contact an administrator.";
            } else if (error.message?.includes("429") || error.message?.includes("rate limit")) {
                errorMessage = "Photo service rate limit reached. Please try again later.";
            } else if (error.message?.includes("network") || error.message?.includes("ENOTFOUND")) {
                errorMessage = "Could not connect to photo service. Please try again later.";
            }

            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    },
};
