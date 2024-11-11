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
                .setRequired(true)
        ),

    description_full:
        "Ask any question to Google's Gemini AI model and get an intelligent response. This command allows you to interact with the AI for general knowledge queries, explanations, or assistance with various topics.",
    category: 'utility',
    usage: '/ask_gemini <question>',
    examples: [
        '/ask_gemini What is quantum computing?',
        '/ask_gemini How do I make chocolate chip cookies?',
        '/ask_gemini Explain the theory of relativity',
        '/ask_gemini Write a poem about spring',
    ],

    async execute(interaction) {
        const question = interaction.options.getString('question');

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction:
                    'You are a helpful assistant and your answers are concise and to the point.',
            });

            const result = await model.generateContent(question);
            const response = result.response;
            const text = response.text();

            await interaction.editReply(text);
        } catch (error) {
            console.error('Error in ask-gemini command:', error);
            await interaction.editReply(
                'Sorry, there was an error processing your request.'
            );
        }
    },
};
