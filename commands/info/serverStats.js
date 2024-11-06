const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const moment = require('moment');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('server_stats')
        .setDescription('Displays various statistics about this server.')
        .addStringOption((option) =>
            option
                .setName('timeframe')
                .setDescription('The timeframe to calculate stats for.')
                .setRequired(false)
                .addChoices(
                    { name: 'Last 24 Hours', value: '24h' },
                    { name: 'Last 7 Days', value: '7d' },
                    { name: 'Last 30 Days', value: '30d' },
                    { name: 'Last Month', value: '1M' },
                    { name: 'All Time', value: 'all' }
                )
        ),
    description_full:
        'Displays various statistics about this server, including member count, channel count, message activity, and more. You can specify a timeframe to view stats for a specific period.',
    category: 'info',
    usage: '/server_stats [timeframe]',
    examples: [
        '/server_stats',
        '/server_stats timeframe: Last 24 Hours',
        '/server_stats timeframe: Last 7 Days',
        '/server_stats timeframe: Last Month',
        '/server_stats timeframe: All Time',
    ],
    async execute(interaction) {
        const timeframe = interaction.options.getString('timeframe') || 'all';
        const guild = interaction.guild;
        const startDate = getStartDate(timeframe);

        try {
            const stats = await collectServerStats(guild, startDate);
            const embed = createStatsEmbed(guild, timeframe, stats);
            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error('Error executing server_stats:', error);
            await interaction.editReply(
                'An error occurred while fetching server stats.'
            );
        }
    },
};

function getStartDate(timeframe) {
    switch (timeframe) {
        case '24h':
            return moment().subtract(1, 'day').toDate();
        case '7d':
            return moment().subtract(7, 'days').toDate();
        case '30d':
            return moment().subtract(30, 'days').toDate();
        case '1M':
            return moment().subtract(1, 'month').toDate();
        default:
            return new Date(0);
    }
}

async function collectServerStats(guild, startDate) {
    const members = await guild.members.fetch();
    const channels = guild.channels.cache;

    const stats = {
        totalMembers: members.size,
        newMembers: members.filter((member) => member.joinedAt >= startDate)
            .size,
        textChannels: channels.filter((c) => c.isTextBased()).size,
        voiceChannels: channels.filter((c) => c.type === 'GUILD_VOICE').size,
        roles: guild.roles.cache.size,
        emojis: guild.emojis.cache.size,
        messagesSent: 0,
        reactionsGiven: 0,
    };

    const textChannels = channels.filter((channel) => channel.isTextBased());
    for (const channel of textChannels.values()) {
        let lastId;
        while (true) {
            const messages = await channel.messages.fetch({
                limit: 100,
                before: lastId,
            });
            if (messages.size === 0) break;

            const relevantMessages = messages.filter(
                (msg) => msg.createdAt >= startDate
            );
            stats.messagesSent += relevantMessages.size;
            stats.reactionsGiven += relevantMessages.reduce(
                (acc, msg) => acc + msg.reactions.cache.size,
                0
            );

            if (messages.size < 100) break;
            lastId = messages.last().id;
        }
    }

    return stats;
}

function createStatsEmbed(guild, timeframe, stats) {
    return new EmbedBuilder()
        .setTitle(`Server Stats for ${guild.name}`)
        .setDescription(
            `Statistics from ${timeframe === 'all' ? 'the server creation' : `the past ${timeframe}`}`
        )
        .addFields(
            { name: 'New Members', value: `${stats.newMembers}`, inline: true },
            {
                name: 'Total Members',
                value: `${stats.totalMembers}`,
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: 'Text Channels',
                value: `${stats.textChannels}`,
                inline: true,
            },
            {
                name: 'Voice Channels',
                value: `${stats.voiceChannels}`,
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true },
            { name: 'Roles', value: `${stats.roles}`, inline: true },
            { name: 'Emojis', value: `${stats.emojis}`, inline: true },
            { name: '\u200B', value: '\u200B', inline: true },
            {
                name: 'Messages Sent',
                value: `${stats.messagesSent}`,
                inline: true,
            },
            {
                name: 'Reactions Given',
                value: `${stats.reactionsGiven}`,
                inline: true,
            },
            { name: '\u200B', value: '\u200B', inline: true }
        )
        .setTimestamp();
}
