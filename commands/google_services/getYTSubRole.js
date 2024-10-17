const { SlashCommandBuilder } = require('discord.js');
const OAuthCode = require('../../bot_utils/OauthCode');
const RoleSchema = require('../../bot_utils/roleStorage');
const { google } = require('googleapis');

const youtube = google.youtube({
    version: 'v3',
    auth: process.env.YOUTUBE_API_KEY,
});

module.exports = {
    description_full:
        'Verify your YouTube channel using Discord OAuth2, fetch your subscriber count, and automatically assign a role based on your subscriber count. If the user has multiple channels, the role will be assigned to the channel with the highest subscriber count.',
    usage: '/get_yt_sub_role',
    examples: ['/get_yt_sub_role'],
    category: 'google_services',
    data: new SlashCommandBuilder()
        .setName('get_yt_sub_role')
        .setDescription(
            'Automatically assign a role based on your channel with the highest subscriber count.',
        ),

    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        try {
            const interactionId = interaction.id; // Use the interaction ID as state
            const discordOAuthUrl = `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20connections&state=${interactionId}`;

            const embed = {
                color: 0x0099ff,
                title: '🎥 YouTube Subscriber Role Verification',
                description:
                    "Let's get you verified and assign you a special role based on your YouTube subscriber count!",
                fields: [
                    {
                        name: '📋 What to do:',
                        value: '1. Click the link below\n2. Authorize the app\n3. Connect your YouTube account\n4. Wait for confirmation',
                        inline: false,
                    },
                    {
                        name: '🔗 Authorization Link',
                        value: `[Click here to start the verification process](${discordOAuthUrl})`,
                        inline: false,
                    },
                ],
                footer: {
                    text: 'This process is safe and secure. We only access your public YouTube data.',
                },
            };

            await interaction.editReply({
                embeds: [embed],
                ephemeral: true,
            });

            const oauthData =
                await getAuthorizationDataFromMongoDB(interactionId);
            if (
                !oauthData.youtubeConnections ||
                oauthData.youtubeConnections.length === 0
            ) {
                const errorEmbed = {
                    color: 0xff0000,
                    title: '❌ No YouTube Connections Found',
                    description:
                        "We couldn't find any YouTube connections associated with your account.",
                    fields: [
                        {
                            name: '🔄 What to do next',
                            value: 'Please make sure you have connected your YouTube account to Discord and try again.',
                            inline: false,
                        },
                    ],
                    footer: {
                        text: 'If the problem persists, please contact a server administrator.',
                    },
                    timestamp: new Date(),
                };

                await interaction.followUp({
                    embeds: [errorEmbed],
                    ephemeral: true,
                });
                return;
            }

            // Fetch subscriber counts for all YouTube connections and find the one with the highest count
            const highestSubscriberData = await getHighestSubscriberCount(
                oauthData.youtubeConnections,
            );
            const { youtubeChannelId, subscriberCount } = highestSubscriberData;

            if (subscriberCount !== null) {
                const assignedRole = await assignSubscriberRole(
                    interaction.member,
                    subscriberCount,
                );
                const youtubeUrl = `https://www.youtube.com/channel/${youtubeChannelId}`;
                const embed = {
                    color: 0x0099ff,
                    title: '🎉 YouTube Channel Verified Successfully! 🎉',
                    description: `Great news! We've successfully verified your YouTube channel. Here's what you need to know:`,
                    fields: [
                        {
                            name: '🏆 Your New Role',
                            value: `You've been awarded the **${assignedRole}** role!`,
                            inline: false,
                        },
                        {
                            name: '👥 Your Subscriber Count',
                            value: `You have an impressive **${subscriberCount.toLocaleString()}** subscribers!`,
                            inline: false,
                        },
                        {
                            name: '🔗 Your Channel',
                            value: `[Click here to visit your channel](${youtubeUrl})`,
                            inline: false,
                        },
                    ],
                    footer: {
                        text: 'Thank you for verifying your YouTube channel with us!',
                    },
                    timestamp: new Date(),
                };
                await interaction.editReply({
                    embeds: [embed],
                    ephemeral: true,
                });
            } else {
                throw new Error('Failed to retrieve YouTube subscriber count.');
            }
        } catch (error) {
            console.log(error)
            const errorEmbed = {
                color: 0xff0000,
                title: '❌ Oops! Something went wrong',
                description:
                    'We encountered an error while processing your request.',
                fields: [
                    {
                        name: '📝 Error Details',
                        value: error.message,
                        inline: false,
                    },
                    {
                        name: '🔄 What to do next',
                        value: 'Please try again later or contact a server administrator if the problem persists.',
                        inline: false,
                    },
                ],
                footer: {
                    text: 'We apologize for the inconvenience.',
                },
                timestamp: new Date(),
            };

            await interaction.editReply({
                embeds: [errorEmbed],
                ephemeral: true,
            });
        }
    },
};

