/**
 * Comprehensive utility for categorizing, formatting, and analyzing Discord permissions
 */
const { PermissionsBitField } = require("discord.js");

// Define permission categories for better organization
const PERMISSION_CATEGORIES = {
    advanced: ["ADMINISTRATOR"],
    moderation: [
        "KICK_MEMBERS",
        "BAN_MEMBERS",
        "MANAGE_CHANNELS",
        "MANAGE_GUILD",
        "MANAGE_MESSAGES",
        "MANAGE_THREADS",
        "MODERATE_MEMBERS",
        "VIEW_AUDIT_LOG",
        "MANAGE_NICKNAMES",
        "MANAGE_ROLES",
        "MANAGE_WEBHOOKS",
        "MANAGE_EMOJIS_AND_STICKERS",
        "MANAGE_EVENTS",
    ],
    general: [
        "VIEW_CHANNEL",
        "CREATE_INSTANT_INVITE",
        "CHANGE_NICKNAME",
        "USE_EXTERNAL_EMOJIS",
        "USE_EXTERNAL_STICKERS",
        "USE_APPLICATION_COMMANDS",
    ],
    text: [
        "SEND_MESSAGES",
        "EMBED_LINKS",
        "ATTACH_FILES",
        "ADD_REACTIONS",
        "USE_EXTERNAL_EMOJIS",
        "MENTION_EVERYONE",
        "READ_MESSAGE_HISTORY",
        "SEND_TTS_MESSAGES",
        "SEND_MESSAGES_IN_THREADS",
        "CREATE_PUBLIC_THREADS",
        "CREATE_PRIVATE_THREADS",
        "USE_EXTERNAL_STICKERS",
    ],
    voice: [
        "CONNECT",
        "SPEAK",
        "STREAM",
        "USE_VAD",
        "PRIORITY_SPEAKER",
        "MUTE_MEMBERS",
        "DEAFEN_MEMBERS",
        "MOVE_MEMBERS",
    ],
};

// Icons for each category
const CATEGORY_ICONS = {
    advanced: "🔑",
    moderation: "🔨",
    general: "🔹",
    text: "💬",
    voice: "🔊",
    other: "⚙️",
};

// Human-readable descriptions for permissions
const PERMISSION_DESCRIPTIONS = {
    ADMINISTRATOR: "Full access to all commands and features",
    KICK_MEMBERS: "Remove members from the server",
    BAN_MEMBERS: "Permanently remove members from the server",
    MANAGE_CHANNELS: "Create, edit, and delete channels",
    MANAGE_GUILD: "Change server settings and features",
    MANAGE_MESSAGES: "Delete messages by other members",
    MANAGE_THREADS: "Archive, delete, and manage threads",
    MODERATE_MEMBERS: "Timeout members and manage server invites",
    VIEW_AUDIT_LOG: "View actions taken by other members",
    MANAGE_NICKNAMES: "Change nicknames of other members",
    MANAGE_ROLES: "Create and edit roles below their highest role",
    MANAGE_WEBHOOKS: "Create, edit, and delete webhooks",
    MANAGE_EMOJIS_AND_STICKERS: "Upload and manage custom emojis and stickers",
    MANAGE_EVENTS: "Create and manage server events",
    VIEW_CHANNEL: "See channels and read messages",
    CREATE_INSTANT_INVITE: "Create invites for others to join the server",
    CHANGE_NICKNAME: "Change their own nickname",
    USE_EXTERNAL_EMOJIS: "Use emojis from other servers",
    USE_EXTERNAL_STICKERS: "Use stickers from other servers",
    USE_APPLICATION_COMMANDS: "Use slash commands and other app commands",
    SEND_MESSAGES: "Send messages in text channels",
    EMBED_LINKS: "Links will show previews when posted",
    ATTACH_FILES: "Upload files and images",
    ADD_REACTIONS: "Add emoji reactions to messages",
    MENTION_EVERYONE: "Use @everyone and @here mentions",
    READ_MESSAGE_HISTORY: "View older messages",
    SEND_TTS_MESSAGES: "Send text-to-speech messages",
    SEND_MESSAGES_IN_THREADS: "Send messages in thread channels",
    CREATE_PUBLIC_THREADS: "Create threads that anyone can see",
    CREATE_PRIVATE_THREADS: "Create threads with limited access",
    CONNECT: "Join voice channels",
    SPEAK: "Talk in voice channels",
    STREAM: "Share video, screen, or Go Live",
    USE_VAD: "Use voice activity detection",
    PRIORITY_SPEAKER: "Reduce the volume of others when speaking",
    MUTE_MEMBERS: "Disable others from speaking in voice",
    DEAFEN_MEMBERS: "Disable others from hearing in voice",
    MOVE_MEMBERS: "Move members between voice channels",
};

