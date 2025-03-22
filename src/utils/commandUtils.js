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

module.exports = {
    getOptionTypeInfo,
    findRelatedCommands,
};
