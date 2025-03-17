const {
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
} = require("discord.js");
const Logger = require("../../../logger").default;

// Error categories for better organization and handling
const ERROR_CATEGORIES = {
    COMMAND_EXECUTION: {
        emoji: "⚙️",
        color: "#FF6B6B",
        message: "Error executing command",
    },
    PERMISSION: {
        emoji: "🔒",
        color: "#4ECDC4",
        message: "Permission error",
    },
    VALIDATION: {
        emoji: "❌",
        color: "#FFE66D",
        message: "Validation error",
    },
    API: {
        emoji: "🌐",
        color: "#1A535C",
        message: "API error",
    },
    DATABASE: {
        emoji: "💾",
        color: "#FF6B6B",
        message: "Database error",
    },
    RATE_LIMIT: {
        emoji: "⏱️",
        color: "#F7B267",
        message: "Rate limit reached",
    },
    UNKNOWN: {
        emoji: "❓",
        color: "#5865F2",
        message: "Unknown error",
    },
};

// Common error patterns to identify error types
const ERROR_PATTERNS = [
    {
        pattern: /(Missing Permissions|Forbidden|lacks permission)/i,
        category: "PERMISSION",
        suggestion: "Check if the bot has the required permissions in the server settings.",
    },
    {
        pattern: /(Rate limit|Too many requests)/i,
        category: "RATE_LIMIT",
        suggestion: "Please wait a moment before trying again.",
    },
    {
        pattern: /(Invalid|Expected|ValidationError)/i,
        category: "VALIDATION",
        suggestion: "Please check the command usage and try again.",
    },
    {
        pattern: /(API|fetch|request|HTTP)/i,
        category: "API",
        suggestion: "There might be an issue with external services. Try again later.",
    },
    {
        pattern: /(Database|MongoDB|Mongoose|SQL)/i,
        category: "DATABASE",
        suggestion: "There was an issue with the database. Please try again later.",
    },
];

// Error statistics for monitoring
const errorStats = {
    total: 0,
    categories: {},
    recent: [],
    MAX_RECENT: 100,
};

/**
 * Identifies the category of an error based on its message and stack trace
 * @param {Error|string} error - The error to categorize
 * @returns {string} The error category
 */
function identifyErrorCategory(error) {
    const errorString =
        error instanceof Error ? `${error.message} ${error.stack || ""}` : String(error);

    for (const { pattern, category } of ERROR_PATTERNS) {
        if (pattern.test(errorString)) {
            return category;
        }
    }

    return "UNKNOWN";
}

/**
 * Gets a user-friendly suggestion for error recovery
 * @param {string} category - The error category
 * @param {Error|string} error - The original error
 * @returns {string} A suggestion for resolving the error
 */
function getErrorSuggestion(category, error) {
    const errorString = error instanceof Error ? error.message : String(error);

    // Find specific suggestion based on error patterns
    for (const { pattern, suggestion } of ERROR_PATTERNS) {
        if (pattern.test(errorString)) {
            return suggestion;
        }
    }

    // Default suggestions based on category
    const defaultSuggestions = {
        COMMAND_EXECUTION: "Try using the command again or check the command syntax.",
        PERMISSION: "Make sure you and the bot have the required permissions.",
        VALIDATION: "Please verify your input and try again.",
        API: "The service might be temporarily unavailable. Please try again later.",
        DATABASE: "There was a database issue. Please try again later.",
        RATE_LIMIT: "Please wait a moment before trying this command again.",
        UNKNOWN: "Please try the command again or contact support if the issue persists.",
    };

    return defaultSuggestions[category] || defaultSuggestions.UNKNOWN;
}

/**
 * Updates error statistics for monitoring
 * @param {string} category - The error category
 * @param {Error|string} error - The error that occurred
 */
function updateErrorStats(category, error) {
    errorStats.total++;
    errorStats.categories[category] = (errorStats.categories[category] || 0) + 1;

    const errorInfo = {
        timestamp: new Date(),
        category,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
    };

    errorStats.recent.unshift(errorInfo);
    if (errorStats.recent.length > errorStats.MAX_RECENT) {
        errorStats.recent.pop();
    }
}

/**
 * Creates a detailed error embed for users
 * @param {string} category - The error category
 * @param {string} errorMessage - The error message
 * @param {string} suggestion - The suggested solution
 * @returns {EmbedBuilder} The error embed
 */
