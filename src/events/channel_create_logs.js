const { Events, EmbedBuilder, PermissionsBitField, ChannelType } = require("discord.js");
const MsgLogsConfig = require("./../database/msgLogsConfig");
const { handleError } = require("./../utils/errorHandler");

async function getLogChannel(guild, eventKey) {
    const config = await MsgLogsConfig.findOne({ guildId: guild.id });
    const targetChannelId = config?.resolveChannelId?.(eventKey) || config?.channelId;
    if (!targetChannelId) return null;

    const logChannel = await guild.channels.fetch(targetChannelId).catch(() => null);
    if (!logChannel || !logChannel.isTextBased()) return null;

    const botMember = await guild.members.fetch(guild.client.user.id);
    const permissions = botMember.permissionsIn(logChannel);
    if (
        !permissions.has([
            PermissionsBitField.Flags.SendMessages,
            PermissionsBitField.Flags.EmbedLinks,
        ])
    ) {
        return null;
    }

    return logChannel;
}

function formatChannelType(type) {
    return Object.keys(ChannelType).find((key) => ChannelType[key] === type) || "unknown";
}

module.exports = {
    name: Events.ChannelCreate,
    async execute(channel) {
        try {
            if (!channel.guild) return;
            const logChannel = await getLogChannel(channel.guild, "channel_create");
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor(0x4cd137)
                .setTitle("Channel Created")
                .addFields(
                    { name: "Name", value: `${channel} (${channel.id})`, inline: true },
                    { name: "Type", value: formatChannelType(channel.type), inline: true },
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            await handleError(null, error, false);
        }
    },
};
