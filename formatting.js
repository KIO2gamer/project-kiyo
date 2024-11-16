// Function to format strings
const formatString = (str, ...args) => {
    return str.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] !== 'undefined' ? args[number] : match;
    });
};

// Custom console logging functions
const logInfo = (message) => {
    console.log(`[INFO] ${message}`);
};

const logWarning = (message) => {
    console.warn(`[WARNING] ${message}`);
};

const logError = (message) => {
    console.error(`[ERROR] ${message}`);
};

const database = (message) => {
    console.log(`[DATABASE] ${message}`);
};

const deploy = (message) => {
    console.log(`[DEPLOY] ${message}`);
};

module.exports = {
    formatString,
    logInfo,
    logWarning,
    logError,
    database,
    deploy,
};
