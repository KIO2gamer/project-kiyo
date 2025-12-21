const { SlashCommandBuilder } = require("discord.js");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    description_full:
        "Ends an active poll before its scheduled expiration time. Requires the message ID of the poll you want to end. Only the poll creator or users with Manage Messages permission can end polls.",
    usage: '/end_poll message_id:"message ID" channel:#channel',
    examples: ['/end_poll message_id:"123456789012345678" channel:#general'],

    data: new SlashCommandBuilder()
        .setName("end_poll")
        .setDescription("Ends a poll")
        .addStringOption((option) =>
            option.setName("message_id").setDescription("Message ID of the poll").setRequired(true),
        )
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("Channel where the poll is created")
                .setRequired(true),
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const messageId = interaction.options.getString("message_id");
            const channel = interaction.options.getChannel("channel");

            // Fetch the message with the poll
            const message = await channel.messages.fetch(messageId);

            // Validate poll exists
            if (!message?.poll) {
                return interaction.editReply({
                    content: "❌ Poll not found or the message does not contain a poll.",
                });
            }

            // Check if poll is already ended
            if (message.poll.resultsFinalized) {
                return interaction.editReply({
                    content: "❌ This poll has already ended.",
                });
            }

            // End the poll (await the Promise)
            await message.poll.end();

            // Get poll details for confirmation
            const question = message.poll.question.text;
            const totalVotes = message.poll.answers.reduce(
                (sum, answer) => sum + answer.voteCount,
                0,
            );
            const expiresAt = message.poll.expiresAt
                ? `<t:${Math.floor(message.poll.expiresAt.getTime() / 1000)}:R>`
                : "N/A";

            await interaction.editReply({
                content: `✅ **Poll Ended Successfully!**\n\n**Question:** ${question}\n**Total Votes:** ${totalVotes}\n**Was scheduled to end:** ${expiresAt}\n**Poll Message:** [Jump to Poll](${message.url})`,
            });
        } catch (error) {
            await handleError(
                interaction,
                error,
                "POLL_END",
                "Failed to end poll. Make sure the message ID and channel are correct.",
            );
        }
    },
};
