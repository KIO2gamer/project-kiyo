const { MessageFlags, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");
const { success, error: errorEmbed } = require("../../utils/moderationEmbeds");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    description_full:
        "Deletes a specified number of messages from the channel. Messages must be less than 14 days old.",
    usage: "/purge amount:number [user:@user]",
    examples: ["/purge amount:10", "/purge amount:50 user:@user123"],

    data: new SlashCommandBuilder()
        .setName("purge")
        .setDescription("Delete multiple messages from the channel")
        .addIntegerOption((option) =>
            option
                .setName("amount")
                .setDescription("Number of messages to delete (1-100)")
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100),
        )
        .addUserOption((option) =>
            option
                .setName("user")
                .setDescription("Only delete messages from this user")
                .setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });

            const amount = interaction.options.getInteger("amount");
            const user = interaction.options.getUser("user");

            // Validate amount
            if (amount < 1 || amount > 100) {
                const embed = errorEmbed(interaction, { title: "Invalid Amount", description: "Please specify a number between 1 and 100." });
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // Fetch messages
            const messages = await interaction.channel.messages.fetch({
                limit: amount + 1, // +1 to account for the command message
            });

            // Filter messages if user specified
            let messagesToDelete = messages;
            if (user) {
                messagesToDelete = messages.filter((msg) => msg.author.id === user.id);

                if (messagesToDelete.size === 0) {
                    const embed = errorEmbed(interaction, { title: "No Messages", description: `No messages found from user ${user.tag} in the last ${amount} messages.` });
                    await interaction.editReply({ embeds: [embed] });
                    return;
                }
            }

            // Check message age
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const validMessages = messagesToDelete.filter(
                (msg) => msg.createdTimestamp > twoWeeksAgo,
            );

            if (validMessages.size === 0) {
                const embed = errorEmbed(interaction, { title: "Too Old", description: "No messages found that are less than 14 days old." });
                await interaction.editReply({ embeds: [embed] });
                return;
            }

            // Delete messages
            try {
                const deleted = await interaction.channel.bulkDelete(validMessages, true);

                // Create success embed
                const successEmbed = success(interaction, {
                    title: "Messages Purged",
                    description: user
                        ? `Successfully deleted ${deleted.size} message(s) from ${user.tag}`
                        : `Successfully deleted ${deleted.size} message(s)`,
                });

                // Add warning if some messages were too old
                if (validMessages.size < messagesToDelete.size) {
                    successEmbed.addFields({
                        name: "⚠️ Note",
                        value: `${messagesToDelete.size - validMessages.size} message(s) were not deleted because they were older than 14 days.`,
                    });
                }

                await interaction.editReply({ embeds: [successEmbed] });
            } catch (deleteError) {
                if (deleteError.code === 50034) {
                    const embed = errorEmbed(interaction, { title: "Too Old", description: "Cannot delete messages older than 14 days." });
                    await interaction.editReply({ embeds: [embed] });
                } else if (deleteError.code === 50013) {
                    const embed = errorEmbed(interaction, { title: "Permission Error", description: "I do not have permission to delete messages in this channel." });
                    await interaction.editReply({ embeds: [embed] });
                } else {
                    const embed = errorEmbed(interaction, { description: "An error occurred while trying to delete messages." });
                    await interaction.editReply({ embeds: [embed] });
                }
            }
        } catch (error) {
            handleError("Error purging messages:", error);
            if (error.code === 50013) {
                const embed = errorEmbed(interaction, { title: "Permission Error", description: "I do not have permission to manage messages in this channel." });
                await interaction.editReply({ embeds: [embed] });
            } else if (error.code === 50035) {
                const embed = errorEmbed(interaction, { title: "Invalid Amount", description: "Invalid number of messages specified. Please use a number between 1 and 100." });
                await interaction.editReply({ embeds: [embed] });
            } else {
                const embed = errorEmbed(interaction, { description: "An unexpected error occurred while processing the purge command." });
                await interaction.editReply({ embeds: [embed] });
            }
        }
    },
};
