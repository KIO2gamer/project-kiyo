const { Events, EmbedBuilder, PermissionsBitField } = require("discord.js");
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

module.exports = {
    name: Events.GuildBanAdd,
    async execute(ban) {
        try {
            const logChannel = await getLogChannel(ban.guild, "member_ban");
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor(0xff4757)
                .setTitle("Member Banned")
                .setThumbnail(ban.user.displayAvatarURL({ size: 256 }))
                .addFields({
                    name: "User",
                    value: `${ban.user.tag} (${ban.user.id})`,
                    inline: true,
                })
                .setTimestamp();

            if (ban.reason) {
                embed.addFields({ name: "Reason", value: ban.reason });
            }

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            await handleError(null, error, false);
        }
    },
};