function createErrorEmbed(category, errorMessage, suggestion) {
    const { emoji, color, message } = ERROR_CATEGORIES[category] || ERROR_CATEGORIES.UNKNOWN;

    return new EmbedBuilder()
        .setTitle(`${emoji} ${message}`)
        .setDescription("An error occurred while processing your command.")
        .addFields(
            { name: "💡 Suggestion", value: suggestion },
            {
                name: "🔍 Details",
                value:
                    process.env.NODE_ENV === "development"
                        ? `\`\`\`js\n${errorMessage.substring(0, 500)}\n\`\`\``
                        : "Click the button below to see technical details.",
            },
        )
        .setColor(color)
        .setTimestamp();
}

/**
 * Handles and logs errors that occur during command execution.
 * Can be used like console.error() or with Discord interaction objects.
 *
 * @param {...any} args - Error arguments, with optional Discord interaction object first
 */
async function handleError(...args) {
    const timestamp = new Date().toISOString();
    let interaction = null;
    let sent = null;
    let errorMessage = "";
    let commandContext = {};

    // Parse arguments and extract context
    for (const arg of args) {
        if (arg?.reply || arg?.editReply) {
            interaction = arg;
            // Extract command context if available
            if (interaction.commandName) {
                commandContext = {
                    command: interaction.commandName,
                    options: interaction.options?.data || [],
                    channel: interaction.channel?.name || "unknown",
                    guild: interaction.guild?.name || "DM",
                };
            }
        } else if (arg?.edit && !sent) {
            sent = arg;
        } else {
            if (arg instanceof Error) {
                errorMessage += arg.stack || arg.message;
            } else {
                errorMessage += String(arg) + " ";
            }
        }
    }

    // Identify error category and get suggestion
    const category = identifyErrorCategory(errorMessage);
    const suggestion = getErrorSuggestion(category, errorMessage);

    // Update error statistics
    updateErrorStats(category, errorMessage);

    // Log error with context
    Logger.log(
        "ERROR",
        {
            category,
            message: errorMessage,
            context: commandContext,
            timestamp,
        },
        "error",
    );

    // If no interaction, we're done after logging
    if (!interaction) return;

    // Create error embed and button
    const errorEmbed = createErrorEmbed(category, errorMessage, suggestion);
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId("show_full_error")
            .setLabel("Show Technical Details")
            .setStyle(ButtonStyle.Secondary),
    );

    try {
        // Send or edit the error message
        const response = sent
            ? await sent.edit({ embeds: [errorEmbed], components: [row] })
            : await (interaction.replied || interaction.deferred
                  ? interaction.editReply({
                        embeds: [errorEmbed],
                        components: [row],
                        flags: MessageFlags.Ephemeral,
                    })
                  : interaction.reply({
                        embeds: [errorEmbed],
                        components: [row],
                        flags: MessageFlags.Ephemeral,
                    }));

        // Set up button collector
        const collector = response.createMessageComponentCollector({
            time: 60000,
            filter: (i) => i.user.id === interaction.user.id,
        });

        collector.on("collect", async (i) => {
            if (i.customId === "show_full_error") {
                const detailsEmbed = new EmbedBuilder()
                    .setTitle("🔍 Technical Details")
                    .setDescription(`\`\`\`js\n${errorMessage.substring(0, 1900)}\n\`\`\``)
                    .setColor(ERROR_CATEGORIES[category].color)
                    .setTimestamp();

                await i.update({ embeds: [detailsEmbed], components: [] });
            }
        });

        collector.on("end", async () => {
            try {
                await response.edit({ components: [] });
            } catch (err) {
                // Ignore edit errors after collector ends
            }
        });
    } catch (sendError) {
        Logger.log(
            "ERROR",
            {
                category: "UNKNOWN",
                message: "Failed to send error message",
                error: sendError,
                originalError: errorMessage,
                context: commandContext,
                timestamp,
            },
            "error",
        );
    }
}

/**
 * Get error statistics for monitoring
 * @returns {Object} Error statistics
 */
function getErrorStats() {
    return {
        total: errorStats.total,
        categories: { ...errorStats.categories },
        recent: [...errorStats.recent],
    };
}

module.exports = {
    handleError,
    getErrorStats,
    ERROR_CATEGORIES,
};
