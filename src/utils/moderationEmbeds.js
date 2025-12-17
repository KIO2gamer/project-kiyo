const { EmbedBuilder } = require("discord.js");

const COLORS = {
    success: 0x2ecc71, // green
    info: 0x3498db, // blue
    warn: 0xf1c40f, // yellow
    kick: 0xe67e22, // orange
    ban: 0xe74c3c, // red
    unban: 0x1abc9c, // teal
    timeout: 0x9b59b6, // purple
    lock: 0x95a5a6, // gray
    unlock: 0x2ecc71, // green
    error: 0xe74c3c, // red
};

function base(interaction) {
    const embed = new EmbedBuilder().setTimestamp();
    if (interaction?.user) {
        embed.setFooter({
            text: `By ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL?.() || undefined,
        });
    }
    return embed;
}

function success(interaction, { title, description, color = COLORS.success, fields = [] }) {
    return base(interaction)
        .setTitle(title)
        .setDescription(description)
        .setColor(color)
        .addFields(fields);
}

function error(interaction, { title = "Error", description, color = COLORS.error }) {
    return base(interaction).setTitle(title).setDescription(description).setColor(color);
}

function dmNotice({ guildName, title, description, color = COLORS.info }) {
    return new EmbedBuilder()
        .setTitle(title || `Notice from ${guildName}`)
        .setDescription(description)
        .setColor(color)
        .setTimestamp();
}

function actionColor(action) {
    switch ((action || "").toLowerCase()) {
        case "warn":
            return COLORS.warn;
        case "kick":
            return COLORS.kick;
        case "ban":
            return COLORS.ban;
        case "unban":
            return COLORS.unban;
        case "timeout":
            return COLORS.timeout;
        case "lock":
            return COLORS.lock;
        case "unlock":
            return COLORS.unlock;
        case "purge":
            return COLORS.info;
        default:
            return COLORS.info;
    }
}

module.exports = {
    COLORS,
    base,
    success,
    error,
    dmNotice,
    actionColor,
};
