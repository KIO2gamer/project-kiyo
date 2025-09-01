const { SlashCommandBuilder, MessageFlags } = require("discord.js");

const moderationLogs = require("./../../database/moderationLogs");
const { parseRange } = require("../../utils/rangeParser");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    description_full: "Edits the reason for a specific log entry or a range of log entries.",
    usage: "/edit_reason reason:\"new reason\" [lognumber] [logrange]",
    examples: [
        "/edit_reason reason:\"Spamming\" lognumber:5",
        "/edit_reason reason:\"Inappropriate behavior\" logrange:10-15",
    ],

    data: new SlashCommandBuilder()
        .setName("edit_reason")
        .setDescription("Edit the reason for a specific log entry / a range of log entries.")
        .addStringOption((option) =>
            option
                .setName("reason")
                .setDescription("The new reason for the log entry or entries")
                .setRequired(true),
        )
        .addIntegerOption((option) =>
            option.setName("lognumber").setDescription("The log number to edit").setRequired(false),
        )
        .addStringOption((option) =>
            option
                .setName("logrange")
                .setDescription("The range of log numbers to edit (e.g., 1-5)")
                .setRequired(false),
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const logNumber = interaction.options.getInteger("lognumber");
            const logRange = interaction.options.getString("logrange");
            const newReason = interaction.options.getString("reason");

            if (!logNumber && !logRange) {
                return handleError(
                    interaction,
                    new Error("Please provide either a log number or a range of log numbers to edit."),
                    "VALIDATION"
                );
            }

            if (logNumber) {
                const log = await moderationLogs.findOne({
                    logNumber: logNumber,
                });

                if (log) {
                    log.reason = newReason;
                    await log.save();
                    await interaction.editReply(
                        `Successfully updated reason for log #${logNumber} to: ${newReason}`,
                    );
                } else {
                    return handleError(
                        interaction,
                        new Error(`No log found with log number ${logNumber}.`),
                        "VALIDATION"
                    );
                }
            } else if (logRange) {
                const range = parseRange(logRange);

                if (!range) {
                    return handleError(
                        interaction,
                        new Error("Invalid log range. Please provide a valid range (e.g., 1-5)."),
                        "VALIDATION"
                    );
                }

                const { start, end } = range;

                const result = await moderationLogs.updateMany(
                    { logNumber: { $gte: start, $lte: end } },
                    { $set: { reason: newReason } },
                );

                if (result.matchedCount > 0) {
                    await interaction.editReply(
                        `Successfully updated reason for ${result.matchedCount} logs in the range #${start}-#${end} to: ${newReason}`,
                    );
                } else {
                    await interaction.editReply(`No logs found in the range #${start}-#${end}.`);
                }
            }
        } catch (error) {
            if (error.name === "MongoError" || error.name === "MongooseError") {
                handleError(
                    interaction,
                    error,
                    "DATABASE",
                    "Failed to update the log(s) in the database."
                );
            } else {
                handleError(
                    interaction,
                    error,
                    "COMMAND_EXECUTION",
                    "An error occurred while updating the log(s)."
                );
            }
        }
    },
};
