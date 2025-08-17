const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const moderationLogs = require("./../../database/moderationLogs");
const ms = require("ms"); // Use ms library to parse duration strings

const { MessageFlags } = require("discord.js");

module.exports = {
    description_full: "Temporarily bans a member for the specified duration and reason.",
    usage: "/temp_ban target:@user duration:\"duration\" [reason:\"ban reason\"]",
    examples: [
        "/temp_ban target:@user123 duration:\"1d\"",
        "/temp_ban target:@user123 duration:\"2h\" reason:\"Spamming\"",
    ],

    data: new SlashCommandBuilder()
        .setName("temp_ban")
        .setDescription("Temporarily ban a member for a specified duration.")
        .addUserOption((option) =>
            option.setName("target").setDescription("The member to ban").setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("duration")
                .setDescription("The duration of the ban (e.g., 1h, 1d)")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason for banning"),
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers,
        ),

    async execute(interaction) {
        const targetUser = interaction.options.getMember("target");
        const duration = interaction.options.getString("duration");
        const reason = interaction.options.getString("reason") ?? "No reason provided";

        if (!(await this.checkTargetUser(interaction, targetUser))) return;
        if (!(await this.checkRolePositions(interaction, targetUser))) return;
        const durationMs = this.parseDuration(interaction, duration);
        if (!durationMs) return;

        await this.banUser({
            interaction,
            targetUser,
            duration,
            reason,
            durationMs,
        });
    },

    async checkTargetUser(interaction, targetUser) {
        if (!targetUser) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("ERROR")
                        .setDescription("User not found")
                        .setColor("Red")
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.displayAvatarURL()}`,
                        }),
                ],
            });
            return false;
        }

        if (targetUser.id === interaction.guild.ownerId) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("ERROR")
                        .setDescription("You cannot ban the owner of the server")
                        .setColor("Red")
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.displayAvatarURL()}`,
                        }),
                ],
            });
            return false;
        }

        return true;
    },

    async checkRolePositions(interaction, targetUser) {
        const targetUserRolePosition = targetUser.roles.highest.position;
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolePosition = interaction.guild.members.me.roles.highest.position;

        if (targetUserRolePosition >= requestUserRolePosition) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("ERROR")
                        .setDescription(
                            "You cannot ban someone with a higher or equal role than you",
                        )
                        .setColor("Red")
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.displayAvatarURL()}`,
                        }),
                ],
            });
            return false;
        }

        if (targetUserRolePosition >= botRolePosition) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("ERROR")
                        .setDescription(
                            "I cannot ban someone with a higher or equal role than myself",
                        )
                        .setColor("Red")
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.displayAvatarURL()}`,
                        }),
                ],
            });
            return false;
        }

        return true;
    },

    parseDuration(interaction, duration) {
        const durationMs = ms(duration);
        if (!durationMs) {
            interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("ERROR")
                        .setDescription(
                            "Invalid duration format. Please use formats like 1h, 1d, etc.",
                        )
                        .setColor("Red")
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.displayAvatarURL()}`,
                        }),
                ],
            });
            return null;
        }
        return durationMs;
    },

    async banUser({ interaction, targetUser, duration, reason, durationMs }) {
        try {
            const logEntry = new moderationLogs({
                action: "temp_ban",
                moderator: interaction.user.id,
                user: targetUser.id,
                reason: reason,
                duration: durationMs,
            });

            await logEntry.save();

            await targetUser.ban({ reason: reason });
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("TEMPORARY BAN")
                        .setDescription(
                            `<@${targetUser.id}> has been banned for ${duration} for: \`${reason}\``,
                        )
                        .setColor("Green")
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.displayAvatarURL()}`,
                        }),
                ],
            });

            setTimeout(async () => {
                try {
                    await interaction.guild.members.unban(targetUser.id);
                } catch (error) {
                    handleError(`Failed to unban ${targetUser.tag}: ${error}`);
                }
            }, durationMs);
        } catch (error) {
            handleError("Error banning user:", error);
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("ERROR")
                        .setDescription("An error occurred while trying to ban the user")
                        .setColor("Red")
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.displayAvatarURL()}`,
                        }),
                ],
            });
        }
    },
};
