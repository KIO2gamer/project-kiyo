const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");

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
                await handleError(
                    interaction,
                    new Error("Please specify a number between 1 and 100."),
                    "VALIDATION",
                );
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
                    await handleError(
                        interaction,
                        new Error(
                            `No messages found from user ${user.tag} in the last ${amount} messages.`,
                        ),
                        "VALIDATION",
                    );
                    return;
                }
            }

            // Check message age
            const twoWeeksAgo = Date.now() - 14 * 24 * 60 * 60 * 1000;
            const validMessages = messagesToDelete.filter(
                (msg) => msg.createdTimestamp > twoWeeksAgo,
            );

            if (validMessages.size === 0) {
                await handleError(
                    interaction,
                    new Error("No messages found that are less than 14 days old."),
                    "VALIDATION",
                );
                return;
            }

            // Delete messages
            try {
                const deleted = await interaction.channel.bulkDelete(validMessages, true);

                // Create success embed
                const successEmbed = new EmbedBuilder()
                    .setTitle("Messages Purged")
                    .setDescription(
                        user
                            ? `Successfully deleted ${deleted.size} message(s) from ${user.tag}`
                            : `Successfully deleted ${deleted.size} message(s)`,
                    )
                    .setColor("Green")
                    .setFooter({
                        text: `Purged by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    })
                    .setTimestamp();

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
                    await handleError(
                        interaction,
                        deleteError,
                        "VALIDATION",
                        "Cannot delete messages older than 14 days.",
                    );
                } else if (deleteError.code === 50013) {
                    await handleError(
                        interaction,
                        deleteError,
                        "PERMISSION",
                        "I do not have permission to delete messages in this channel.",
                    );
                } else {
                    await handleError(
                        interaction,
                        deleteError,
                        "COMMAND_EXECUTION",
                        "An error occurred while trying to delete messages.",
                    );
                }
            }
        } catch (error) {
            if (error.code === 50013) {
                await handleError(
                    interaction,
                    error,
                    "PERMISSION",
                    "I do not have permission to manage messages in this channel.",
                );
            } else if (error.code === 50035) {
                await handleError(
                    interaction,
                    error,
                    "VALIDATION",
                    "Invalid number of messages specified. Please use a number between 1 and 100.",
                );
            } else {
                await handleError(
                    interaction,
                    error,
                    "COMMAND_EXECUTION",
                    "An unexpected error occurred while processing the purge command.",
                );
            }
        }
    },
};
