const { Events } = require("discord.js");
const { LevelSchema } = require("../database/xp_data");
const { GuildSettingsSchema } = require("../database/GuildSettingsSchema");
const Logger = require("../utils/logger");

// XP cooldown map to prevent spam
const xpCooldowns = new Map();
// Default cooldown in milliseconds (60 seconds)
const DEFAULT_COOLDOWN = 60000;
// Base XP range for each message
const XP_MIN = 15;
const XP_MAX = 25;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Ignore bot messages, DMs, and system messages
        if (message.author.bot || !message.guild || message.system) return;

        try {
            // Check if leveling is enabled for this guild
            const guildSettings = await GuildSettingsSchema.findOne({
                guildId: message.guild.id,
            });

            // If no settings or leveling disabled, return early
            if (!guildSettings || !guildSettings.leveling || !guildSettings.leveling.enabled)
                return;

            const userId = message.author.id;
            const guildId = message.guild.id;

            // Check if user is on cooldown
            const cooldownKey = `${userId}-${guildId}`;
            if (xpCooldowns.has(cooldownKey)) {
                const cooldownEnd = xpCooldowns.get(cooldownKey);
                if (Date.now() < cooldownEnd) return;
            }

            // Set cooldown
            xpCooldowns.set(cooldownKey, Date.now() + DEFAULT_COOLDOWN);

            // Calculate XP to award, applying guild's XP rate
            const xpRate = guildSettings.leveling.xpRate || 1.0;
            const xpToAdd = Math.floor(
                (Math.floor(Math.random() * (XP_MAX - XP_MIN + 1)) + XP_MIN) * xpRate,
            );

            // Get or create user level data
            let levelData = await LevelSchema.findOne({ userId, guildId });

            if (!levelData) {
                levelData = new LevelSchema({ userId, guildId });
            }

            const oldLevel = levelData.level;

            // Update XP and total XP
            levelData.xp += xpToAdd;
            levelData.totalXp += xpToAdd;
            levelData.lastMessageAt = new Date();

            // Check if user leveled up
            let leveledUp = false;
            while (levelData.xp >= calculateXpForNextLevel(levelData.level)) {
                levelData.level++;
                leveledUp = true;
            }

            await levelData.save();

            // Handle level up if applicable
            if (leveledUp) {
                await handleLevelUp(message, levelData, oldLevel, guildSettings);
            }
        } catch (error) {
            Logger.log("LEVELS", `Error in XP system: ${error.message}`, "error");
        }
    },
};

// Helper functions
function calculateXpForNextLevel(currentLevel) {
    // 100 XP for level 1, increasing by 50 each level
    return 100 + currentLevel * 50;
}

async function handleLevelUp(message, levelData, oldLevel, guildSettings) {
    try {
        const newLevel = levelData.level;
        const member = message.member;

        // Handle level up message based on guild settings
        const messageType = guildSettings.leveling.levelUpMessageType || "public";
        const levelUpMessage = `🎉 Congratulations ${member}! You've leveled up to **Level ${newLevel}**!`;

        switch (messageType) {
        case "public": {
            const channelId = guildSettings.leveling.levelUpChannelId;
            const channel = channelId
                ? message.guild.channels.cache.get(channelId)
                : message.channel;

            if (
                channel &&
                    channel.permissionsFor(message.guild.members.me).has("SendMessages")
            ) {
                await channel.send(levelUpMessage);
            }
            break;
        }

        case "dm":
            try {
                await member.send(
                    `🎉 You've leveled up to **Level ${newLevel}** in **${message.guild.name}**!`,
                );
            } catch (err) {
                // User might have DMs disabled, silently fail
            }
            break;

        case "disabled":
            // No message
            break;
        }

        // Check for role rewards
        if (guildSettings.leveling.roleRewards && guildSettings.leveling.roleRewards.length > 0) {
            // Get all role rewards for the current level
            const roleReward = guildSettings.leveling.roleRewards.find((r) => r.level === newLevel);

            if (roleReward) {
                const role = message.guild.roles.cache.get(roleReward.roleId);
                if (role && message.guild.members.me.permissions.has("ManageRoles")) {
                    try {
                        await member.roles.add(role, "Level reward");
                        // Notify in same channel as level up if public
                        if (messageType === "public") {
                            const channel = guildSettings.leveling.levelUpChannelId
                                ? message.guild.channels.cache.get(
                                    guildSettings.leveling.levelUpChannelId,
                                )
                                : message.channel;

                            if (channel) {
                                await channel.send(
                                    `🏅 ${member} has earned the **${role.name}** role for reaching Level ${newLevel}!`,
                                );
                            }
                        }
                    } catch (error) {
                        Logger.log(
                            "LEVELS",
                            `Error assigning role reward: ${error.message}`,
                            "error",
                        );
                    }
                }
            }
        }
    } catch (error) {
        Logger.log("LEVELS", `Error in level up handler: ${error.message}`, "error");
    }
}
