const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActivityType,
    PermissionsBitField,
} = require("discord.js");
const { handleError } = require("../../utils/errorHandler");

// Get platform-specific emoji for client status
function getStatusEmoji(platform) {
    const emojis = {
        desktop: "🖥️",
        mobile: "📱",
        web: "🌐",
    };
    return emojis[platform] || "❓";
}

// Format user status with color and emoji
function formatStatus(status) {
    const statusFormats = {
        online: "🟢 Online",
        idle: "🟡 Idle",
        dnd: "🔴 Do Not Disturb",
        invisible: "⚫ Invisible",
        offline: "⚫ Offline",
    };
    return statusFormats[status] || "⚫ Offline";
}

// Extract activity name formatter outside execute function for better organization
function getActivityName(activity) {
    if (!activity) return "Unknown Activity";

    const timestamps = activity.timestamps
        ? {
            start: activity.timestamps.start
                ? `<t:${Math.floor(activity.timestamps.start / 1000)}:R>`
                : null,
            end: activity.timestamps.end
                ? `<t:${Math.floor(activity.timestamps.end / 1000)}:R>`
                : null,
        }
        : null;

    const details = [];
    if (activity.details) details.push(activity.details);
    if (activity.state) details.push(activity.state);
    if (timestamps?.start) details.push(`Started ${timestamps.start}`);
    if (timestamps?.end) details.push(`Ends ${timestamps.end}`);

    const detailsText = details.length ? `\n┗ ${details.join("\n┗ ")}` : "";

    switch (activity.type) {
    case ActivityType.Playing:
        return `🎮 Playing **${activity.name}**${detailsText}`;
    case ActivityType.Streaming:
        return `🔴 Streaming **${activity.name}**${detailsText}`;
    case ActivityType.Listening:
        return `🎧 Listening to **${activity.name}**${detailsText}`;
    case ActivityType.Watching:
        return `👁️ Watching **${activity.name}**${detailsText}`;
    case ActivityType.Competing:
        return `🏆 Competing in **${activity.name}**${detailsText}`;
    case ActivityType.Custom:
        return activity.state
            ? `${activity.emoji ? activity.emoji + " " : ""}${activity.state}`
            : "🏷️ Custom Status";
    default:
        return "❓ Unknown Activity";
    }
}

// Format badges for display
function formatUserBadges(user) {
    const badgeMap = {
        Staff: { emoji: "👨‍💼", name: "Discord Staff" },
        Partner: { emoji: "🤝", name: "Discord Partner" },
        Hypesquad: { emoji: "🏠", name: "HypeSquad Events" },
        BugHunterLevel1: { emoji: "🐛", name: "Bug Hunter" },
        BugHunterLevel2: { emoji: "🐞", name: "Bug Hunter Elite" },
        HypeSquadOnlineHouse1: { emoji: "⚔️", name: "House Bravery" },
        HypeSquadOnlineHouse2: { emoji: "🧠", name: "House Brilliance" },
        HypeSquadOnlineHouse3: { emoji: "⚖️", name: "House Balance" },
        PremiumEarlySupporter: { emoji: "🏅", name: "Early Supporter" },
        VerifiedDeveloper: { emoji: "👨‍💻", name: "Verified Bot Developer" },
        CertifiedModerator: { emoji: "🛡️", name: "Discord Certified Moderator" },
        ActiveDeveloper: { emoji: "⚒️", name: "Active Developer" },
        Nitro: { emoji: "<:nitro:1234>", name: "Nitro Subscriber" }, // Replace with your server's Nitro emoji ID
    };

    const flags = user.flags?.toArray() || [];
    if (flags.length === 0) return "None";

    return flags
        .map((flag) => {
            const badge = badgeMap[flag];
            return badge ? `${badge.emoji} ${badge.name}` : flag;
        })
        .join("\n");
}

