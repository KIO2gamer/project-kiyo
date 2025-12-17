const { ChannelType, EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const { handleError } = require("../../utils/errorHandler");
const { getChannelType } = require("../../utils/channelTypes");
const {
    formatCategorizedPermissions,
    splitPermissionText,
} = require("../../utils/permissionFormatter");

module.exports = {
    description_full:
        "Provides detailed information about a specific channel, including its ID, type, creation date, topic, position, permissions, and more specialized details based on channel type.",
    usage: "/channel_info <channel>",
    examples: [
        "/channel_info #general",
        "/channel_info #voice-chat",
        "/channel_info #announcements",
        "/channel_info 123456789012345678 (channel ID)",
    ],

    data: new SlashCommandBuilder()
        .setName("channel_info")
        .setDescription("Provides detailed information about a specific channel")
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to get information about")
                .setRequired(true),
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();

            const channel = interaction.options.getChannel("channel");

            // Validate channel
            if (!channel) {
                await handleError(
                    interaction,
                    new Error("Invalid channel"),
                    "VALIDATION",
                    "The specified channel could not be found.",
                );
                return;
            }

            try {
                // Get permissions using the utility function
                const getPermissions = (channel, guild) => {
                    const permissions = channel.permissionsFor(guild.roles.everyone);
                    if (!permissions) return "No permissions";

                    return formatCategorizedPermissions(permissions, {
                        checkmark: true,
                        headers: true,
                        maxLength: 1024,
                    });
                };

                // Get channel activity statistics
                const getChannelStats = async (channel) => {
                    if (channel.type === ChannelType.GuildText) {
                        try {
                            const messages = await channel.messages.fetch({ limit: 100 });
                            const uniqueAuthors = new Set(messages.map((m) => m.author.id)).size;
                            const lastMessage = messages.first();

                            return {
                                messageCount: messages.size,
                                uniqueAuthors,
                                lastMessageAt: lastMessage ? lastMessage.createdTimestamp : null,
                            };
                        } catch {
                            return null;
                        }
                    }
                    return null;
                };

                // Initialize the enhanced embed
                const embed = new EmbedBuilder()
                    .setAuthor({
                        name: "Channel Information",
                        iconURL: interaction.guild.iconURL(),
                    })
                    .setTitle(`${getChannelIcon(channel)} ${channel.name}`)
                    .setDescription(
                        (channel.topic ? `*${channel.topic}*\n\n` : "") +
                            `${"-".repeat(40)}\n\n` +
                            `🎯 **Channel ID:** \`${channel.id}\`\n` +
                            `📁 **Type:** ${getChannelType(channel)}\n` +
                            `📅 **Created:** <t:${Math.floor(channel.createdAt.getTime() / 1000)}:R>`,
                    )
                    .setColor("#5865F2")
                    .setThumbnail(interaction.guild.iconURL({ dynamic: true, size: 128 }));

                // Add fields based on channel type
                if (
                    channel.type === ChannelType.GuildText ||
                    channel.type === ChannelType.GuildAnnouncement
                ) {
                    const stats = await getChannelStats(channel);

                    embed.addFields(
                        {
                            name: "📢 Topic",
                            value: channel.topic || "No topic set",
                            inline: false,
                        },
                        {
                            name: "🔞 NSFW",
                            value: channel.nsfw ? "Yes" : "No",
                            inline: true,
                        },
                        {
                            name: "⏱️ Rate Limit",
                            value: channel.rateLimitPerUser
                                ? `${channel.rateLimitPerUser} seconds`
                                : "No slow mode",
                            inline: true,
                        },
                    );

                    if (stats) {
                        embed.addFields({
                            name: "📊 Recent Activity",
                            value: [
                                `**Messages:** ${stats.messageCount} (last 100)`,
                                `**Unique Authors:** ${stats.uniqueAuthors}`,
                                stats.lastMessageAt
                                    ? `**Last Message:** <t:${Math.floor(stats.lastMessageAt / 1000)}:R>`
                                    : "**Last Message:** No messages",
                            ].join("\n"),
                            inline: false,
                        });
                    }

                    // Add thread information if available
                    if (channel.threads?.cache.size) {
                        const activeThreads = channel.threads.cache.filter(
                            (thread) => !thread.archived,
                        );
                        const archivedThreads = channel.threads.cache.filter(
                            (thread) => thread.archived,
                        );

                        embed.addFields({
                            name: "🧵 Threads",
                            value: [
                                `**Active:** ${activeThreads.size}`,
                                `**Archived:** ${archivedThreads.size}`,
                                `**Total:** ${channel.threads.cache.size}`,
                            ].join("\n"),
                            inline: true,
                        });
                    }
                }

                // Voice channel specific info
                if (
                    channel.type === ChannelType.GuildVoice ||
                    channel.type === ChannelType.GuildStageVoice
                ) {
                    const connectedMembers = channel.members.map((member) => member.user.tag);

                    embed.addFields(
                        {
                            name: "🎤 Audio Settings",
                            value: [
                                `**Bitrate:** ${channel.bitrate / 1000} kbps`,
                                `**Region:** ${channel.rtcRegion || "Auto"}`,
                                `**Quality Mode:** ${channel.videoQualityMode === 1 ? "Auto" : "Full"}`,
                            ].join("\n"),
                            inline: true,
                        },
                        {
                            name: "👥 Capacity",
                            value: [
                                `**Current:** ${channel.members.size} members`,
                                `**Limit:** ${channel.userLimit ? `${channel.userLimit} users` : "Unlimited"}`,
                            ].join("\n"),
                            inline: true,
                        },
                    );

                    if (connectedMembers.length > 0) {
                        embed.addFields({
                            name: "🎧 Connected Members",
                            value: connectedMembers
                                .map((tag) => `• ${tag}`)
                                .join("\n")
                                .substring(0, 1024),
                            inline: false,
                        });
                    }
                }

                // Forum channel specific info
                if (channel.type === ChannelType.GuildForum) {
                    const activePosts = channel.threads?.cache.filter((thread) => !thread.archived);
                    const archivedPosts = channel.threads?.cache.filter(
                        (thread) => thread.archived,
                    );

                    embed.addFields(
                        {
                            name: "📢 Topic",
                            value: channel.topic || "No topic set",
                            inline: false,
                        },
                        {
                            name: "📝 Posts",
                            value: [
                                `**Active:** ${activePosts?.size || 0}`,
                                `**Archived:** ${archivedPosts?.size || 0}`,
                                `**Total:** ${channel.threads?.cache.size || 0}`,
                            ].join("\n"),
                            inline: true,
                        },
                    );

                    if (channel.availableTags?.length) {
                        embed.addFields({
                            name: "🏷️ Available Tags",
                            value: channel.availableTags
                                .map((tag) => `• ${tag.emoji ? tag.emoji + " " : ""}${tag.name}`)
                                .join("\n"),
                            inline: false,
                        });
                    }
                }

                // Add category and position info for all channel types
                if (channel.parent) {
                    const siblings = channel.parent.children.cache;
                    const position = Array.from(siblings.keys()).indexOf(channel.id) + 1;

                    embed.addFields(
                        {
                            name: "📂 Category",
                            value: channel.parent.name,
                            inline: true,
                        },
                        {
                            name: "📊 Position",
                            value: `${position} of ${siblings.size}`,
                            inline: true,
                        },
                    );
                } else if (channel.type !== ChannelType.GuildCategory) {
                    embed.addFields({
                        name: "📂 Category",
                        value: "None (Top-level channel)",
                        inline: true,
                    });
                }

                // Add permissions info
                const permissionText = getPermissions(channel, interaction.guild);
                const permissionParts = splitPermissionText(permissionText);

                for (let i = 0; i < permissionParts.length; i++) {
                    embed.addFields({
                        name:
                            i === 0
                                ? "🔐 Default Permissions"
                                : "🔐 Default Permissions (continued)",
                        value: permissionParts[i],
                        inline: false,
                    });
                }

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                await handleError(
                    interaction,
                    error,
                    "DATA_COLLECTION",
                    "Failed to collect channel information. Some details may be incomplete.",
                );
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while retrieving channel information.",
            );
        }
    },
};

// Helper function to get an appropriate emoji based on channel type
function getChannelIcon(channel) {
    switch (channel.type) {
        case ChannelType.GuildText:
            return "💬";
        case ChannelType.GuildVoice:
            return "🔊";
        case ChannelType.GuildCategory:
            return "📂";
        case ChannelType.GuildAnnouncement:
            return "📢";
        case ChannelType.AnnouncementThread:
        case ChannelType.PublicThread:
        case ChannelType.PrivateThread:
            return "🧵";
        case ChannelType.GuildStageVoice:
            return "🎭";
        case ChannelType.GuildForum:
            return "📋";
        default:
            return "📝";
    }
}
