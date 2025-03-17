const { SlashCommandBuilder, MessageFlags } = require("discord.js");
const OAuthCode = require("../../../database/OauthCode.js");
const RoleSchema = require("../../../database/roleStorage.js");
const { google } = require("googleapis");
const crypto = require("crypto");
const { handleError } = require("../../utils/errorHandler.js");

const youtube = google.youtube({
    version: "v3",
    auth: process.env.YOUTUBE_API_KEY,
});

const ALGORITHM = "aes-256-cbc";

function encrypt(text, secretKey, iv) {
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey), iv);
    let encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
    return `${iv.toString("hex")}:${encrypted.toString("hex")}:${secretKey.toString("hex")}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("get_yt_sub_role")
        .setDescription("Assign a role based on your YouTube subscriber count."),
    description_full:
        "Verify your YouTube channel using Discord OAuth2 and assign a role based on your subscriber count.",
    usage: "/get_yt_sub_role",
    examples: ["/get_yt_sub_role"],
    category: "roles",

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const userId = interaction.user.id;
            const cooldownKey = `ytsubcooldown-${userId}`;
            const cooldown = await interaction.client.redis?.get(cooldownKey);

            if (cooldown) {
                const timeLeft = Math.ceil((parseInt(cooldown) - Date.now()) / 1000);
                throw new Error(`Please wait ${timeLeft} seconds before trying again.`);
            }

            const state = JSON.stringify({
                interactionId: interaction.id,
                guildId: interaction.guild.id,
                channelId: interaction.channel.id,
                userId: interaction.user.id,
            });

            const secretKey = crypto.randomBytes(32);
            const iv = crypto.randomBytes(16);
            const encryptedState = encrypt(state, secretKey, iv);
            const discordOAuthUrl = generateDiscordOAuthUrl(encryptedState);

            await interaction.editReply({
                embeds: [
                    createEmbed(
                        "🎥 YouTube Verification",
                        "Authorize your YouTube account to get a role based on your subscriber count.",
                        [
                            {
                                name: "Steps",
                                value: "1. Click the link below\n2. Authorize the app\n3. Wait for confirmation (up to 3 minutes)",
                                inline: false,
                            },
                            {
                                name: "⚠️ Important",
                                value: "Make sure you have connected your YouTube account to Discord in User Settings > Connections first!",
                                inline: false,
                            },
                            {
                                name: "🔗 Authorization Link",
                                value: `[Click here to authorize](${discordOAuthUrl})`,
                                inline: false,
                            },
                        ],
                        "Your verification link will expire in 3 minutes",
                    ),
                ],
            });

            await interaction.client.redis?.set(cooldownKey, Date.now() + 300000, "EX", 300);

            await interaction.followUp({
                content: "Waiting for verification to complete... This will update automatically.",
                flags: MessageFlags.Ephemeral,
            });

            const oauthData = await getAuthorizationDataFromMongoDB(interaction.id);
            if (!oauthData?.youtubeConnections?.length) {
                throw new Error("No YouTube connections found.");
            }

            const { youtubeChannelId, subscriberCount } = await getHighestSubscriberCount(
                oauthData.youtubeConnections,
            );
            if (subscriberCount === null) {
                throw new Error("Failed to retrieve subscriber count.");
            }

            const roleName = await assignSubscriberRole(interaction.member, subscriberCount);
            await interaction.editReply({
                embeds: [
                    createEmbed(
                        "🎉 Verification Complete!",
                        "You have been successfully verified and assigned a role.",
                        [
                            {
                                name: "🏆 Role Assigned",
                                value: roleName,
                                inline: false,
                            },
                            {
                                name: "👥 Subscriber Count",
                                value: subscriberCount.toLocaleString(),
                                inline: false,
                            },
                            {
                                name: "🔗 YouTube Channel",
                                value: `[View Channel](https://www.youtube.com/channel/${youtubeChannelId})`,
                                inline: false,
                            },
                        ],
                        "Thank you for verifying!",
                    ),
                ],
            });
        } catch (error) {
            handleError(error);
            await interaction.editReply({
                embeds: [
                    createEmbed("❌ Error", error.message, [], "Please try again later.", 0xff0000),
                ],
            });
        }
    },
};

