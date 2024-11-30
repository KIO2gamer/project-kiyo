const winston = require('winston');

// Define custom log formats
const logFormat = winston.format.printf(({ timestamp, level, message }) => {
	let color;
	switch (level) {
		case 'info':
			color = '\x1b[36m'; // Cyan
			break;
		case 'warn':
			color = '\x1b[33m'; // Yellow
			break;
		case 'error':
			color = '\x1b[31m'; // Red
			break;
		default:
			color = '\x1b[0m'; // Reset
	}
	return `${timestamp} [${level}]: ${color}${message}\x1b[0m`;
});

// Create centralized Winston logger
const logger = winston.createLogger({
	level: 'info',
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
		logFormat,
	),
	transports: [
		new winston.transports.Console(),
		new winston.transports.File({ filename: 'logs/combined_logs.log' }),
		new winston.transports.File({
			filename: 'logs/error_logs.log',
			level: 'error',
		}),
	],
});

// Helper logging functions
const logInfo = (message) => {
	logger.info(message);
};

const logWarn = (message) => {
	logger.warn(message);
};

const logError = (message) => {
	logger.error(message);
};

module.exports = {
	logInfo,
	logWarn,
	logError,
};
