/**
 * Parses a range string in the format "start-end" and returns the parsed numbers
 * 
 * @param {string} rangeString - The range string to parse (e.g., "1-5")
 * @returns {Object} Object with start and end numbers, or null if invalid
 */
function parseRange(rangeString) {
    if (!rangeString || typeof rangeString !== 'string') {
        return null;
    }
    
    const parts = rangeString.split('-');
    if (parts.length !== 2) {
        return null;
    }
    
    const start = parseInt(parts[0].trim());
    const end = parseInt(parts[1].trim());
    
    if (isNaN(start) || isNaN(end) || start > end) {
        return null;
    }
    
    return { start, end };
}

module.exports = { parseRange };