/**
 * Format permissions into categorized groups
 * @param {PermissionsBitField|string[]} permissions - The permissions to format (either a BitField or array of permission strings)
 * @param {Object} options - Formatting options
 * @param {boolean} options.checkmark - Whether to add checkmark emojis (default: true)
 * @param {boolean} options.headers - Whether to include category headers (default: true)
 * @param {number} options.maxLength - Max length to truncate result to (default: 1024)
 * @returns {string} Formatted permissions string
 */
function formatCategorizedPermissions(permissions, options = {}) {
    // Set default options
    const { checkmark = true, headers = true, maxLength = 1024 } = options;

    // Convert permissions to array if it's a BitField
    const permsArray = Array.isArray(permissions)
        ? permissions
        : permissions.toArray
            ? permissions.toArray()
            : [];

    if (permsArray.length === 0) return "No permissions";

    // Check for Administrator which grants all permissions
    if (permsArray.includes("ADMINISTRATOR")) {
        return "🔑 **Administrator** - *Grants all permissions*";
    }

    // Categorize the permissions
    const categorized = {};
    const uncategorized = [];

    permsArray.forEach((perm) => {
        let placed = false;

        for (const [category, categoryPerms] of Object.entries(PERMISSION_CATEGORIES)) {
            if (categoryPerms.includes(perm)) {
                if (!categorized[category]) categorized[category] = [];
                categorized[category].push(perm);
                placed = true;
                break;
            }
        }

        if (!placed) uncategorized.push(perm);
    });

    // Format permissions within each category
    const formatPerm = (p) => {
        const formattedName = p.replace(/_/g, " ").toLowerCase();
        return checkmark ? `✅ ${formattedName}` : `• ${formattedName}`;
    };

    // Build the output
    const result = [];

    // Add categorized permissions
    for (const category of ["advanced", "moderation", "general", "text", "voice"]) {
        if (categorized[category] && categorized[category].length) {
            const perms = categorized[category].map(formatPerm).join("\n");
            result.push(
                headers
                    ? `${CATEGORY_ICONS[category]} **${category.charAt(0).toUpperCase() + category.slice(1)}:**\n${perms}`
                    : perms,
            );
        }
    }

    // Add uncategorized permissions
    if (uncategorized.length) {
        const perms = uncategorized.map(formatPerm).join("\n");
        result.push(headers ? `${CATEGORY_ICONS.other} **Other:**\n${perms}` : perms);
    }

    return result.join("\n\n").substring(0, maxLength);
}

/**
 * Format a list of permissions showing both allowed and denied permissions
 * @param {PermissionsBitField|Object} permissions - The permissions to format
 * @param {Object} options - Formatting options
 * @returns {string} Formatted permissions string
 */
function formatPermissions(permissions, options = {}) {
    const { includeAll = false, categorize = true, maxLength = 1024 } = options;

    // Handle different permission input formats
    let allowed = [];
    let denied = [];

    if (permissions.allow && permissions.deny) {
        // Handle permission overwrites format
        allowed = permissions.allow.toArray();
        denied = permissions.deny.toArray();
    } else if (permissions.bitfield !== undefined) {
        // Handle standard permission bitfield
        allowed = permissions.toArray();

        if (includeAll) {
            // Generate list of all possible permissions
            const allPerms = Object.keys(PermissionsBitField.Flags);
            denied = allPerms.filter((perm) => !allowed.includes(perm));
        }
    } else if (Array.isArray(permissions)) {
        // Handle permission array
        allowed = permissions;
    }

    // No permissions to display
    if (allowed.length === 0 && denied.length === 0) {
        return "No permissions to display";
    }

    // Format based on categorization preference
    if (categorize) {
        const result = [];

        // Format allowed permissions if any
        if (allowed.length > 0) {
            result.push(
                formatCategorizedPermissions(allowed, {
                    maxLength: maxLength / 2,
                }),
            );
        }

        // Format denied permissions if any
        if (denied.length > 0) {
            const formattedDenied = formatCategorizedPermissions(denied, {
                checkmark: false,
                maxLength: maxLength / 2,
            }).replace(/•/g, "❌");

            result.push("**Denied Permissions:**\n" + formattedDenied);
        }

        return result.join("\n\n").substring(0, maxLength);
    } else {
        // Simple list format
        const result = [];

        if (allowed.length > 0) {
            result.push(
                "**Allowed:**\n" +
                    allowed.map((p) => `✅ ${p.replace(/_/g, " ").toLowerCase()}`).join("\n"),
            );
        }

        if (denied.length > 0) {
            result.push(
                "**Denied:**\n" +
                    denied.map((p) => `❌ ${p.replace(/_/g, " ").toLowerCase()}`).join("\n"),
            );
        }

        return result.join("\n\n").substring(0, maxLength);
    }
}

