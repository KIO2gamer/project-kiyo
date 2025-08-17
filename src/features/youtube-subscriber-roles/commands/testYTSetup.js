const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const { handleError } = require("../../../utils/errorHandler");

module.exports = {
    description_full:
        "Test the YouTube subscriber role setup and configuration. Checks if all required environment variables and dependencies are properly configured.",
    usage: "/test_yt_setup",
    examples: ["/test_yt_setup"],

    data: new SlashCommandBuilder()
        .setName("test_yt_setup")
        .setDescription("Test YouTube subscriber role setup")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });

            const checks = [];

            // Check YouTube API
            const youtubeApiKey = process.env.YOUTUBE_API_KEY;
            checks.push({
                name: "YouTube API Key",
                status: youtubeApiKey ? "✅ Configured" : "❌ Missing",
                value: youtubeApiKey
                    ? "YouTube Data API v3 key is set"
                    : "Set YOUTUBE_API_KEY in .env file",
            });

            // Check Discord OAuth2
            const clientId = process.env.DISCORD_CLIENT_ID;
            const clientSecret = process.env.DISCORD_CLIENT_SECRET;
            const redirectUri = process.env.DISCORD_REDIRECT_URI;

            checks.push({
                name: "Discord Client ID",
                status: clientId ? "✅ Configured" : "❌ Missing",
                value: clientId
                    ? "Discord application client ID is set"
                    : "Set DISCORD_CLIENT_ID in .env file",
            });

            checks.push({
                name: "Discord Client Secret",
                status: clientSecret ? "✅ Configured" : "❌ Missing",
                value: clientSecret
                    ? "Discord application client secret is set"
                    : "Set DISCORD_CLIENT_SECRET in .env file",
            });

            checks.push({
                name: "OAuth2 Redirect URI",
                status: redirectUri ? "✅ Configured" : "❌ Missing",
                value: redirectUri
                    ? `Redirect URI: ${redirectUri}`
                    : "Set DISCORD_REDIRECT_URI in .env file",
            });

            // Check OAuth2 server
            const oauth2Port = process.env.OAUTH2_PORT || 3000;
            const oauth2Running = interaction.client.oauth2Handler
                ? "✅ Running"
                : "❌ Not Running";
            checks.push({
                name: "OAuth2 Callback Server",
                status: oauth2Running,
                value: oauth2Running.includes("✅")
                    ? `Server running on port ${oauth2Port}`
                    : "OAuth2 server failed to start - check configuration",
            });

            // Check MongoDB connection
            const mongoose = require("mongoose");
            const mongoStatus =
                mongoose.connection.readyState === 1 ? "✅ Connected" : "❌ Disconnected";
            checks.push({
                name: "MongoDB Database",
                status: mongoStatus,
                value: mongoStatus.includes("✅")
                    ? "Database connection is active"
                    : "Database connection failed",
            });

            // Check bot permissions
            const botMember = interaction.guild.members.me;
            const hasManageRoles = botMember.permissions.has(PermissionFlagsBits.ManageRoles);
            checks.push({
                name: "Bot Permissions",
                status: hasManageRoles ? "✅ Sufficient" : "❌ Insufficient",
                value: hasManageRoles
                    ? "Bot has 'Manage Roles' permission"
                    : "Bot needs 'Manage Roles' permission",
            });

            // Test YouTube API connection
            let youtubeApiStatus = "❌ Failed";
            let youtubeApiValue = "Could not test YouTube API";

            if (youtubeApiKey) {
                try {
                    const { google } = require("googleapis");
                    const youtube = google.youtube({
                        version: "v3",
                        auth: youtubeApiKey,
                    });

                    // Test with a simple search
                    await youtube.search.list({
                        part: "id",
                        q: "test",
                        type: "channel",
                        maxResults: 1,
                    });

                    youtubeApiStatus = "✅ Working";
                    youtubeApiValue = "YouTube API connection successful";
                } catch (error) {
                    youtubeApiValue = `YouTube API error: ${error.message}`;
                }
            }

            checks.push({
                name: "YouTube API Connection",
                status: youtubeApiStatus,
                value: youtubeApiValue,
            });

            // Create embed
            const embed = new EmbedBuilder()
                .setTitle("🔧 YouTube Subscriber Role Setup Test")
                .setDescription("Configuration and dependency check results:")
                .setColor("#0099FF")
                .setTimestamp();

            // Add fields for each check
            checks.forEach((check) => {
                embed.addFields({
                    name: `${check.status} ${check.name}`,
                    value: check.value,
                    inline: false,
                });
            });

            // Overall status
            const allPassed = checks.every((check) => check.status.includes("✅"));
            const overallStatus = allPassed ? "✅ Ready" : "⚠️ Issues Found";
            const overallMessage = allPassed
                ? "All checks passed! YouTube subscriber roles should work correctly."
                : "Some issues were found. Please fix the configuration before using YouTube subscriber roles.";

            embed.addFields({
                name: `${overallStatus} Overall Status`,
                value: overallMessage,
                inline: false,
            });

            if (allPassed) {
                embed.addFields({
                    name: "📋 Next Steps",
                    value:
                        "1. Use `/yt_sub_role_config action:setup` to configure subscriber tiers\n" +
                        "2. Users can then use `/get_yt_sub_role` to get their roles\n" +
                        "3. Make sure users have connected their YouTube channels to Discord",
                    inline: false,
                });
            }

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while testing the YouTube setup.",
            );
        }
    },
};
