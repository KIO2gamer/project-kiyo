/**
 * Universal Logger
 * Provides consistent logging across the application with severity levels and context
 * Using native ANSI color codes and box drawing characters (no dependencies)
 */

const fs = require("node:fs");
const path = require("node:path");

// ANSI color codes
const COLORS = {
    RESET: "\x1b[0m",
    CYAN: "\x1b[36m",
    GREEN: "\x1b[32m",
    YELLOW: "\x1b[33m",
    RED: "\x1b[31m",
    MAGENTA: "\x1b[35m",
    GRAY: "\x1b[90m",
    WHITE: "\x1b[37m",
    BOLD: "\x1b[1m",
};

// Log levels with corresponding colors
const LOG_LEVELS = {
    DEBUG: {
        priority: 0,
        color: (str) => `${COLORS.CYAN}${str}${COLORS.RESET}`,
        label: "DEBUG",
        boxChars: ["─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼"],
    },
    INFO: {
        priority: 1,
        color: (str) => `${COLORS.GREEN}${str}${COLORS.RESET}`,
        label: "INFO",
        boxChars: ["─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼"],
    },
    WARN: {
        priority: 2,
        color: (str) => `${COLORS.YELLOW}${str}${COLORS.RESET}`,
        label: "WARN",
        boxChars: ["─", "│", "┌", "┐", "└", "┘", "├", "┤", "┬", "┴", "┼"],
    },
    ERROR: {
        priority: 3,
        color: (str) => `${COLORS.RED}${str}${COLORS.RESET}`,
        label: "ERROR",
        boxChars: ["═", "║", "╔", "╗", "╚", "╝", "╠", "╣", "╦", "╩", "╬"],
    },
    FATAL: {
        priority: 4,
        color: (str) => `${COLORS.MAGENTA}${str}${COLORS.RESET}`,
        label: "FATAL",
        boxChars: ["═", "║", "╔", "╗", "╚", "╝", "╠", "╣", "╦", "╩", "╬"],
    },
};

// Default configuration
const defaultConfig = {
    level: "INFO",
    logToFile: false,
    logFolder: "logs",
    logFileMaxSize: 5 * 1024 * 1024, // 5MB
    useBoxes: true,
    showTimestamp: true,
    colorize: true,
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

        const logFile = path.join(logDir, `app-${new Date().toISOString().split("T")[0]}.log`);
        logStream = fs.createWriteStream(logFile, { flags: "a" });
    }
}

/**
 * Format a log message
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {string} [context=''] - Log context
 * @returns {Object} Formatted log entry
 */
function formatLog(level, message, context = "") {
    const timestamp = new Date().toISOString();
    const logLevel = LOG_LEVELS[level];

    // Plain text format for file logging
    const plainText = `[${timestamp}] [${logLevel.label}] ${context ? `[${context}] ` : ""}${message}`;

    // Colored format for console logging
    const timestampStr = config.showTimestamp ? `[${timestamp}]` : "";
    const coloredHeader = config.colorize
        ? logLevel.color(`${timestampStr} [${logLevel.label}]`)
        : `${timestampStr} [${logLevel.label}]`;
    const contextStr = context ? `${COLORS.GRAY}[${context}]${COLORS.RESET}` : "";
    const coloredText = `${coloredHeader} ${contextStr} ${message}`;

    return { plainText, coloredText, logLevel };
}

/**
 * Create a box around text
 * @param {string} text - Text to put in box
 * @param {Array} chars - Box drawing characters
 * @param {Object} options - Box options
 * @returns {string} Boxed text
 */
function createBox(text, chars, options = {}) {
    const lines = text.split("\n");
    const width = options.width || 60;
    const padding = options.padding || 1;

    const [h, v, tl, tr, bl, br] = chars;

    const contentWidth = width - 2;
    const result = [];

    // Top border
    result.push(`${tl}${h.repeat(contentWidth)}${tr}`);

    // Padding before content
    for (let i = 0; i < padding; i++) {
        result.push(`${v}${" ".repeat(contentWidth)}${v}`);
    }

    // Content
    lines.forEach((line) => {
        const paddedLine =
            line.length > contentWidth
                ? `${line.substring(0, contentWidth - 3)}...`
                : line.padEnd(contentWidth);
        result.push(`${v}${paddedLine}${v}`);
    });

    // Padding after content
    for (let i = 0; i < padding; i++) {
        result.push(`${v}${" ".repeat(contentWidth)}${v}`);
    }

    // Bottom border
    result.push(`${bl}${h.repeat(contentWidth)}${br}`);

    return result.join("\n");
}

