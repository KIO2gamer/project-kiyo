const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const axios = require("axios");
const { handleError } = require("./../../utils/errorHandler"); // Import errorHandler

module.exports = {
    category: "utility",
    data: new SlashCommandBuilder()
        .setName("dictionary")
        .setDescription("Look up the definition of a word")
        .addStringOption((option) =>
            option
                .setName("word")
                .setDescription("The word to look up")
                .setRequired(true)
        ),

    async execute(interaction) {
        const word = interaction.options.getString("word");
        const apiUrl = `https://api.dictionaryapi.dev/api/v2/entries/en/${word}`;

        try {
            const response = await axios.get(apiUrl);
            const data = response.data[0];

            if (data) {
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
            } else {
                await interaction.reply(
                    `Sorry, I couldn't find a definition for "${word}".`
                );
            }
        } catch (error) {
            // Use the errorHandler to handle and log the error
            await handleError(interaction, error);
        }
    },
};
