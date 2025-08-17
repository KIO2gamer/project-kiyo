/**
 * Consolidated validation utilities for common validation patterns
 */

/**
 * Validate Discord channel name format
 * @param {string} name - Channel name to validate
 * @returns {boolean} Whether the name is valid
 */
function isValidChannelName(name) {
    return /^[\w-]+$/.test(name);
}

/**
 * Validate Discord role name format
 * @param {string} name - Role name to validate
 * @returns {boolean} Whether the name is valid
 */
function isValidRoleName(name) {
    return name && name.length <= 100 && name.trim().length > 0;
}

/**
 * Validate number within range
 * @param {number} value - Value to validate
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (inclusive)
 * @returns {boolean} Whether the value is within range
 */
function isNumberInRange(value, min, max) {
    return typeof value === "number" && value >= min && value <= max;
}

/**
 * Validate string length
 * @param {string} str - String to validate
 * @param {number} minLength - Minimum length
 * @param {number} maxLength - Maximum length
 * @returns {boolean} Whether the string length is valid
 */
function isValidStringLength(str, minLength = 0, maxLength = Infinity) {
    return typeof str === "string" && str.length >= minLength && str.length <= maxLength;
}

/**
 * Validate URL format
 * @param {string} url - URL to validate
 * @returns {boolean} Whether the URL is valid
 */
function isValidUrl(url) {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}

/**
 * Validate Discord snowflake ID
 * @param {string} id - ID to validate
 * @returns {boolean} Whether the ID is a valid snowflake
 */
function isValidSnowflake(id) {
    return /^\d{17,19}$/.test(id);
}

/**
 * Validate hex color code
 * @param {string} color - Color code to validate
 * @returns {boolean} Whether the color code is valid
 */
function isValidHexColor(color) {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
}

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} Whether the email format is valid
 */
function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

/**
 * Validate that a user exists and is accessible
 * @param {User|GuildMember} user - User to validate
 * @param {Guild} guild - Guild context (optional)
 * @returns {Object} Validation result with success and error message
 */
function validateUser(user, guild = null) {
    if (!user) {
        return {
            success: false,
            error: "Could not find the specified user.",
        };
    }

    if (guild && !guild.members.cache.has(user.id)) {
        return {
            success: false,
            error: "The specified user is not a member of this server.",
        };
    }

    return { success: true };
}

/**
 * Validate that a channel exists and is accessible
 * @param {Channel} channel - Channel to validate
 * @param {string[]} allowedTypes - Allowed channel types (optional)
 * @returns {Object} Validation result with success and error message
 */
function validateChannel(channel, allowedTypes = []) {
    if (!channel) {
        return {
            success: false,
            error: "Could not find the specified channel.",
        };
    }

    if (allowedTypes.length > 0 && !allowedTypes.includes(channel.type)) {
        return {
            success: false,
            error: `This command only works with ${allowedTypes.join(", ")} channels.`,
        };
    }

    return { success: true };
}

/**
 * Validate command arguments against requirements
 * @param {Object} args - Arguments to validate
 * @param {Object} requirements - Validation requirements
 * @returns {Object} Validation result with success and error messages
 */
function validateCommandArgs(args, requirements) {
    const errors = [];

    for (const [key, requirement] of Object.entries(requirements)) {
        const value = args[key];

        // Check required fields
        if (requirement.required && (value === null || value === undefined)) {
            errors.push(`${key} is required`);
            continue;
        }

        // Skip validation if value is not provided and not required
        if (value === null || value === undefined) continue;

        // Type validation
        if (requirement.type && typeof value !== requirement.type) {
            errors.push(`${key} must be of type ${requirement.type}`);
            continue;
        }

        // String length validation
        if (requirement.minLength && value.length < requirement.minLength) {
            errors.push(`${key} must be at least ${requirement.minLength} characters long`);
        }
        if (requirement.maxLength && value.length > requirement.maxLength) {
            errors.push(`${key} must be no more than ${requirement.maxLength} characters long`);
        }

        // Number range validation
        if (requirement.min !== undefined && value < requirement.min) {
            errors.push(`${key} must be at least ${requirement.min}`);
        }
        if (requirement.max !== undefined && value > requirement.max) {
            errors.push(`${key} must be no more than ${requirement.max}`);
        }

        // Custom validation function
        if (requirement.validator && !requirement.validator(value)) {
            errors.push(requirement.message || `${key} is invalid`);
        }
    }

    return {
        success: errors.length === 0,
        errors,
    };
}

/**
 * Create a standardized validation error for Discord interactions
 * @param {string} message - Error message
 * @param {string} suggestion - Suggestion for fixing the error
 * @returns {Object} Error object for use with handleError
 */
function createValidationError(message, suggestion = null) {
    const error = new Error(message);
    error.category = "VALIDATION";
    error.suggestion = suggestion;
    return error;
}

module.exports = {
    // Basic validation functions
    isValidChannelName,
    isValidRoleName,
    isNumberInRange,
    isValidStringLength,
    isValidUrl,
    isValidSnowflake,
    isValidHexColor,
    isValidEmail,

    // Discord-specific validation
    validateUser,
    validateChannel,
    validateCommandArgs,

    // Error creation
    createValidationError,
};