function generateDiscordOAuthUrl(state) {
    return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20connections&state=${encodeURIComponent(state)}`;
}

function createEmbed(title, description, fields = [], footerText, color = 0x0099ff) {
    return {
        color,
        title,
        description,
        fields,
        footer: { text: footerText },
        timestamp: new Date(),
    };
}

async function getAuthorizationDataFromMongoDB(interactionId) {
    const timeout = 180000;
    const pollingInterval = 2000;
    let elapsed = 0;

    try {
        await OAuthCode.deleteOne({ interactionId });

        while (elapsed < timeout) {
            const oauthRecord = await OAuthCode.findOne({ interactionId });
            if (oauthRecord) {
                if (
                    !oauthRecord.youtubeConnections ||
                    oauthRecord.youtubeConnections.length === 0
                ) {
                    throw new Error("No YouTube connections found in authorization data.");
                }
                console.log(`OAuth data received for interaction ${interactionId}`);
                return oauthRecord;
            }

            await new Promise((resolve) => setTimeout(resolve, pollingInterval));
            elapsed += pollingInterval;

            if (elapsed % 30000 === 0) {
                console.log(
                    `Waiting for OAuth data: ${elapsed / 1000}s elapsed of ${timeout / 1000}s`,
                );
            }
        }

        throw new Error(
            "Authorization timeout. Please try again and complete the authorization within 3 minutes.",
        );
    } catch (error) {
        if (error.message.includes("timeout")) {
            throw error;
        } else {
            console.error("Error while checking for authorization data:", error);
            throw new Error("Failed to verify your YouTube account. Please try again later.");
        }
    }
}

async function getHighestSubscriberCount(youtubeConnections) {
    if (!youtubeConnections || youtubeConnections.length === 0) {
        throw new Error(
            "No YouTube connections found. Please connect your YouTube account to Discord first.",
        );
    }

    let highest = { youtubeChannelId: null, subscriberCount: 0 };
    let successfulChecks = 0;

    for (const connection of youtubeConnections) {
        try {
            if (!connection.id) {
                console.warn("YouTube connection missing ID");
                continue;
            }
            const count = await getYouTubeSubscriberCount(connection.id);
            if (count > highest.subscriberCount) {
                highest = {
                    youtubeChannelId: connection.id,
                    subscriberCount: count,
                };
            }
            successfulChecks++;
        } catch (error) {
            console.error("Error checking subscriber count for channel:", error);
        }
    }

    if (successfulChecks === 0) {
        throw new Error("Could not retrieve subscriber counts for any of your YouTube channels.");
    }

    return highest;
}

async function getYouTubeSubscriberCount(channelId) {
    try {
        const response = await youtube.channels.list({
            part: "statistics",
            id: channelId,
        });

        if (!response.data || !response.data.items || response.data.items.length === 0) {
            console.warn(`No channel data found for ID: ${channelId}`);
            return 0;
        }

        const statistics = response.data.items[0].statistics;
        if (!statistics || statistics.hiddenSubscriberCount || !statistics.subscriberCount) {
            console.warn(`Hidden subscriber count for channel ID: ${channelId}`);
            return 0;
        }

        return parseInt(statistics.subscriberCount, 10);
    } catch (error) {
        console.error(`Failed to fetch subscriber count for ${channelId}:`, error);
        return 0;
    }
}

async function assignSubscriberRole(member, subscriberCount) {
    const ranges = [
        { max: 100, name: "Less than 100 Subs" },
        { max: 500, name: "100 - 499 Subs" },
        { max: 1000, name: "500 - 999 Subs" },
        { max: 5000, name: "1K - 4.9K Subs" },
        { max: 10000, name: "5K - 9.9K Subs" },
        { max: 50000, name: "10K - 49.9K Subs" },
        { max: 100000, name: "50K - 99.9K Subs" },
        { max: 500000, name: "100K - 499.9K Subs" },
        { max: 1000000, name: "500K - 999.9K Subs" },
        { max: Infinity, name: "1M+ Subs" },
    ];
    const roleName = ranges.find((range) => subscriberCount < range.max).name;
    const roleData = await RoleSchema.findOne({ roleName });
    if (!roleData) throw new Error(`Role "${roleName}" not found.`);
    await member.roles.add(roleData.roleID);
    return roleName;
}