// Function to poll MongoDB for the OAuth2 code and YouTube connections
async function getAuthorizationDataFromMongoDB(interactionId) {
    const fetchTimeout = 60000; // 60 seconds timeout
    const pollingInterval = 3000; // Poll every 3 seconds

    let elapsedTime = 0;
    while (elapsedTime < fetchTimeout) {
        const oauthRecord = await OAuthCode.findOne({ interactionId });

        if (oauthRecord) {
            return {
                code: oauthRecord.code,
                youtubeConnections: oauthRecord.youtubeConnections || [],
            };
        }

        await new Promise((resolve) => setTimeout(resolve, pollingInterval));
        elapsedTime += pollingInterval;
    }

    throw new Error('Timeout waiting for authorization.');
}

async function getHighestSubscriberCount(youtubeConnections) {
    let highestSubscriberData = {
        youtubeChannelId: null,
        subscriberCount: 0,
    };

    for (const connection of youtubeConnections) {
        const subscriberCount = await getYouTubeSubscriberCount(connection.id);
        if (subscriberCount > highestSubscriberData.subscriberCount) {
            highestSubscriberData = {
                youtubeChannelId: connection.id,
                subscriberCount,
            };
        }
    }

    return highestSubscriberData;
}

async function getYouTubeSubscriberCount(youtubeChannelId) {
    try {
        const response = await youtube.channels.list({
            part: 'statistics',
            id: youtubeChannelId,
        });

        const channelData = response.data.items[0];
        return parseInt(channelData.statistics.subscriberCount, 10);
    } catch (error) {
        console.error('YouTube API error:', error.message);
        return null;
    }
}

async function assignSubscriberRole(member, subscriberCount) {
    let roleName;

    const roleRanges = [
        { max: 100, name: 'Less than 100 Subs' },
        { max: 500, name: '100 - 499 Subs' },
        { max: 1000, name: '500 - 999 Subs' },
        { max: 5000, name: '1K - 4.9K Subs' },
        { max: 10000, name: '5K - 9.9K Subs' },
        { max: 50000, name: '10K - 49.9K Subs' },
        { max: 100000, name: '50K - 99.9K Subs' },
        { max: 500000, name: '100K - 499.9K Subs' },
        { max: 1000000, name: '500K - 999.9K Subs' },
        { max: Infinity, name: '1M+ Subs' },
    ];

    roleName = roleRanges.find((range) => subscriberCount < range.max).name;

    try {
        const subscriberRoleData = await RoleSchema.findOne({ roleName });
        if (!subscriberRoleData)
            throw new Error(`Role "${roleName}" not found in the database.`);

        const role = member.guild.roles.cache.get(subscriberRoleData.roleID);
        if (!role)
            throw new Error(`Role "${roleName}" not found in the guild.`);

        await member.roles.add(role);
        return roleName;
    } catch (error) {
        console.error('Failed to assign role:', error.message);
        throw new Error(`Failed to assign subscriber role: ${error.message}`);
    }
}
