const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const axios = require("axios");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("dictionary")
        .setDescription("Look up the definition of a word")
        .addStringOption((option) =>
            option.setName("word").setDescription("The word to look up").setRequired(true),
        ),

    async execute(interaction) {
        const word = interaction.options.getString("word");
        const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data[0];

            if (!data) {
                // Use handleError for validation errors
                await handleError(
                    interaction,
                    new Error(`No definition found for "${word}"`),
                    "VALIDATION",
                );
                return;
            }

            const definition = data.meanings[0].definitions[0].definition;
            const partOfSpeech = data.meanings[0].partOfSpeech;

            const embed = new EmbedBuilder()
                .setTitle(word)
                .setDescription(definition)
                .addFields({
                    name: "Part of Speech",
                    value: partOfSpeech,
                })
                .setFooter({
                    text: "Powered by DictionaryAPI",
                    iconURL: "https://i.imgur.com/AfFp7pu.png",
                })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            // Handle different types of errors appropriately
            if (error.response) {
                if (error.response.status === 404) {
                    await handleError(
                        interaction,
                        new Error(`Could not find definition for "${word}"`),
                        "VALIDATION",
                    );
                } else {
                    await handleError(
                        interaction,
                        error,
                        "API",
                        `Error accessing dictionary API: ${error.response.status}`,
                    );
                }
            } else if (error.request) {
                await handleError(interaction, error, "API", "Dictionary API is not responding");
            } else {
                await handleError(interaction, error);
            }
        }
    },
};
