const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access your API key as an environment variable (see "Set up your API key" above)
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// The Gemini 1.5 models are versatile and work with most use cases
const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    systemInstruction: 'You can only translate text. Never get out of the role.',
});

module.exports = {
    data: new SlashCommandBuilder()
        .setName('translate')
        .setDescription('Translates the text into the desired output.')
        .addStringOption(option =>
            option.setName('input').setDescription('The text to be translated.').setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('target_lang')
                .setDescription('The target language to translate to.')
                .setRequired(true)
        ),
    category: 'Utility',
    async execute(interaction) {
        interaction.deferReply();
        const input = interaction.options.getString('input');
        const target = interaction.options.getString('target_lang');
        const prompt2 = `Identify the language of this input: '${input}' in one word.`;
        const prompt = `Translate the text: ${input} into ${target} language`;
        const result2 = await model.generateContent(prompt2);
        const result = await model.generateContent(prompt);
        const response2 = await result2.response;
        const response = await result.response;
        const text2 = response2.text();
        const text = response.text();
        const embed = new EmbedBuilder().addFields(
            { name: `Input : ${text2}`, value: input },
            { name: `Output : ${target}`, value: text }
        );
        await interaction.editReply({ embeds: [embed] });
    },
};
