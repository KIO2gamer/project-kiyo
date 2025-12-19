const { Events } = require("discord.js");
const { checkAntiRaid } = require("./auto_moderation");
const Logger = require("../utils/logger");

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            // Check for potential raids
            await checkAntiRaid(member);
        } catch (error) {
            Logger.error(`Error in guild member add event: ${error.message}`);
            console.error(error);
        }
    },
};
