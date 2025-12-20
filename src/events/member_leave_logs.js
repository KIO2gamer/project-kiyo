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
    name: Events.GuildMemberRemove,
    async execute(member) {
        try {
            const logChannel = await getLogChannel(member.guild, "member_leave");
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor(0xffa502)
                .setTitle("Member Left")
                .setThumbnail(member.user.displayAvatarURL({ size: 256 }))
                .addFields(
                    { name: "User", value: `${member.user.tag} (${member.id})`, inline: true },
                    {
                        name: "Joined Server",
                        value: member.joinedTimestamp
                            ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:R>`
                            : "Unknown",
                        inline: true,
                    },
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            await handleError(null, error, false);
        }
    },
};
