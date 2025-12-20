const { Events, EmbedBuilder } = require("discord.js");
const Logger = require("../utils/logger");

module.exports = {
    name: Events.GuildMemberAdd,
    /**
     * Sends a short onboarding DM with helpful commands and links.
     */
    async execute(member) {
        // Skip bots
        if (member.user.bot) return;

        const embed = new EmbedBuilder()
            .setColor(0x5865f2)
            .setTitle(`Welcome to ${member.guild.name}!`)
            .setDescription(
                "Here are a few quick steps to get started. If you don't receive DMs, please enable them temporarily or check the server channels.",
            )
            .addFields(
                { name: "Say hi", value: "Drop a hello in the general channel to get noticed." },
                {
                    name: "Commands",
                    value: "Use `/help` to see everything, or `/help category:info` to browse.",
                },
                {
                    name: "Profile",
                    value: "Try `/whois` on yourself to view your profile and roles.",
                },
                {
                    name: "Support",
                    value: "Use `/ticket open` or tag the support role if you need help.",
                },
                { name: "Rules", value: "Please review the rules and follow channel topics." },
            )
            .setTimestamp();

        try {
            await member.send({ embeds: [embed] });
        } catch (err) {
            // User might have DMs closed; avoid noise in logs
            await Logger.debug(
                `Could not DM onboarding info to ${member.user.tag} (${member.id}): ${err.message}`,
            );
        }
    },
};
