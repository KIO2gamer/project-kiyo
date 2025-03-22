const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");
const moderationLogs = require("./../../database/moderationLogs");
const { handleError } = require("../../utils/errorHandler");

const { MessageFlags } = require("discord.js");

module.exports = {
    description_full: "Bans a member from the server with the specified reason.",
    usage: '/ban target:@user [reason:"ban reason"]',
    examples: ["/ban target:@user123", '/ban target:@user123 reason:"Severe rule violation"'],

    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Ban a user from the server")
        .addUserOption((option) =>
            option.setName("target").setDescription("The user to ban").setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("reason").setDescription("The reason for banning").setRequired(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),

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

            // Check if user is bannable
            if (!targetUser.bannable) {
                await handleError(
                    interaction,
                    new Error("I do not have permission to ban this user."),
                    "PERMISSION",
                );
                return;
            }

            // Check if target is server owner
            if (targetUser.id === interaction.guild.ownerId) {
                await handleError(
                    interaction,
                    new Error("You cannot ban the owner of the server."),
                    "PERMISSION",
                );
                return;
            }

            // Check role hierarchy
            const targetUserRolePosition = targetUser.roles.highest.position;
            const botRolePosition = interaction.guild.members.me.roles.highest.position;
            const moderatorRolePosition = interaction.member.roles.highest.position;

            if (targetUserRolePosition >= moderatorRolePosition) {
                await handleError(
                    interaction,
                    new Error("You cannot ban someone with a higher or equal role than yourself."),
                    "PERMISSION",
                );
                return;
            }

            if (targetUserRolePosition >= botRolePosition) {
                await handleError(
                    interaction,
                    new Error("I cannot ban someone with a higher or equal role than myself."),
                    "PERMISSION",
                );
                return;
            }

            // Create moderation log entry
            const logEntry = new moderationLogs({
                action: "ban",
                moderator: interaction.user.id,
                user: targetUser.id,
                reason: reason,
            });

            // Save log and ban user
            await Promise.all([logEntry.save(), targetUser.ban({ reason: reason })]);

            // Send success message
            const successEmbed = new EmbedBuilder()
                .setTitle("User Banned")
                .setDescription(`Successfully banned ${targetUser} for reason: \`${reason}\``)
                .setColor("Red")
                .setFooter({
                    text: `Banned by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTimestamp();

            await interaction.reply({ embeds: [successEmbed] });
        } catch (error) {
            // Handle different types of errors
            if (error.code === 50013) {
                // Missing Permissions error code
                await handleError(
                    interaction,
                    error,
                    "PERMISSION",
                    "I do not have the required permissions to ban this user.",
                );
            } else if (error.code === "DATABASE_ERROR") {
                await handleError(interaction, error, "DATABASE", "Failed to save moderation log.");
            } else {
                await handleError(
                    interaction,
                    error,
                    "COMMAND_EXECUTION",
                    "An error occurred while trying to ban the user.",
                );
            }
        }
    },
};
