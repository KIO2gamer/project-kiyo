/**
 * Returns the human-readable name for the given Discord channel type.
 *
 * @param {Object} channel - The Discord channel object.
 * @returns {string} The human-readable name for the channel type, or 'Unknown' if the type is not recognized.
 */
const channelTypes = new Map([
    [0, "Text"],
    [2, "Voice"],
    [4, "Category"],
    [5, "Announcement"],
    [10, "News Thread"],
    [11, "Public Thread"],
    [12, "Private Thread"],
    [13, "Stage"],
    [15, "Forum"],
]);

function getChannelType(channel) {
    if (channel && typeof channel.type !== "undefined") {
        return channelTypes.get(channel.type) || "Unknown";
    }
    return "Unknown";
}

module.exports = {
    getChannelType,
    channelTypes,
};
