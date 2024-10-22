const { SlashCommandBuilder } = require('discord.js');
const ChatHistory = require('../../bot_utils/ChatHistory');
const { handleError } = require('../../bot_utils/errorHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear_history')
        .setDescription('Clears your AI chat history'),

    async execute(interaction) {
        try {
            // Delete the user's chat history
            await ChatHistory.findOneAndDelete({ userId: interaction.user.id });

            await interaction.editReply(
                'Your AI chat history has been cleared.',
            );
        } catch (error) {
            await handleError(interaction, error);
        }
    },
};
