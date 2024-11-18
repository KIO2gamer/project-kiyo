/**
 * Formats a given time duration in seconds into a human-readable string.
 *
 * @param {number} seconds - The total number of seconds to format.
 * @returns {string} A string representing the formatted uptime in the format "Xd Xh Xm Xs".
 */
function formatUptime(seconds) {
    const days = Math.floor(seconds / (3600 * 24));
    const hours = Math.floor((seconds % (3600 * 24)) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${remainingSeconds}s`;
}

module.exports = {
    formatUptime,
};
