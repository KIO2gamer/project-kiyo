const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const cc = require("./../../database/customCommands");
const { handleError } = require("../../utils/errorHandler");

const { MessageFlags } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("custom_preview")
        .setDescription("Preview a custom command")
        .addStringOption((option) =>
            option
                .setName("name")
                .setDescription("The name of the command to preview")
                .setRequired(true),
        ),
    category: "utility",
    description_full: "Previews a custom command stored in the bot's database.",
    usage: "/custom_preview <name_or_alias>",
    examples: ["/custom_preview hello", "/custom_preview greet"],
    /**
     * Executes the custom command preview interaction.
     *
     * @param {Object} interaction - The interaction object from Discord.
     * @param {Object} interaction.options - The options provided with the interaction.
     * @param {Function} interaction.options.getString - Function to get a string option by name.
     * @param {Function} interaction.reply - Function to edit the reply to the interaction.
     * @returns {Promise<void>} - A promise that resolves when the interaction is handled.
     */
    async execute(interaction) {
        try {
            await interaction.deferReply({ ephemeral: true });
            const commandNameOrAlias = interaction.options.getString("name")?.toLowerCase();

            if (!commandNameOrAlias) {
                await handleError(
                    interaction,
                    new Error("No command name provided"),
                    "VALIDATION",
                    "Please provide a command name to preview.",
                );
                return;
            }

            // Find command by name or alias
            let customCommand = await cc.findOne({ name: commandNameOrAlias });

            if (!customCommand) {
                customCommand = await cc.findOne({ alias_name: commandNameOrAlias });
            }

            if (!customCommand) {
                await handleError(
                    interaction,
                    new Error("Command not found"),
                    "VALIDATION",
                    `Custom command or alias "${commandNameOrAlias}" not found.`,
                );
                return;
            }

            // Format message preview
            const messagePreview =
                customCommand.message.length > 1000
                    ? customCommand.message.substring(0, 997) + "..."
                    : customCommand.message;

            // Create embed
            const embed = new EmbedBuilder()
                .setColor("#0099ff")
                .setTitle(`Custom Command: ${customCommand.name}`)
                .setDescription("Below is a preview of how this command will appear when used.")
                .addFields(
                    {
                        name: "📝 Command Information",
                        value: [
                            `**Name:** ${customCommand.name}`,
                            `**Alias:** ${customCommand.alias_name || "None"}`,
                            `**Message Length:** ${customCommand.message.length} characters`,
                        ].join("\n"),
                    },
                    {
                        name: "📤 Output Preview",
                        value: messagePreview,
                    },
                )
                .setFooter({
                    text: `Preview requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                })
                .setTimestamp();

            // Add usage examples
            const usageExamples = [`\`/custom_run name:${customCommand.name}\``];

            if (customCommand.alias_name) {
                usageExamples.push(`\`/custom_run name:${customCommand.alias_name}\``);
            }

            embed.addFields({
                name: "💻 Usage Examples",
                value: usageExamples.join("\n"),
            });

            await interaction.editReply({
                embeds: [embed],
                flags: MessageFlags.Ephemeral,
            });
        } catch (error) {
            if (error.name === "MongoError" || error.name === "MongooseError") {
                await handleError(
                    interaction,
                    error,
                    "DATABASE",
                    "Failed to fetch the custom command from the database.",
                );
            } else {
                await handleError(
                    interaction,
                    error,
                    "COMMAND_EXECUTION",
                    "An error occurred while previewing the custom command.",
                );
            }
        }
    },
};
