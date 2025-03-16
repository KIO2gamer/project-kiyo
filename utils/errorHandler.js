/**
 * Universal Error Handler
 * Provides consistent error handling across the application with context and tracking
 */

/**
 * Handle an error with context and optional fatal designation
 * @param {Error|string} error - The error object or message
 * @param {string} context - Context where the error occurred
 * @param {boolean} fatal - Whether this error should terminate the process
 * @returns {string} The unique error ID
 */
const handle = async (error, context = '', fatal = false) => {
    const timestamp = new Date().toISOString();
    const errorId = Math.random().toString(36).substring(2, 10);

    // Format the error message
    const errorMessage = `[${timestamp}] [ERROR-${errorId}] ${context ? `[${context}] ` : ''}${
        error.message || error
    }`;
    const errorStack = error.stack || new Error().stack;

    // Log to console
    console.error(errorMessage);
    console.error(errorStack);

    // Implement additional error handling as needed:
    // - Log to file
    // - Send to error monitoring service
    // - Alert administrators
    // - etc.

    // For fatal errors, exit the process
    if (fatal) {
        console.error(`[FATAL] Application will now exit due to critical error: ${errorId}`);
        process.exit(1);
    }

    return errorId;
};

/**
 * Wrap an async function to catch and handle errors
 * @param {Function} fn - Async function to wrap
 * @param {string} context - Context for error reporting
 * @param {boolean} fatal - Whether an error should be fatal
 * @returns {Promise<any>} The function result or null on error
 */
const wrap = async (fn, context, fatal = false) => {
    try {
        return await fn();
    } catch (error) {
        await handle(error, context, fatal);
        return null;
    }
};

/**
 * Setup global process error handlers
 * @returns {void}
 */
const setupGlobalHandlers = () => {
    process.on('uncaughtException', error => {
        handle(error, 'UNCAUGHT_EXCEPTION', true);
    });

    process.on('unhandledRejection', error => {
        handle(error, 'UNHANDLED_REJECTION', true);
    });
};

/**
 * Setup Discord client error handlers
 * @param {import('discord.js').Client} client - Discord.js client
 * @returns {void}
 */
const setupClientHandlers = client => {
    client.on('error', error => {
        handle(error, 'DISCORD_CLIENT', false);
    });

    client.on('shardError', error => {
        handle(error, 'DISCORD_SHARD', false);
    });
};

module.exports = {
    handle,
    wrap,
    setupGlobalHandlers,
    setupClientHandlers,
};
