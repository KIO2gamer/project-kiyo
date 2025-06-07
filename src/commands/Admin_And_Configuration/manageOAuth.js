const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const OAuthCode = require("../../database/OauthCode");
const { handleError } = require("../../utils/errorHandler");
const Logger = require("../../utils/logger");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("manage_oauth")
        .setDescription("Manage OAuth2 sessions and view statistics")
        .addSubcommand(subcommand =>
            subcommand
                .setName("stats")
                .setDescription("View OAuth2 usage statistics")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("cleanup")
                .setDescription("Clean up expired OAuth2 records")
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("list")
                .setDescription("List recent OAuth2 sessions")
                .addIntegerOption(option =>
                    option
                        .setName("limit")
                        .setDescription("Number of records to show (default: 10)")
                        .setMinValue(1)
                        .setMaxValue(50)
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName("revoke")
                .setDescription("Revoke a specific OAuth2 session")
                .addStringOption(option =>
                    option
                        .setName("interaction_id")
                        .setDescription("The interaction ID to revoke")
                        .setRequired(true)
                )
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    description_full: "Administrative command to manage OAuth2 sessions, view statistics, and perform maintenance tasks.",
    usage: "/manage_oauth <subcommand>",
    examples: [
        "/manage_oauth stats",
        "/manage_oauth cleanup",
        "/manage_oauth list limit:20",
        "/manage_oauth revoke interaction_id:123456789"
    ],

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            
            const subcommand = interaction.options.getSubcommand();
            
            switch (subcommand) {
                case "stats":
                    await this.handleStats(interaction);
                    break;
                case "cleanup":
                    await this.handleCleanup(interaction);
                    break;
                case "list":
                    await this.handleList(interaction);
                    break;
                case "revoke":
                    await this.handleRevoke(interaction);
                    break;
                default:
                    throw new Error("Unknown subcommand");
            }
        } catch (error) {
            Logger.error("Error in manage_oauth command:", error);
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "Failed to execute OAuth2 management command"
            );
        }
    },

    async handleStats(interaction) {
        try {
            const now = new Date();
            const last24h = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            const last7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            
            const [total, last24hCount, last7dCount, completedCount, failedCount, pendingCount] = await Promise.all([
                OAuthCode.countDocuments(),
                OAuthCode.countDocuments({ createdAt: { $gte: last24h } }),
                OAuthCode.countDocuments({ createdAt: { $gte: last7d } }),
                OAuthCode.countDocuments({ status: 'completed' }),
                OAuthCode.countDocuments({ status: 'failed' }),
                OAuthCode.countDocuments({ status: 'pending' })
            ]);
            
            const successRate = total > 0 ? ((completedCount / total) * 100).toFixed(1) : 0;
            
            const embed = new EmbedBuilder()
                .setTitle("📊 OAuth2 Statistics")
                .setColor(0x00AE86)
                .addFields(
                    {
                        name: "📈 Usage Statistics",
                        value: `**Total Sessions:** ${total.toLocaleString()}\n**Last 24h:** ${last24hCount.toLocaleString()}\n**Last 7 days:** ${last7dCount.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: "✅ Status Breakdown",
                        value: `**Completed:** ${completedCount.toLocaleString()}\n**Failed:** ${failedCount.toLocaleString()}\n**Pending:** ${pendingCount.toLocaleString()}`,
                        inline: true
                    },
                    {
                        name: "📊 Performance",
                        value: `**Success Rate:** ${successRate}%\n**Active Sessions:** ${pendingCount.toLocaleString()}`,
                        inline: true
                    }
                )
                .setFooter({ text: `Generated at ${now.toLocaleString()}` })
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            throw new Error(`Failed to retrieve OAuth2 statistics: ${error.message}`);
        }
    },

    async handleCleanup(interaction) {
        try {
            // Clean up expired records (older than 24 hours for completed/failed)
            const cutoffDate = new Date(Date.now() - 24 * 60 * 60 * 1000);
            
            const result = await OAuthCode.deleteMany({
                $or: [
                    { status: { $in: ['completed', 'failed'] }, createdAt: { $lt: cutoffDate } },
                    { status: 'expired' },
                    { expiresAt: { $lt: new Date() } }
                ]
            });
            
            const embed = new EmbedBuilder()
                .setTitle("🧹 OAuth2 Cleanup Complete")
                .setColor(0x00AE86)
                .setDescription(`Successfully cleaned up **${result.deletedCount}** expired OAuth2 records.`)
                .addFields(
                    {
                        name: "Cleanup Criteria",
                        value: "• Completed/failed sessions older than 24h\n• Explicitly expired sessions\n• Sessions past their expiration time",
                        inline: false
                    }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
            Logger.log("OAUTH", `Cleaned up ${result.deletedCount} OAuth2 records`, "info");
        } catch (error) {
            throw new Error(`Failed to cleanup OAuth2 records: ${error.message}`);
        }
    },

    async handleList(interaction) {
        try {
            const limit = interaction.options.getInteger("limit") || 10;
            
            const records = await OAuthCode.find()
                .sort({ createdAt: -1 })
                .limit(limit)
                .select('interactionId status createdAt completedAt userInfo.username guildId')
                .lean();
            
            if (records.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle("📋 Recent OAuth2 Sessions")
                    .setColor(0xFFB347)
                    .setDescription("No OAuth2 sessions found.");
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            const embed = new EmbedBuilder()
                .setTitle(`📋 Recent OAuth2 Sessions (${records.length})`)
                .setColor(0x00AE86)
                .setDescription(`Showing the ${records.length} most recent OAuth2 sessions:`);
            
            const formatStatus = (status) => {
                const statusEmojis = {
                    pending: "⏳",
                    completed: "✅",
                    failed: "❌",
                    expired: "⏰"
                };
                return `${statusEmojis[status] || "❓"} ${status.toUpperCase()}`;
            };
            
            const sessionList = records.map((record, index) => {
                const username = record.userInfo?.username || "Unknown";
                const duration = record.completedAt 
                    ? Math.round((record.completedAt - record.createdAt) / 1000)
                    : "N/A";
                const timeAgo = Math.round((Date.now() - record.createdAt) / (1000 * 60));
                
                return `**${index + 1}.** ${formatStatus(record.status)}\n` +
                       `🧑‍💻 **User:** ${username}\n` +
                       `🆔 **ID:** ${record.interactionId}\n` +
                       `⏱️ **Duration:** ${duration}s | **${timeAgo}m ago**\n`
            }).join("\n");
            
            // Split into multiple embeds if too long
            if (sessionList.length > 4000) {
                embed.setDescription("Showing recent OAuth2 sessions (truncated):");
                embed.addFields({
                    name: "Sessions",
                    value: sessionList.substring(0, 4000) + "...\n*List truncated*",
                    inline: false
                });
            } else {
                embed.addFields({
                    name: "Sessions",
                    value: sessionList || "No sessions to display",
                    inline: false
                });
            }
            
            embed.setFooter({ text: `Use /manage_oauth cleanup to remove old records` });
            
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            throw new Error(`Failed to list OAuth2 sessions: ${error.message}`);
        }
    },

    async handleRevoke(interaction) {
        try {
            const interactionId = interaction.options.getString("interaction_id");
            
            const record = await OAuthCode.findOne({ interactionId });
            
            if (!record) {
                const embed = new EmbedBuilder()
                    .setTitle("❌ Session Not Found")
                    .setColor(0xFF6B6B)
                    .setDescription(`No OAuth2 session found with interaction ID: ${interactionId}`);
                
                return await interaction.editReply({ embeds: [embed] });
            }
            
            // Update the record to mark it as revoked
            await OAuthCode.findOneAndUpdate(
                { interactionId },
                { 
                    status: 'expired',
                    completedAt: new Date()
                }
            );
            
            const embed = new EmbedBuilder()
                .setTitle("✅ OAuth2 Session Revoked")
                .setColor(0x00AE86)
                .setDescription(`Successfully revoked OAuth2 session: ${interactionId}`)
                .addFields(
                    {
                        name: "Session Details",
                        value: `**User:** ${record.userInfo?.username || "Unknown"}\n` +
                               `**Status:** ${record.status} → expired\n` +
                               `**Created:** ${new Date(record.createdAt).toLocaleString()}`,
                        inline: false
                    }
                )
                .setTimestamp();
            
            await interaction.editReply({ embeds: [embed] });
            
            Logger.log("OAUTH", `Revoked OAuth2 session ${interactionId}`, "info");
        } catch (error) {
            throw new Error(`Failed to revoke OAuth2 session: ${error.message}`);
        }
    }
};

