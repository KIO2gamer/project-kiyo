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
    name: Events.GuildRoleDelete,
    async execute(role) {
        try {
            const logChannel = await getLogChannel(role.guild, "role_delete");
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor(0xe1b12c)
                .setTitle("Role Deleted")
                .addFields(
                    { name: "Name", value: `${role.name}`, inline: true },
                    { name: "ID", value: role.id, inline: true },
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            await handleError(null, error, false);
        }
    },
};
