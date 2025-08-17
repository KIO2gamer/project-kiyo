/**
 * Calculate similarity between two strings using Levenshtein distance algorithm.
 * Returns a value between 0 (completely different) and 1 (identical).
 *
 * @param {string} str1 - First string to compare
 * @param {string} str2 - Second string to compare
 * @returns {number} Similarity score between 0 and 1
 */
function calculateSimilarity(str1, str2) {
    const track = Array(str2.length + 1)
        .fill(null)
        .map(() => Array(str1.length + 1).fill(null));

    for (let i = 0; i <= str1.length; i += 1) {
        track[0][i] = i;
    }

    for (let j = 0; j <= str2.length; j += 1) {
        track[j][0] = j;
    }

    for (let j = 1; j <= str2.length; j += 1) {
        for (let i = 1; i <= str1.length; i += 1) {
            const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
            track[j][i] = Math.min(
                track[j][i - 1] + 1,
                track[j - 1][i] + 1,
                track[j - 1][i - 1] + indicator,
            );
        }
    }

    return 1 - track[str2.length][str1.length] / Math.max(str1.length, str2.length);
}

/**
 * Truncate text to a specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add when truncated (default: "...")
 * @returns {string} Truncated text
 */
function truncateText(text, maxLength, suffix = "...") {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize the first letter of a string
 * @param {string} str - String to capitalize
 * @returns {string} Capitalized string
 */
function capitalize(str) {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Convert string to title case
 * @param {string} str - String to convert
 * @returns {string} Title case string
 */
function toTitleCase(str) {
    if (!str) return str;
    return str.replace(
        /\w\S*/g,
        (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
    );
}

/**
 * Format a string by replacing underscores with spaces and capitalizing
 * @param {string} str - String to format
 * @returns {string} Formatted string
 */
function formatIdentifier(str) {
    if (!str) return str;
    return str
        .replace(/([A-Z])/g, " $1")
        .replace(/_/g, " ")
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (l) => l.toUpperCase());
}

/**
 * Escape special regex characters in a string
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Remove extra whitespace and normalize line breaks
 * @param {string} str - String to clean
 * @returns {string} Cleaned string
 */
function cleanWhitespace(str) {
    if (!str) return str;
    return str.replace(/\s+/g, " ").trim();
}

/**
 * Split text into chunks that fit within a specified length
 * @param {string} text - Text to split
 * @param {number} maxLength - Maximum length per chunk
 * @param {string} separator - Separator to split on (default: "\n\n")
 * @returns {string[]} Array of text chunks
 */
function splitTextIntoChunks(text, maxLength = 1024, separator = "\n\n") {
    if (text.length <= maxLength) {
        return [text];
    }

    const parts = text.split(separator);
    const result = [];
    let currentPart = "";

    for (const part of parts) {
        if (currentPart.length + part.length + separator.length <= maxLength) {
            currentPart += (currentPart ? separator : "") + part;
        } else {
            if (currentPart) result.push(currentPart);
            currentPart = part;
        }
    }

    if (currentPart) {
        result.push(currentPart);
    }

    return result;
}

/**
 * Format a number into a human-readable string with abbreviations (K, M, B).
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
function formatNumber(num) {
    if (!num) return "0";
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1).replace(/\.0$/, "") + "B";
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1).replace(/\.0$/, "") + "M";
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1).replace(/\.0$/, "") + "K";
    }
    return num.toString();
}

module.exports = {
    calculateSimilarity,
    truncateText,
    capitalize,
    toTitleCase,
    formatIdentifier,
    escapeRegex,
    cleanWhitespace,
    splitTextIntoChunks,
    formatNumber,
};