/**
 * Split long permission text into multiple parts that fit within Discord's field limit
 * @param {string} permissionText - The formatted permission text
 * @param {number} maxLength - Maximum length for each part
 * @returns {string[]} Array of text parts
 */
function splitPermissionText(permissionText, maxLength = 1024) {
    if (permissionText.length <= maxLength) {
        return [permissionText];
    }

    // Split by category sections
    const parts = permissionText.split("\n\n");
    const result = [];
    let currentPart = "";

    // Combine sections until they reach max length
    for (const part of parts) {
        if (currentPart.length + part.length + 2 <= maxLength) {
            currentPart += (currentPart ? "\n\n" : "") + part;
        } else {
            result.push(currentPart);
            currentPart = part;
        }
    }

    if (currentPart) {
        result.push(currentPart);
    }

    return result;
}

/**
 * Compare permissions between two sets and return the differences
 * @param {PermissionsBitField|string[]} basePerms - Base permissions to compare against
 * @param {PermissionsBitField|string[]} comparePerms - Permissions to compare with base
 * @returns {Object} Object with added and removed permissions
 */
function comparePermissions(basePerms, comparePerms) {
    // Convert inputs to arrays
    const baseArray = Array.isArray(basePerms) ? basePerms : basePerms.toArray();
    const compareArray = Array.isArray(comparePerms) ? comparePerms : comparePerms.toArray();

    // Find differences
    const added = compareArray.filter((perm) => !baseArray.includes(perm));
    const removed = baseArray.filter((perm) => !compareArray.includes(perm));

    return { added, removed };
}

/**
 * Format permission differences in a readable format
 * @param {Object} differences - Object with added and removed permissions
 * @param {Object} options - Formatting options
 * @returns {string} Formatted differences
 */
function formatPermissionDifferences(differences, options = {}) {
    const { maxLength = 1024, includeDescriptions = false } = options;
    const { added, removed } = differences;

    if (added.length === 0 && removed.length === 0) {
        return "No permission differences";
    }

    const formatPerm = (perm) => {
        const formatted = perm.replace(/_/g, " ").toLowerCase();
        return includeDescriptions && PERMISSION_DESCRIPTIONS[perm]
            ? `${formatted} *(${PERMISSION_DESCRIPTIONS[perm]})*`
            : formatted;
    };

    const sections = [];

    if (added.length > 0) {
        sections.push(
            `**Added Permissions:**\n${added.map((p) => `✅ ${formatPerm(p)}`).join("\n")}`,
        );
    }

    if (removed.length > 0) {
        sections.push(
            `**Removed Permissions:**\n${removed.map((p) => `❌ ${formatPerm(p)}`).join("\n")}`,
        );
    }

    return sections.join("\n\n").substring(0, maxLength);
}

/**
 * Get a plain-language description of what a permission does
 * @param {string} permission - The permission to describe
 * @returns {string} Description of the permission
 */
function getPermissionDescription(permission) {
    return PERMISSION_DESCRIPTIONS[permission] || "No description available";
}

/**
 * Format a single permission with its description
 * @param {string} permission - The permission to format
 * @param {boolean} allowed - Whether the permission is allowed or denied
 * @returns {string} Formatted permission with description
 */
function formatPermissionWithDescription(permission, allowed = true) {
    const icon = allowed ? "✅" : "❌";
    const name = permission.replace(/_/g, " ").toLowerCase();
    const description = getPermissionDescription(permission);

    return `${icon} **${name}**\n${description}`;
}

/**
 * Get the category a permission belongs to
 * @param {string} permission - The permission to check
 * @returns {string|null} The category name or null if not found
 */
function getPermissionCategory(permission) {
    for (const [category, perms] of Object.entries(PERMISSION_CATEGORIES)) {
        if (perms.includes(permission)) {
            return category;
        }
    }
    return null;
}

