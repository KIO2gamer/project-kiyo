// Function to format strings
const formatString = (str, ...args) => {
    return str.replace(/{(\d+)}/g, (match, number) => {
        return typeof args[number] !== 'undefined' ? args[number] : match;
    });
};

// ANSI color codes
const colors = {
    reset: '\x1b[0m',
    info: '\x1b[32m', // Green
    warning: '\x1b[33m', // Yellow
    error: '\x1b[31m', // Red
    database: '\x1b[34m', // Blue
    deploy: '\x1b[35m', // Magenta
};

// Custom console logging functions
const logInfo = (message) => {
    console.log(`${colors.info}[INFO] ${message}${colors.reset}`);
};

const logWarning = (message) => {
    console.warn(`${colors.warning}[WARNING] ${message}${colors.reset}`);
};

const logError = (message) => {
    console.error(`${colors.error}[ERROR] ${message}${colors.reset}`);
};

const database = (message) => {
    console.log(`${colors.database}[DATABASE] ${message}${colors.reset}`);
};

const deploy = (message) => {
    console.log(`${colors.deploy}[DEPLOY] ${message}${colors.reset}`);
};

module.exports = {
    formatString,
    logInfo,
    logWarning,
    logError,
    database,
    deploy,
};
