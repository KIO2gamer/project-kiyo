const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const { handleError } = require("../../utils/errorHandler");
const { formatUptime } = require("../../utils/formatUptime");

module.exports = {
    description_full:
        "Measures the bot's response time (latency) and displays various connection metrics including WebSocket heartbeat, REST API latency, and database connection status.",
    usage: "/ping",
    examples: ["/ping"],

    data: new SlashCommandBuilder()
        .setName("ping")
        .setDescription("Check the bot's response time and connection status"),

    async execute(interaction) {
        try {
            // Initial reply to measure round-trip time
            const sent = await interaction.deferReply({ fetchReply: true });
            const tripTime = sent.createdTimestamp - interaction.createdTimestamp;

            try {
                // Get various latency metrics
                const wsHeartbeat = interaction.client.ws.ping;
                const uptimeSeconds = Math.floor(interaction.client.uptime / 1000);

                // Create status indicators
                const getStatusEmoji = (ms) => {
                    if (ms < 100) return "🟢"; // Excellent
                    if (ms < 200) return "🟡"; // Good
                    if (ms < 500) return "🟠"; // Fair
                    return "🔴"; // Poor
                };

                const embed = new EmbedBuilder()
                    .setTitle("🏓 Pong!")
                    .setColor(tripTime < 200 ? "#00FF00" : tripTime < 500 ? "#FFA500" : "#FF0000")
                    .addFields(
                        {
                            name: "📊 Latency",
                            value: [
                                `${getStatusEmoji(tripTime)} **Round-trip:** ${tripTime}ms`,
                                `${getStatusEmoji(wsHeartbeat)} **WebSocket:** ${wsHeartbeat}ms`,
                            ].join("\n"),
                            inline: false,
                        },
                        {
                            name: "⚙️ System Info",
                            value: [
                                `**Uptime:** ${formatUptime(uptimeSeconds)}`,
                                `**Memory Usage:** ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
                                `**Node.js:** ${process.version}`,
                            ].join("\n"),
                            inline: false,
                        },
                    )
                    .setFooter({
                        text: `Shard ${interaction.guild.shardId} | ${interaction.client.ws.status}`,
                        iconURL: interaction.client.user.displayAvatarURL(),
                    })
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                await handleError(
                    interaction,
                    error,
                    "DATA_COLLECTION",
                    "Failed to collect some metrics. The bot is still operational.",
                );
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while checking the bot status.",
            );
        }
    },
};
