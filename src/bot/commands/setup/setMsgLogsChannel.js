const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    ChannelType,
} = require('discord.js');
const MsgLogsConfig = require("./../../../database/msgLogsConfig");

module.exports = {
    description_full:
        'Sets the channel where message logs will be sent. Requires the "Administrator" permission.',
    usage: '/set_msg_logs_channel <channel:channel>',
    examples: ['/set_msg_logs_channel channel:#message-logs'],
    category: 'setup',
    data: new SlashCommandBuilder()
        .setName('set_msg_logs_channel')
        .setDescription(
            'Sets the channel where message logs would be sent into.'
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((option) =>
            option
                .setName('channel')
                .setDescription('The channel to show message logs to.')
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText)
        ),
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');

        try {
            // Find and update the document, or create a new one if it doesn't exist
            await MsgLogsConfig.findOneAndUpdate(
                { guildId: interaction.guild.id },
                { channelId: channel.id },
                { upsert: true, new: true }
            );

            await interaction.editReply(
                `Message logs channel set to: ${channel}`
            );
        } catch (error) {
            console.error('Error setting message logs channel:', error);
            await interaction.editReply({
                content:
                    'An error occurred while setting the message logs channel.',
                ephemeral: true,
            });
        }
    },
};
