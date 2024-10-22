const { SlashCommandBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ask_gemini')
        .setDescription('Ask a single question to Gemini AI')
        .addStringOption((option) =>
            option
                .setName('question')
                .setDescription('The question you want to ask Gemini AI')
                .setRequired(true),
        ),

    async execute(interaction) {
        const question = interaction.options.getString('question');

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

            const result = await model.generateContent(question);
            const response = await result.response;
            const text = response.text();

            await interaction.editReply(text);
        } catch (error) {
            console.error('Error in ask-gemini command:', error);
            await interaction.editReply(
                'Sorry, there was an error processing your request.',
            );
        }
    },
};
