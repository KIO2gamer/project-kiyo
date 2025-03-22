/**
 * Formats a given time duration in seconds into a human-readable string.
 * Only shows the largest non-zero units and handles edge cases.
 *
 * @param {number} seconds - The total number of seconds to format.
 * @returns {string} A string representing the formatted uptime.
 * @throws {Error} If seconds is negative.
 */
function formatUptime(seconds) {
    if (seconds < 0) {
        throw new Error("Seconds cannot be negative");
    }

    if (seconds === 0) {
        return "0s";
    }

    const units = [
        {
            name: "day",
            value: Math.floor(seconds / (3600 * 24)),
            suffix: (v) => (v === 1 ? "d" : "d"),
        },
        {
            name: "hour",
            value: Math.floor((seconds % (3600 * 24)) / 3600),
            suffix: (v) => (v === 1 ? "h" : "h"),
        },
        {
            name: "minute",
            value: Math.floor((seconds % 3600) / 60),
            suffix: (v) => (v === 1 ? "m" : "m"),
        },
        {
            name: "second",
            value: Math.floor(seconds % 60),
            suffix: (v) => (v === 1 ? "s" : "s"),
        },
    ];

    const filteredUnits = units
        .filter((unit) => unit.value > 0)
        .map((unit) => `${unit.value}${unit.suffix(unit.value)}`);

    return filteredUnits.join(" ");
}

/**
 * Formats a cooldown duration in seconds into a simple human-readable string.
 * Only shows the largest time unit.
 *
 * @param {number} seconds - The cooldown duration in seconds
 * @returns {string} A human-readable string (e.g., "5 seconds" or "2 minutes")
 */
function formatCooldown(seconds) {
    if (seconds < 60) {
        return `${seconds} second${seconds === 1 ? "" : "s"}`;
    } else if (seconds < 3600) {
        const minutes = Math.floor(seconds / 60);
        return `${minutes} minute${minutes === 1 ? "" : "s"}`;
    } else {
        const hours = Math.floor(seconds / 3600);
        return `${hours} hour${hours === 1 ? "" : "s"}`;
    }
}

module.exports = {
    formatUptime,
    formatCooldown,
    // Default export for easier usage
    default: formatUptime,
};