/**
 * Format channel permissions for a role or member with overwrites
 * @param {GuildChannel} channel - The channel to get permissions for
 * @param {Role|GuildMember} target - The role or member to get permissions for
 * @param {Object} options - Formatting options
 * @returns {string} Formatted permissions with base and overwrite info
 */
function formatChannelPermissions(channel, target, options = {}) {
    const { maxLength = 2048, showOverwritesOnly = false } = options;

    // Get base permissions
    const basePermissions = target.permissions;

    // Get permission overwrites for this channel
    const overwritePermissions = channel.permissionsFor(target);

    // If we're only showing differences
    if (showOverwritesOnly) {
        const { added, removed } = comparePermissions(basePermissions, overwritePermissions);

        if (added.length === 0 && removed.length === 0) {
            return "No permission overwrites for this channel";
        }

        return formatPermissionDifferences(
            { added, removed },
            {
                maxLength,
                includeDescriptions: true,
            },
        );
    }

    // Otherwise format the full channel permissions
    return formatCategorizedPermissions(overwritePermissions, {
        maxLength,
        checkmark: true,
        headers: true,
    });
}

/**
 * Formats a permission string to be more human-readable
 * @param {string} permission - The permission string to format
 * @returns {string} Formatted permission string with proper spacing and capitalization
 */
function formatPermission(permission) {
    return permission
        .replace(/([A-Z])/g, " $1")
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Check if a member or role has a specific permission
 * @param {GuildMember|Role} target - The member or role to check
 * @param {string} permission - The permission to check for
 * @param {GuildChannel} channel - Optional channel for channel-specific permissions
 * @returns {boolean} Whether the target has the permission
 */
function hasPermission(target, permission, channel = null) {
    try {
        if (channel) {
            return channel.permissionsFor(target)?.has(permission) || false;
        }
        return target.permissions?.has(permission) || false;
    } catch (error) {
        return false;
    }
}

/**
 * Check if a member has any of the specified permissions
 * @param {GuildMember} member - The member to check
 * @param {string[]} permissions - Array of permissions to check
 * @param {GuildChannel} channel - Optional channel for channel-specific permissions
 * @returns {boolean} Whether the member has any of the permissions
 */
function hasAnyPermission(member, permissions, channel = null) {
    return permissions.some((permission) => hasPermission(member, permission, channel));
}

/**
 * Check if a member has all of the specified permissions
 * @param {GuildMember} member - The member to check
 * @param {string[]} permissions - Array of permissions to check
 * @param {GuildChannel} channel - Optional channel for channel-specific permissions
 * @returns {boolean} Whether the member has all of the permissions
 */
function hasAllPermissions(member, permissions, channel = null) {
    return permissions.every((permission) => hasPermission(member, permission, channel));
}

/**
 * Get missing permissions from a required set
 * @param {GuildMember} member - The member to check
 * @param {string[]} requiredPermissions - Array of required permissions
 * @param {GuildChannel} channel - Optional channel for channel-specific permissions
 * @returns {string[]} Array of missing permissions
 */
function getMissingPermissions(member, requiredPermissions, channel = null) {
    return requiredPermissions.filter((permission) => !hasPermission(member, permission, channel));
}

/**
 * Create a user-friendly error message for missing permissions
 * @param {string[]} missingPermissions - Array of missing permissions
 * @param {string} context - Context where permissions are needed (e.g., "use this command")
 * @returns {string} Formatted error message
 */
function createPermissionErrorMessage(missingPermissions, context = "perform this action") {
    if (missingPermissions.length === 0) return "";

    const formattedPerms = missingPermissions
        .map((perm) => `**${formatPermission(perm)}**`)
        .join(", ");

    const verb = missingPermissions.length === 1 ? "permission" : "permissions";

    return `You need the following ${verb} to ${context}: ${formattedPerms}`;
}

module.exports = {
    // Constants
    PERMISSION_CATEGORIES,
    CATEGORY_ICONS,
    PERMISSION_DESCRIPTIONS,

    // Core formatting functions
    formatCategorizedPermissions,
    formatPermissions,
    splitPermissionText,

    // Comparison and analysis functions
    comparePermissions,
    formatPermissionDifferences,
    getPermissionDescription,
    formatPermissionWithDescription,
    getPermissionCategory,
    formatChannelPermissions,
    formatPermission,

    // Permission checking utilities
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    getMissingPermissions,
    createPermissionErrorMessage,
};
