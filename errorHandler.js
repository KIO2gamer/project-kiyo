class ErrorHandler {
    static async handle(error, context = '', fatal = false) {
        const timestamp = new Date().toISOString();
        const errorId = Math.random().toString(36).substring(2, 10);

        // Format the error message
        const errorMessage = `[${timestamp}] [ERROR-${errorId}] ${context ? `[${context}] ` : ''}${error.message || error}`;
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
    }

    // Wrapper for async functions to catch errors
    static async wrap(fn, context, fatal = false) {
        try {
            return await fn();
        } catch (error) {
            await this.handle(error, context, fatal);
            return null;
        }
    }
}