// Get key permissions in a readable format
function getKeyPermissions(member) {
    const permissionsMap = {
        Administrator: { emoji: "👑", name: "Administrator" },
        ManageGuild: { emoji: "🏠", name: "Manage Server" },
        BanMembers: { emoji: "🔨", name: "Ban Members" },
        KickMembers: { emoji: "👢", name: "Kick Members" },
        ManageChannels: { emoji: "📁", name: "Manage Channels" },
        ManageRoles: { emoji: "📊", name: "Manage Roles" },
        ManageMessages: { emoji: "📝", name: "Manage Messages" },
        MentionEveryone: { emoji: "📢", name: "Mention Everyone" },
        ManageWebhooks: { emoji: "🔗", name: "Manage Webhooks" },
        ManageEmojisAndStickers: { emoji: "😀", name: "Manage Emojis" },
        ManageThreads: { emoji: "🧵", name: "Manage Threads" },
        ModerateMembers: { emoji: "🛡️", name: "Timeout Members" },
        ViewAuditLog: { emoji: "📋", name: "View Audit Log" },
        ManageNicknames: { emoji: "📝", name: "Manage Nicknames" },
        ManageEvents: { emoji: "📅", name: "Manage Events" },
    };

    const memberPermissions = member.permissions.toArray();
    const keyPerms = Object.entries(permissionsMap)
        .filter(([perm]) => memberPermissions.includes(perm))
        .map(([, { emoji, name }]) => `${emoji} ${name}`);

    return keyPerms.length ? keyPerms.join("\n") : "None";
}

// Helper function to generate fields for better organization
function generateUserFields(user, member, fetchedUser) {
    const presence = member.presence || {};
    const clientStatus = presence.clientStatus || {};

    // Format client status with emojis
    const clientStatusText = Object.keys(clientStatus).length
        ? Object.entries(clientStatus)
            .map(
                ([platform, status]) =>
                    `${getStatusEmoji(platform)} ${platform}: ${formatStatus(status)}`,
            )
            .join("\n")
        : "No devices active";

    const fields = [
        // Section 1: Basic User Info
        {
            name: "👤 Profile",
            value: [
                `**Username:** ${user.tag}`,
                `**Display Name:** ${member.displayName}${member.nickname ? ` (${member.nickname})` : ""}`,
                `**ID:** \`${user.id}\``,
                `**Type:** ${user.bot ? "🤖 Bot" : "👤 Human"}`,
                fetchedUser.accentColor
                    ? `**Accent Color:** ${fetchedUser.accentColor.toString(16).toUpperCase()}`
                    : null,
                `**Profile URL:** [Link](https://discord.com/users/${user.id})`,
            ]
                .filter(Boolean)
                .join("\n"),
            inline: false,
        },

        // Section 2: Badges and Boosts
        {
            name: "🏆 Badges & Boosts",
            value: [
                `**Badges:**\n${formatUserBadges(user)}`,
                member.premiumSince
                    ? `**Server Booster:** Level ${member.premiumValue || 1}`
                    : null,
            ]
                .filter(Boolean)
                .join("\n\n"),
            inline: false,
        },

        // Section 3: Dates
        {
            name: "📆 Dates",
            value: [
                `**Account Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:F> (<t:${Math.floor(user.createdTimestamp / 1000)}:R>)`,
                `**Joined Server:** <t:${Math.floor(member.joinedTimestamp / 1000)}:F> (<t:${Math.floor(member.joinedTimestamp / 1000)}:R>)`,
                member.premiumSince
                    ? `**Boosting Since:** <t:${Math.floor(member.premiumSinceTimestamp / 1000)}:F> (<t:${Math.floor(member.premiumSinceTimestamp / 1000)}:R>)`
                    : null,
                member.communicationDisabledUntil
                    ? `**Timeout Until:** <t:${Math.floor(member.communicationDisabledUntil.getTime() / 1000)}:F> (<t:${Math.floor(member.communicationDisabledUntil.getTime() / 1000)}:R>)`
                    : null,
            ]
                .filter(Boolean)
                .join("\n"),
            inline: false,
        },
    ];

    // Section 4: Status (only if user has any presence data)
    if (Object.keys(presence).length > 0) {
        fields.push({
            name: "📊 Status",
            value: [
                `**Status:** ${formatStatus(presence.status || "offline")}`,
                `**Devices:**\n${clientStatusText}`,
                presence.activities?.find((a) => a.type === ActivityType.Custom)?.state
                    ? `**Custom Status:** ${presence.activities.find((a) => a.type === ActivityType.Custom).state}`
                    : null,
            ]
                .filter(Boolean)
                .join("\n"),
            inline: false,
        });
    }

    // Section 5: Activities (if any)
    const nonCustomActivities =
        presence.activities?.filter((a) => a.type !== ActivityType.Custom) || [];
    if (nonCustomActivities.length > 0) {
        fields.push({
            name: "🎯 Activities",
            value: nonCustomActivities.map(getActivityName).join("\n\n"),
            inline: false,
        });
    }

    // Section 6: Key Permissions
    fields.push({
        name: "🛠️ Key Permissions",
        value: getKeyPermissions(member),
        inline: false,
    });

    // Section 7: Roles
    const rolesText = getRolesText(member);
    fields.push({
        name: `📋 Roles [${member.roles.cache.size - 1}]`,
        value: rolesText.text,
        inline: false,
    });

    if (rolesText.continuation) {
        fields.push({
            name: "📋 Roles (continued)",
            value: rolesText.continuation,
            inline: false,
        });
    }

    return fields;
}

