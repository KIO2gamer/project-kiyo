const { SlashCommandBuilder } = require('discord.js');
const { handleError } = require('../../bot_utils/errorHandler');
const AIChatChannel = require('../../bot_utils/AIChatChannel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_ai_chat_channel')
        .setDescription('Set the channel for AI chat interactions')
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('The channel to set for AI chat')
                .setRequired(true),
        ),

    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        try {
            await AIChatChannel.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { channelId: channel.id },
                { upsert: true, new: true },
            );
            await interaction.editReply(
                `AI chat channel has been set to ${channel}`,
            );
        } catch (error) {
            await handleError(interaction, error);
        }
    },
};
