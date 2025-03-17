const {
    SlashCommandBuilder,
    MessageFlags,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits,
} = require("discord.js");
const cc = require("../../../database/customCommands");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("custom_edit")
        .setDescription("Edits a custom command")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name of the command to edit")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option
                .setName("new_message")
                .setDescription("The new response message")
                .setRequired(true),
        )
        .addStringOption((option) =>
            option.setName("new_alias").setDescription("The new alternate name").setRequired(false),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),
    category: "utility",
    description_full: "Edits an existing custom command in the bot's database.",
    usage: "/custom_edit <name:command_name_or_alias> <new_message:updated_response> [new_alias:new_alternate_name]",
    examples: [
        "/custom_edit name:hello new_message:Hello, world!",
        "/custom_edit name:greet new_message:Welcome! new_alias:welcome",
    ],
    /**
     * Executes the custom command edit interaction.
     *
     * @param {Object} interaction - The interaction object from Discord.
     * @param {Object} interaction.options - The options provided with the interaction.
     * @param {Function} interaction.options.getString - Function to get a string option by name.
     * @param {Function} interaction.reply - Function to edit the reply to the interaction.
     * @param {Function} interaction.awaitMessageComponent - Function to await a message component interaction.
     * @param {Object} interaction.user - The user who initiated the interaction.
     * @param {string} interaction.user.id - The ID of the user who initiated the interaction.
     *
     * @returns {Promise<void>} - A promise that resolves when the interaction is complete.
     */
    async execute(interaction) {
        try {
            const name = interaction.options.getString("name");
            const newMessage = interaction.options.getString("new_message");
            const newAlias = interaction.options.getString("new_alias");

            // Validate inputs
            if (newMessage.length < 1 || newMessage.length > 2000) {
                await handleError(
                    interaction,
                    new Error("Invalid message length"),
                    "VALIDATION",
                    "Message must be between 1 and 2000 characters long.",
                );
                return;
            }

            if (newAlias) {
                if (!/^[a-zA-Z0-9_-]+$/.test(newAlias)) {
                    await handleError(
                        interaction,
                        new Error("Invalid alias format"),
                        "VALIDATION",
                        "Alias can only contain letters, numbers, underscores, and hyphens.",
                    );
                    return;
                }

                if (newAlias.length < 2 || newAlias.length > 32) {
                    await handleError(
                        interaction,
                        new Error("Invalid alias length"),
                        "VALIDATION",
                        "Alias must be between 2 and 32 characters long.",
                    );
                    return;
                }
            }

            // Find the command
            let customCommand = await cc.findOne({ name: name.toLowerCase() });

            if (!customCommand) {
                customCommand = await cc.findOne({ alias_name: name.toLowerCase() });
            }

            if (!customCommand) {
                await handleError(
                    interaction,
                    new Error("Command not found"),
                    "VALIDATION",
                    `Custom command or alias "${name}" not found!`,
                );
                return;
            }

            // Check if new alias already exists (if provided)
            if (newAlias) {
                const existingAlias = await cc.findOne({
                    $and: [
                        { _id: { $ne: customCommand._id } },
                        {
                            $or: [
                                { name: newAlias.toLowerCase() },
                                { alias_name: newAlias.toLowerCase() },
                            ],
                        },
                    ],
                });

                if (existingAlias) {
                    await handleError(
                        interaction,
                        new Error("Alias already exists"),
                        "VALIDATION",
                        `A command or alias with the name "${newAlias}" already exists.`,
                    );
                    return;
                }
            }

            const isAlias = customCommand.name !== name;
            const confirmMessage = isAlias
                ? `The name you provided is an alias. The main command name is "${customCommand.name}". Do you want to edit this command?`
                : `Are you sure you want to edit the custom command "${name}"?`;

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId("edit_confirm")
                    .setLabel("Yes")
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId("edit_cancel")
                    .setLabel("No")
                    .setStyle(ButtonStyle.Danger),
            );

            const confirmationResponse = await interaction.reply({
                content: confirmMessage,
                components: [row],
                flags: MessageFlags.Ephemeral,
            });

            try {
                const confirmation = await confirmationResponse.awaitMessageComponent({
                    filter: (i) => i.user.id === interaction.user.id,
                    time: 15000,
                });

                if (confirmation.customId === "edit_confirm") {
                    try {
                        customCommand.message = newMessage;
                        if (newAlias) {
                            customCommand.alias_name = newAlias.toLowerCase();
                        }
                        await customCommand.save();

                        await confirmation.update({
                            content: `Custom command "${customCommand.name}" edited successfully!${newAlias ? ` New alias: ${newAlias}` : ""}`,
                            components: [],
                        });
                    } catch (error) {
                        if (error.code === 11000) {
                            await handleError(
                                interaction,
                                error,
                                "DATABASE",
                                "A command with this alias already exists.",
                            );
                        } else {
                            await handleError(
                                interaction,
                                error,
                                "DATABASE",
                                "Failed to save the edited command.",
                            );
                        }
                    }
                } else {
                    await confirmation.update({
                        content: "Command edit cancelled.",
                        components: [],
                    });
                }
            } catch (error) {
                if (error.name === "InteractionCollectorError") {
                    await interaction.editReply({
                        content: "Command edit timed out.",
                        components: [],
                    });
                } else {
                    await handleError(
                        interaction,
                        error,
                        "COMMAND_EXECUTION",
                        "An error occurred while processing the confirmation.",
                    );
                }
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while editing the custom command.",
            );
        }
    },
};
