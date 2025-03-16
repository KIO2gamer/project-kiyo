/**
 * Universal Logger
 * Provides consistent logging across the application with severity levels and context
 */

const fs = require('node:fs');
const path = require('node:path');

// Log levels with corresponding colors
const LOG_LEVELS = {
    DEBUG: { priority: 0, color: '\x1b[36m', label: 'DEBUG' }, // Cyan
    INFO: { priority: 1, color: '\x1b[32m', label: 'INFO' }, // Green
    WARN: { priority: 2, color: '\x1b[33m', label: 'WARN' }, // Yellow
    ERROR: { priority: 3, color: '\x1b[31m', label: 'ERROR' }, // Red
    FATAL: { priority: 4, color: '\x1b[35m', label: 'FATAL' }, // Purple
};

// Color reset code
const RESET = '\x1b[0m';

// Default configuration
const defaultConfig = {
    level: 'INFO',
    logToFile: false,
    logFolder: 'logs',
    logFileMaxSize: 5 * 1024 * 1024, // 5MB
};

let config = { ...defaultConfig };
let logStream = null;

/**
 * Configure the logger
 * @param {Object} options - Configuration options
 * @returns {void}
 */
function configure(options = {}) {
    config = { ...defaultConfig, ...options };

    // Initialize file logging if enabled
    if (config.logToFile) {
        const logDir = path.join(process.cwd(), config.logFolder);
        if (!fs.existsSync(logDir)) {
            fs.mkdirSync(logDir, { recursive: true });
        }

        const logFile = path.join(logDir, `app-${new Date().toISOString().split('T')[0]}.log`);
        logStream = fs.createWriteStream(logFile, { flags: 'a' });
    }
}

/**
 * Format a log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {string} [context=''] - Log context
 * @returns {Object} Formatted log entry
 */
function formatLog(level, message, context = '') {
    const timestamp = new Date().toISOString();
    const logLevel = LOG_LEVELS[level];

    // Plain text format for file logging
    const plainText = `[${timestamp}] [${logLevel.label}] ${context ? `[${context}] ` : ''}${message}`;

    // Colored format for console logging
    const coloredText = `${logLevel.color}[${timestamp}] [${logLevel.label}]${RESET} ${
        context ? `\x1b[90m[${context}]\x1b[0m ` : ''
    }${message}`;

    return { plainText, coloredText };
}

/**
 * Write log to outputs (console and/or file)
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {string} [context=''] - Log context
 * @returns {void}
 */
function log(level, message, context = '') {
    // Skip logging if below configured level
    if (LOG_LEVELS[level].priority < LOG_LEVELS[config.level].priority) {
        return;
    }

    const { plainText, coloredText } = formatLog(level, message, context);

    // Output to console
    console.log(coloredText);

    // Output to file if enabled
    if (config.logToFile && logStream) {
        logStream.write(plainText + '\n');
    }
}

// Individual level methods
const debug = (message, context) => log('DEBUG', message, context);
const info = (message, context) => log('INFO', message, context);
const warn = (message, context) => log('WARN', message, context);
const error = (message, context) => log('ERROR', message, context);
const fatal = (message, context) => log('FATAL', message, context);

/**
 * Close the logger and any open files
 * @returns {Promise<void>}
 */
async function close() {
    return new Promise(resolve => {
        if (logStream) {
            logStream.end(() => resolve());
        } else {
            resolve();
        }
    });
}

module.exports = {
    configure,
    debug,
    info,
    warn,
    error,
    fatal,
    close,
    LOG_LEVELS,
};
