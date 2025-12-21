const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    description_full:
        "Fetches and displays the current results of an active or ended poll. Shows vote counts, percentages, and voter distribution across all poll answers. Useful for checking poll progress or final results.",
    usage: '/fetch_poll_answers message_id:"message ID" channel:#channel',
    examples: ['/fetch_poll_answers message_id:"123456789012345678" channel:#polls'],

    data: new SlashCommandBuilder()
        .setName("fetch_poll_answers")
        .setDescription("Fetches the answers of the poll.")
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

            const poll = message.poll;

            // Calculate total votes using Collection reduce
            const totalVotes = poll.answers.reduce((sum, answer) => sum + answer.voteCount, 0);

            // Create embed for better formatting
            const embed = new EmbedBuilder()
                .setColor(poll.resultsFinalized ? 0x5865f2 : 0x57f287)
                .setTitle(`📊 ${poll.question.text}`)
                .setURL(message.url)
                .setFooter({
                    text: poll.resultsFinalized
                        ? "Poll has ended • Results are finalized"
                        : "Poll is active • Results may change",
                })
                .setTimestamp();

            // Add poll status field
            const statusLines = [];
            statusLines.push(`**Total Votes:** ${totalVotes}`);
            statusLines.push(
                `**Multi-Select:** ${poll.allowMultiselect ? "✅ Enabled" : "❌ Disabled"}`,
            );

            if (poll.expiresAt) {
                const expiresTimestamp = `<t:${Math.floor(poll.expiresAt.getTime() / 1000)}:R>`;
                statusLines.push(
                    `**${poll.resultsFinalized ? "Ended" : "Ends"}:** ${expiresTimestamp}`,
                );
            }

            embed.addFields({ name: "📈 Poll Information", value: statusLines.join("\n") });

            // Create a visual bar for each answer
            const createBar = (percentage, length = 20) => {
                const filled = Math.round((percentage / 100) * length);
                const empty = length - filled;
                return "█".repeat(filled) + "░".repeat(empty);
            };

            // Sort answers by vote count (descending) and format results
            const sortedAnswers = [...poll.answers.values()].sort(
                (a, b) => b.voteCount - a.voteCount,
            );

            const resultsText = sortedAnswers
                .map((answer, index) => {
                    const percentage = totalVotes > 0 ? (answer.voteCount / totalVotes) * 100 : 0;
                    const bar = createBar(percentage);
                    const rank =
                        index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "▫️";

                    // Get answer text (handle potential null)
                    const answerText = answer.text || "No text";
                    const emoji = answer.emoji ? `${answer.emoji} ` : "";

                    return (
                        `${rank} **${emoji}${answerText}**\n` +
                        `${bar} ${percentage.toFixed(1)}% (${answer.voteCount} vote${answer.voteCount !== 1 ? "s" : ""})`
                    );
                })
                .join("\n\n");

            embed.addFields({ name: "🗳️ Results", value: resultsText || "No votes yet" });

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await handleError(
                interaction,
                error,
                "POLL_FETCH",
                "Failed to fetch poll results. Make sure the message ID and channel are correct.",
            );
        }
    },
};
