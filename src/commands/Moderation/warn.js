const { PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");

const moderationLogs = require("./../../database/moderationLogs");
const { handleError } = require("../../utils/errorHandler");
const { success, dmNotice, actionColor } = require("../../utils/moderationEmbeds");

// createErrorEmbed no longer needed; standardized via errorEmbed()

// removed unused checkRolePermissions helper

module.exports = {
    description_full: "Issues a warning to a member and logs it in the moderation system.",
    usage: "/warn target:@user reason:\"warn reason\"",
    examples: [
        "/warn target:@user123 reason:\"First warning for spamming\"",
        "/warn target:@user123 reason:\"Second warning for inappropriate behavior\"",
    ],

    data: new SlashCommandBuilder()
        .setName("warn")
        .setDescription("Issue a warning to a user")
        .addUserOption((option) =>
            option.setName("target").setDescription("The user to warn").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason for the warning").setRequired(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),

    async execute(interaction) {
        try {
            const targetUser = interaction.options.getMember("target");
            const reason = interaction.options.getString("reason");

            // Validate target user
            if (!targetUser) {
                await handleError(
                    interaction,
                    new Error("Could not find the specified user in this server."),
                    "VALIDATION",
                );
                return;
            }

            // Check if target is server owner
            if (targetUser.id === interaction.guild.ownerId) {
                await handleError(
                    interaction,
                    new Error("You cannot warn the owner of the server."),
                    "PERMISSION",
                );
                return;
            }

            // Check role hierarchy
            const targetUserRolePosition = targetUser.roles.highest.position;
            const moderatorRolePosition = interaction.member.roles.highest.position;

            if (targetUserRolePosition >= moderatorRolePosition) {
                await handleError(
                    interaction,
                    new Error("You cannot warn someone with a higher or equal role than yourself."),
                    "PERMISSION",
                );
                return;
            }

            // Create and save warning log
            try {
                const logEntry = new moderationLogs({
                    action: "warn",
                    moderator: interaction.user.id,
                    user: targetUser.id,
                    reason: reason,
                });

                await logEntry.save();

                // Send success message
                const embed = success(interaction, {
                    title: "User Warned",
                    description: `Successfully warned ${targetUser} for reason: \`${reason}\``,
                    color: actionColor("warn"),
                });
                await interaction.reply({ embeds: [embed] });

                // Try to DM the warned user
                try {
                    const dm = dmNotice({
                        guildName: interaction.guild.name,
                        title: `Warning from ${interaction.guild.name}`,
                        description: `You have been warned for: \`${reason}\``,
                        color: actionColor("warn"),
                    });
                    await targetUser.send({ embeds: [dm] });
                } catch (dmError) {
                    // If DM fails, log it but don't treat it as a command failure
                    await handleError(
                        interaction,
                        dmError,
                        "COMMAND_EXECUTION",
                        "Could not send warning DM to user (they may have DMs disabled).",
                        false, // Don't show this error to the user
                    );
                }
            } catch (dbError) {
                await handleError(
                    interaction,
                    dbError,
                    "DATABASE",
                    "Failed to save warning in the moderation logs.",
                );
            }
        } catch (error) {
            if (error.code === 50013) {
                await handleError(
                    interaction,
                    error,
                    "PERMISSION",
                    "I do not have the required permissions to warn this user.",
                );
            } else {
                await handleError(
                    interaction,
                    error,
                    "COMMAND_EXECUTION",
                    "An error occurred while trying to warn the user.",
                );
            }
        }
    },
};
