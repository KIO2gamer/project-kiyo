const { GuildSettingsSchema } = require("../database/GuildSettingsSchema");
const Logger = require("../utils/logger");

module.exports = {
    name: "guildMemberAdd",
    once: false,
    async execute(member) {
        try {
            // Get guild settings from database
            const settings = await GuildSettingsSchema.findOne({ guildId: member.guild.id });
            if (!settings || !settings.welcome || !settings.welcome.enabled) return;

            const { welcome } = settings;

            // Send channel welcome message if enabled
            if (welcome.channelId) {
                const channel = member.guild.channels.cache.get(welcome.channelId);
                if (channel) {
                    const welcomeMessage = welcome.message
                        .replace(/{user}/g, `<@${member.id}>`)
                        .replace(/{server}/g, member.guild.name)
                        .replace(/{username}/g, member.user.username)
                        .replace(/{membercount}/g, member.guild.memberCount);

                    await channel.send(welcomeMessage);
                }
            }

            // Send DM if enabled
            if (welcome.dmEnabled) {
                const dmMessage = welcome.dmMessage
                    .replace(/{user}/g, `<@${member.id}>`)
                    .replace(/{server}/g, member.guild.name)
                    .replace(/{username}/g, member.user.username)
                    .replace(/{membercount}/g, member.guild.memberCount);

                try {
                    await member.send(dmMessage);
                } catch (dmError) {
                    // User might have DMs disabled
                    Logger.log(
                        "WELCOME",
                        `Failed to send welcome DM to ${member.user.username}: ${dmError.message}`,
                        "warn",
                    );
                }
            }
        } catch (error) {
            Logger.log("WELCOME", `Error sending welcome message: ${error.message}`, "error");
        }
    },
};
