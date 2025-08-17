const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
    MessageFlags,
} = require("discord.js");
const { google } = require("googleapis");
const axios = require("axios");
const { handleError } = require("../../utils/errorHandler");
const YTSubRoleConfig = require("../../database/ytSubRoleConfig");
const TempOAuth2Storage = require("../../database/tempOAuth2Storage");

module.exports = {
    description_full:
        "Get a role based on your YouTube subscriber count. Uses Discord OAuth2 to verify your YouTube channel connection and assigns roles based on subscriber tiers.",
    usage: "/get_yt_sub_role",
    examples: ["/get_yt_sub_role"],

    data: new SlashCommandBuilder()
        .setName("get_yt_sub_role")
        .setDescription("Get a role based on your YouTube subscriber count")
        .setDefaultMemberPermissions(PermissionFlagsBits.SendMessages),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const userId = interaction.user.id;
            const guildId = interaction.guild.id;

            // Check if YouTube API is configured
            const apiKey = process.env.YOUTUBE_API_KEY;
            if (!apiKey) {
                await handleError(
                    interaction,
                    new Error("API key missing"),
                    "CONFIGURATION",
                    "The YouTube API is not properly configured. Please contact the bot administrator.",
                );
                return;
            }

            // Check if Discord OAuth2 is configured
            const clientId = process.env.DISCORD_CLIENT_ID;
            const clientSecret = process.env.DISCORD_CLIENT_SECRET;
            const redirectUri = process.env.DISCORD_REDIRECT_URI;

            if (!clientId || !clientSecret || !redirectUri) {
                await handleError(
                    interaction,
                    new Error("OAuth2 not configured"),
                    "CONFIGURATION",
                    "Discord OAuth2 is not properly configured. Please contact the bot administrator.",
                );
                return;
            }

            // Get role configuration for this guild
            const roleConfig = await YTSubRoleConfig.findOne({ guildId });
            if (!roleConfig || roleConfig.subscriberTiers.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle("❌ No Role Configuration")
                    .setDescription(
                        "YouTube subscriber roles are not configured for this server. Please ask an administrator to set up the subscriber tiers using `/yt_sub_role_config`.",
                    )
                    .setColor("#FF0000");

                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // Create OAuth2 authorization URL
            const scopes = ["connections"];
            const state = `${userId}-${Date.now()}`;
            const authUrl = `https://discord.com/api/oauth2/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${scopes.join("%20")}&state=${state}`;

            // Create embed with instructions
            const embed = new EmbedBuilder()
                .setTitle("🔗 YouTube Subscriber Role Verification")
                .setDescription(
                    "To verify your YouTube channel and get the appropriate subscriber role, you need to:\n\n" +
                        "1. **Connect your YouTube account** to Discord (if not already connected)\n" +
                        "2. **Authorize this bot** to view your Discord connections\n" +
                        "3. **Wait for verification** of your subscriber count\n\n" +
                        "Click the button below to start the OAuth2 verification process.",
                )
                .addFields(
                    {
                        name: "📊 Available Subscriber Tiers",
                        value: roleConfig.subscriberTiers
                            .sort((a, b) => a.minSubscribers - b.minSubscribers)
                            .map((tier) => {
                                const role = interaction.guild.roles.cache.get(tier.roleId);
                                const roleName = role ? role.name : "Unknown Role";
                                return `**${formatNumber(tier.minSubscribers)}+ subscribers:** ${roleName}`;
                            })
                            .join("\n"),
                        inline: false,
                    },
                    {
                        name: "ℹ️ Requirements",
                        value:
                            "• Your YouTube channel must be connected to your Discord account\n" +
                            "• Your Discord connections must be visible to this bot\n" +
                            "• Your YouTube channel must be public",
                        inline: false,
                    },
                )
                .setColor("#FF0000")
                .setFooter({
                    text: "This process is secure and only accesses your public Discord connections",
                });

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("🔐 Authorize & Verify")
                    .setStyle(ButtonStyle.Link)
                    .setURL(authUrl),
                new ButtonBuilder()
                    .setCustomId(`yt_verify_${userId}`)
                    .setLabel("✅ I've Already Authorized")
                    .setStyle(ButtonStyle.Success),
            );

            await interaction.editReply({
                embeds: [embed],
                components: [row],
            });

            // Set up button interaction collector
            const filter = (i) => i.customId === `yt_verify_${userId}` && i.user.id === userId;
            const collector = interaction.channel.createMessageComponentCollector({
                filter,
                time: 300000, // 5 minutes
            });

            collector.on("collect", async (buttonInteraction) => {
                try {
                    await buttonInteraction.deferUpdate();
                    await this.verifyYouTubeChannel(buttonInteraction, userId, guildId, roleConfig);
                } catch (error) {
                    console.error("Error handling button interaction:", error);

                    // If the interaction is expired, try to send a new message
                    if (error.code === 10062) {
                        // Unknown interaction (expired)
                        try {
                            await interaction.followUp({
                                content:
                                    "⚠️ The interaction has expired. Please run the command again to verify your YouTube channel.",
                                flags: MessageFlags.Ephemeral,
                            });
                        } catch (followUpError) {
                            console.error("Could not send follow-up message:", followUpError);
                        }
                    } else if (!buttonInteraction.replied && !buttonInteraction.deferred) {
                        try {
                            await buttonInteraction.reply({
                                content:
                                    "An error occurred while processing your request. Please try again.",
                                flags: MessageFlags.Ephemeral,
                            });
                        } catch (replyError) {
                            console.error("Could not reply to button interaction:", replyError);
                        }
                    }
                }
            });

            collector.on("end", (collected, reason) => {
                // Disable buttons after timeout
                row.components.forEach((component) => component.setDisabled(true));

                // Only try to edit if the interaction hasn't expired
                if (reason === "time") {
                    interaction
                        .editReply({
                            components: [row],
                            content:
                                "⏰ This verification has expired. Please run the command again to verify your YouTube channel.",
                        })
                        .catch(() => {
                            // If we can't edit (interaction expired), try a follow-up
                            interaction
                                .followUp({
                                    content:
                                        "⏰ The verification window has expired. Please run `/get_yt_sub_role` again.",
                                    flags: MessageFlags.Ephemeral,
                                })
                                .catch(() => {});
                        });
                } else {
                    interaction.editReply({ components: [row] }).catch(() => {});
                }
            });
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while processing the YouTube subscriber role request.",
            );
        }
    },

    async verifyYouTubeChannel(interaction, userId, guildId, roleConfig) {
        try {
            // Check if we have stored OAuth2 tokens for this user
            const oauthData = await TempOAuth2Storage.findOne({ userId });

            if (!oauthData || oauthData.expiresAt < new Date()) {
                const embed = new EmbedBuilder()
                    .setTitle("⚠️ Authorization Required")
                    .setDescription(
                        "You need to complete the OAuth2 authorization first.\n\n" +
                            "**Steps:**\n" +
                            "1. Click the 'Authorize & Verify' button above\n" +
                            "2. Complete the Discord OAuth2 authorization\n" +
                            "3. Return here and click this button again\n\n" +
                            "Your authorization may have expired. Please try the authorization process again.",
                    )
                    .setColor("#FFA500");

                await interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            // Get user's connections using the stored access token
            const connectionsResponse = await axios.get(
                "https://discord.com/api/users/@me/connections",
                {
                    headers: {
                        Authorization: `Bearer ${oauthData.accessToken}`,
                    },
                },
            );

            const connections = connectionsResponse.data;
            const youtubeConnection = connections.find((conn) => conn.type === "youtube");

            if (!youtubeConnection) {
                const embed = new EmbedBuilder()
                    .setTitle("❌ No YouTube Connection Found")
                    .setDescription(
                        "No YouTube channel is connected to your Discord account.\n\n" +
                            "**To connect your YouTube channel:**\n" +
                            "1. Go to Discord Settings → Connections\n" +
                            "2. Click the YouTube icon and connect your account\n" +
                            "3. Make sure the connection is visible\n" +
                            "4. Try this command again",
                    )
                    .setColor("#FF0000");

                await interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            // Get YouTube channel data
            const youtube = google.youtube({
                version: "v3",
                auth: process.env.YOUTUBE_API_KEY,
            });

            const channelId = youtubeConnection.id;
            const channelResponse = await youtube.channels.list({
                part: "snippet,statistics",
                id: channelId,
            });

            if (!channelResponse.data.items || channelResponse.data.items.length === 0) {
                const embed = new EmbedBuilder()
                    .setTitle("❌ Channel Not Found")
                    .setDescription(
                        "Your connected YouTube channel could not be found or is not public. Please ensure your channel is public and try again.",
                    )
                    .setColor("#FF0000");

                await interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            const channelData = channelResponse.data.items[0];
            const subscriberCount = parseInt(channelData.statistics.subscriberCount) || 0;

            // Find appropriate role based on subscriber count
            const eligibleTiers = roleConfig.subscriberTiers
                .filter((tier) => subscriberCount >= tier.minSubscribers)
                .sort((a, b) => b.minSubscribers - a.minSubscribers);

            if (eligibleTiers.length === 0) {
                const lowestTier = roleConfig.subscriberTiers.sort(
                    (a, b) => a.minSubscribers - b.minSubscribers,
                )[0];
                const embed = new EmbedBuilder()
                    .setTitle("📊 Subscriber Count Verified")
                    .setDescription(
                        `**Channel:** ${channelData.snippet.title}\n` +
                            `**Subscribers:** ${formatNumber(subscriberCount)}\n\n` +
                            `You need at least **${formatNumber(lowestTier.minSubscribers)} subscribers** to get the lowest tier role.`,
                    )
                    .setThumbnail(channelData.snippet.thumbnails.default?.url)
                    .setColor("#FFA500");

                await interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            // Get the highest tier role the user qualifies for
            const targetTier = eligibleTiers[0];
            const targetRole = interaction.guild.roles.cache.get(targetTier.roleId);

            if (!targetRole) {
                const embed = new EmbedBuilder()
                    .setTitle("❌ Role Not Found")
                    .setDescription(
                        "The configured role for your subscriber tier no longer exists. Please contact an administrator.",
                    )
                    .setColor("#FF0000");

                await interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            // Check if user already has this role
            const member = interaction.guild.members.cache.get(userId);
            if (member.roles.cache.has(targetRole.id)) {
                const embed = new EmbedBuilder()
                    .setTitle("✅ Role Already Assigned")
                    .setDescription(
                        `**Channel:** ${channelData.snippet.title}\n` +
                            `**Subscribers:** ${formatNumber(subscriberCount)}\n` +
                            `**Current Role:** ${targetRole.name}\n\n` +
                            "You already have the appropriate role for your subscriber count!",
                    )
                    .setThumbnail(channelData.snippet.thumbnails.default?.url)
                    .setColor("#00FF00");

                await interaction.editReply({ embeds: [embed], components: [] });
                return;
            }

            // Remove any existing subscriber tier roles
            const existingRoles = roleConfig.subscriberTiers
                .map((tier) => tier.roleId)
                .filter((roleId) => member.roles.cache.has(roleId));

            if (existingRoles.length > 0) {
                await member.roles.remove(existingRoles);
            }

            // Add the new role
            await member.roles.add(targetRole);

            // Create success embed
            const embed = new EmbedBuilder()
                .setTitle("🎉 Role Assigned Successfully!")
                .setDescription(
                    `**Channel:** ${channelData.snippet.title}\n` +
                        `**Subscribers:** ${formatNumber(subscriberCount)}\n` +
                        `**New Role:** ${targetRole.name}\n\n` +
                        "Congratulations! Your YouTube subscriber role has been updated.",
                )
                .setThumbnail(channelData.snippet.thumbnails.default?.url)
                .setColor("#00FF00")
                .setFooter({
                    text: "Role will be updated automatically as your subscriber count changes",
                });

            const channelButton = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel("🎬 View Channel")
                    .setStyle(ButtonStyle.Link)
                    .setURL(`https://youtube.com/channel/${channelId}`),
            );

            await interaction.editReply({
                embeds: [embed],
                components: [channelButton],
            });

            // Log the role assignment
            console.log(
                `YouTube role assigned: ${member.user.tag} (${subscriberCount} subs) -> ${targetRole.name}`,
            );
        } catch (error) {
            console.error("Error verifying YouTube channel:", error);

            let errorMessage = "An error occurred while verifying your YouTube channel.";
            if (error.response?.status === 403) {
                errorMessage =
                    "Unable to access your Discord connections. Please make sure you've authorized the bot and your connections are visible.";
            } else if (error.response?.status === 404) {
                errorMessage = "Your YouTube channel could not be found or is not public.";
            }

            const embed = new EmbedBuilder()
                .setTitle("❌ Verification Failed")
                .setDescription(errorMessage)
                .setColor("#FF0000");

            await interaction.editReply({ embeds: [embed], components: [] });
        }
    },
};

// Helper function to format numbers
function formatNumber(num) {
    if (!num) return "0";
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + "B";
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + "K";
    }
    return num.toString();
}
