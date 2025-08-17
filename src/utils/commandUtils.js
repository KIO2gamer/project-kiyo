/**
 * Get detailed information about a Discord command option type
 *
 * @param {Object} option - The command option object
 * @returns {string|null} Formatted string with option type information
 */
function getOptionTypeInfo(option) {
    const typeMap = {
        3: "Type: String",
        4: "Type: Integer",
        5: "Type: Boolean",
        6: "Type: User",
        7: "Type: Channel",
        8: "Type: Role",
        9: "Type: Mentionable",
        10: "Type: Number",
        11: "Type: Attachment",
    };

    let info = typeMap[option.type];

    if (!info) return null;

    if (option.minValue !== undefined || option.maxValue !== undefined) {
        info += " (";
        if (option.minValue !== undefined) info += `Min: ${option.minValue}`;
        if (option.minValue !== undefined && option.maxValue !== undefined) info += ", ";
        if (option.maxValue !== undefined) info += `Max: ${option.maxValue}`;
        info += ")";
    }

    return info;
}

/**
 * Find related commands based on category matching
 *
 * @param {Object} command - The reference command object
 * @param {Array} allCommands - Array of all available commands
 * @returns {Array} Array of related command objects (limited to 3)
 */
function findRelatedCommands(command, allCommands) {
    return allCommands
        .filter((cmd) => cmd.category === command.category && cmd.data.name !== command.data.name)
        .slice(0, 3);
}

/**
 * Extract command options into a simple object
 * @param {CommandInteraction} interaction - Discord interaction
 * @returns {Object} Object with option names as keys and values as values
 */
function extractCommandOptions(interaction) {
    const options = {};

    if (!interaction.options) return options;

    // Get all option data
    const optionData = interaction.options.data || [];

    for (const option of optionData) {
        switch (option.type) {
        case 3: // STRING
            options[option.name] = interaction.options.getString(option.name);
            break;
        case 4: // INTEGER
            options[option.name] = interaction.options.getInteger(option.name);
            break;
        case 5: // BOOLEAN
            options[option.name] = interaction.options.getBoolean(option.name);
            break;
        case 6: // USER
            options[option.name] = interaction.options.getUser(option.name);
            break;
        case 7: // CHANNEL
            options[option.name] = interaction.options.getChannel(option.name);
            break;
        case 8: // ROLE
            options[option.name] = interaction.options.getRole(option.name);
            break;
        case 9: // MENTIONABLE
            options[option.name] = interaction.options.getMentionable(option.name);
            break;
        case 10: // NUMBER
            options[option.name] = interaction.options.getNumber(option.name);
            break;
        case 11: // ATTACHMENT
            options[option.name] = interaction.options.getAttachment(option.name);
            break;
        }
    }

    return options;
}

/**
 * Check if a command has a specific option
 * @param {Object} command - Command object
 * @param {string} optionName - Name of the option to check
 * @returns {boolean} Whether the command has the option
 */
function hasOption(command, optionName) {
    return command.data?.options?.some((option) => option.name === optionName) || false;
}

/**
 * Get command usage string for help display
 * @param {Object} command - Command object
 * @returns {string} Formatted usage string
 */
function getCommandUsage(command) {
    if (!command.data?.options) {
        return `/${command.data.name}`;
    }

    const options = command.data.options
        .map((option) => {
            const name = option.required ? `<${option.name}>` : `[${option.name}]`;
            return name;
        })
        .join(" ");

    return `/${command.data.name} ${options}`.trim();
}

/**
 * Create a standardized embed footer with command info
 * @param {CommandInteraction} interaction - Discord interaction
 * @param {Object} additionalInfo - Additional info to include
 * @returns {Object} Footer object for embeds
 */
function createCommandFooter(interaction, additionalInfo = {}) {
    const footer = {
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
    };

    if (additionalInfo.commandName) {
        footer.text += ` • ${additionalInfo.commandName}`;
    }

    if (additionalInfo.executionTime) {
        footer.text += ` • ${additionalInfo.executionTime}ms`;
    }

    return footer;
}

module.exports = {
    getOptionTypeInfo,
    findRelatedCommands,
    extractCommandOptions,
    hasOption,
    getCommandUsage,
    createCommandFooter,
};
