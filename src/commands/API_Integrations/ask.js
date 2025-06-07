const { SlashCommandBuilder } = require("discord.js");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { handleError } = require("../../utils/errorHandler");

const { MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("ask_gemini")
        .setDescription("Ask a single question to Gemini AI")
        .addStringOption((option) =>
            option
                .setName("question")
                .setDescription("The question you want to ask Gemini AI")
                .setRequired(true),
        ),

    description_full:
        "Ask any question to Google's Gemini AI model and get an intelligent response. This command allows you to interact with the AI for general knowledge queries, explanations, or assistance with various topics.",
    
    usage: "/ask_gemini <question>",
    examples: [
        "/ask_gemini What is quantum computing?",
        "/ask_gemini How do I make chocolate chip cookies?",
        "/ask_gemini Explain the theory of relativity",
        "/ask_gemini Write a poem about spring",
    ],

    async execute(interaction) {
        const question = interaction.options.getString("question");

        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({
                model: "gemini-2.0-flash",
                systemInstruction:
                    "You are a helpful assistant and your answers are concise and to the point.",
            });

            const result = await model.generateContent(question);
            const response = result.response;
            const text = response.text();

            // Handle long responses by chunking if necessary
            if (text.length > 2000) {
                await interaction.reply(text.substring(0, 2000));
                // Send remaining text in follow-up messages
                let remaining = text.substring(2000);
                while (remaining.length > 0) {
                    const chunk = remaining.substring(0, 2000);
                    await interaction.followUp(chunk);
                    remaining = remaining.substring(2000);
                }
            } else {
                await interaction.reply(text);
            }
        } catch (error) {
            console.error("Error in ask-gemini command:", error);
            
            let errorMessage = "Sorry, there was an error processing your request.";
            
            // Handle specific error types
            if (error.message?.includes("API key")) {
                errorMessage = "AI service is not properly configured. Please contact an administrator.";
            } else if (error.message?.includes("blocked") || error.message?.includes("safety")) {
                errorMessage = "I can't respond to that due to content safety policies. Please try a different question.";
            } else if (error.message?.includes("quota") || error.message?.includes("limit")) {
                errorMessage = "AI service is temporarily unavailable due to usage limits. Please try again later.";
            }
            
            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    },
};