// Helper function for roles text
function getRolesText(member) {
    if (member.roles.cache.size <= 1) return { text: "None" };

    const roles = member.roles.cache
        .filter((role) => role.id !== member.guild.id)
        .sort((a, b) => b.position - a.position);

    const formatRole = (role) =>
        `${role.toString()}${role.color ? ` \`#${role.color.toString(16).toUpperCase()}\`` : ""}`;

    if (roles.size <= 15) {
        return {
            text: roles.map(formatRole).join(", ") || "None",
        };
    }

    // Split roles into two parts if there are too many
    const firstPart = roles.first(10).map(formatRole).join(", ");
    const secondPart = Array.from(roles.values()).slice(10, 20).map(formatRole).join(", ");

    return {
        text: `${firstPart}\n*...and ${roles.size - 10} more roles*`,
        continuation:
            roles.size > 20 ? `${secondPart}\n*...and ${roles.size - 20} more roles*` : secondPart,
    };
}

module.exports = {
    description_full:
        "Shows detailed information about a user, including their profile, status, activities, roles, permissions and more.",
    usage: "/user_info [target]",
    examples: ["/user_info", "/user_info @user"],

    data: new SlashCommandBuilder()
        .setName("user_info")
        .setDescription("Displays detailed information about a user.")
        .addUserOption((option) =>
            option
                .setName("target")
                .setDescription("The user to get information about")
                .setRequired(false),
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply();
            const user = interaction.options.getUser("target") || interaction.user;

            try {
                // Try to get from cache first, then fetch if needed
                let member = interaction.guild.members.cache.get(user.id);
                if (!member) {
                    member = await interaction.guild.members.fetch(user.id);
                }

                const fetchedUser = await user.fetch();
                const embed = new EmbedBuilder()
                    .setTitle(`User Information: ${member.displayName}`)
                    .setThumbnail(member.displayAvatarURL({ dynamic: true, size: 256 }))
                    .setColor(member.displayColor || "#000000");

                // Add banner if available
                if (fetchedUser.banner) {
                    embed.setImage(fetchedUser.bannerURL({ dynamic: true, size: 512 }));
                }

                // Add all information fields
                embed.addFields(generateUserFields(user, member, fetchedUser));

                // Add footer
                embed
                    .setFooter({
                        text: `Requested by ${interaction.user.tag} | ID: ${user.id}`,
                        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                    })
                    .setTimestamp();

                // Create buttons for additional actions
                const row = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel("Avatar")
                        .setStyle(ButtonStyle.Link)
                        .setURL(user.displayAvatarURL({ dynamic: true, size: 4096 })),
                    new ButtonBuilder()
                        .setLabel("Banner")
                        .setStyle(ButtonStyle.Link)
                        .setURL(fetchedUser.bannerURL({ dynamic: true, size: 4096 }))
                        .setDisabled(!fetchedUser.banner),
                    new ButtonBuilder()
                        .setLabel("Profile")
                        .setStyle(ButtonStyle.Link)
                        .setURL(`https://discord.com/users/${user.id}`),
                );

                await interaction.editReply({
                    embeds: [embed],
                    components: [row],
                });
            } catch (error) {
                if (error.code === 10007) {
                    await handleError(
                        interaction,
                        error,
                        "USER_NOT_FOUND",
                        "That user is not a member of this server.",
                    );
                } else if (error.code === 50001) {
                    await handleError(
                        interaction,
                        error,
                        "PERMISSION",
                        "I do not have permission to view member information.",
                    );
                } else {
                    await handleError(
                        interaction,
                        error,
                        "DATA_COLLECTION",
                        "Failed to collect some user information. Some details may be incomplete.",
                    );
                }
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while retrieving user information.",
            );
        }
    },
};