/**
 * Write log to outputs (console and/or file)
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @param {string} [context=''] - Log context
 * @returns {void}
 */
function log(level, message, context = "") {
    // Skip logging if below configured level
    if (LOG_LEVELS[level].priority < LOG_LEVELS[config.level].priority) {
        return;
    }

    const { plainText, coloredText, logLevel } = formatLog(level, message, context);

    // Output to console
    if (config.useBoxes && (level === "ERROR" || level === "FATAL")) {
        // Use box drawing for errors and fatal errors
        const boxed = createBox(coloredText, logLevel.boxChars, {
            padding: 1,
            width: 80,
        });
        console.log(`\n${boxed}`);
    } else {
        console.log(coloredText);
    }

    // Output to file if enabled
    if (config.logToFile && logStream) {
        logStream.write(`${plainText}\n`);
    }
}

/**
 * Create a visually distinct section header
 * @param {string} title - Section title
 * @param {string} [level='INFO'] - Log level for the section
 * @returns {void}
 */
function section(title, level = "INFO") {
    if (LOG_LEVELS[level].priority < LOG_LEVELS[config.level].priority) {
        return;
    }

    const logLevel = LOG_LEVELS[level];
    const chars = logLevel.boxChars;
    const coloredTitle = logLevel.color(` ${title} `);

    // Calculate padding needed to center the title
    const width = 60;
    const titleLength = title.length + 2; // +2 for the spaces
    const leftPadding = Math.floor((width - titleLength) / 2);
    const rightPadding = width - titleLength - leftPadding;

    // Create a boxed section header
    const topLine = `${chars[2]}${chars[0].repeat(width)}${chars[3]}`;
    const titleLine = `${chars[1]}${" ".repeat(leftPadding)}${coloredTitle}${" ".repeat(rightPadding)}${chars[1]}`;
    const bottomLine = `${chars[4]}${chars[0].repeat(width)}${chars[5]}`;

    console.log(`\n${topLine}`);
    console.log(titleLine);
    console.log(bottomLine);

    // Write to log file if enabled
    if (config.logToFile && logStream) {
        const plainHeader = `\n${"=".repeat(20)} ${title} ${"=".repeat(20)}\n`;
        logStream.write(plainHeader);
    }
}

/**
 * Create a visual divider in logs
 * @param {string} [level='INFO'] - Log level for the divider
 * @returns {void}
 */
function divider(level = "INFO") {
    if (LOG_LEVELS[level].priority < LOG_LEVELS[config.level].priority) {
        return;
    }

    const logLevel = LOG_LEVELS[level];
    console.log(logLevel.color("─".repeat(80)));

    if (config.logToFile && logStream) {
        logStream.write(`${"-".repeat(80)}\n`);
    }
}

// Individual level methods
const debug = (message, context) => log("DEBUG", message, context);
const info = (message, context) => log("INFO", message, context);
const warn = (message, context) => log("WARN", message, context);
const error = (message, context) => log("ERROR", message, context);
const fatal = (message, context) => log("FATAL", message, context);

/**
 * Create a table from object data
 * @param {Array} data - Array of objects to display in table
 * @param {string} [title='Data Table'] - Table title
 * @param {string} [level='INFO'] - Log level for the table
 */
function table(data, title = "Data Table", level = "INFO") {
    if (LOG_LEVELS[level].priority < LOG_LEVELS[config.level].priority) {
        return;
    }

    section(title, level);
    console.table(data);

    // Basic table representation for log file
    if (config.logToFile && logStream) {
        logStream.write(`\n--- ${title} ---\n`);
        logStream.write(`${JSON.stringify(data, null, 2)}\n`);
    }
}

/**
 * Close the logger and any open files
 * @returns {Promise<void>}
 */
async function close() {
    return new Promise((resolve) => {
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
    section,
    divider,
    table,
    close,
    LOG_LEVELS,
};
