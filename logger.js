const chalk = require('chalk');

class Logger {
	// Define colors and icons for each log level
	static #config = {
		levels: {
			info: { color: chalk.blue, icon: 'ℹ️' },
			success: { color: chalk.green, icon: '✅' },
			warning: { color: chalk.yellow, icon: '⚠️' },
			error: { color: chalk.red, icon: '❌' },
			debug: { color: chalk.magenta, icon: '🐞' },
		},
		dateFormatOptions: {
			hour12: false,
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
		},
	};

	// Format the timestamp with more legible format (HH:MM:SS)
	static #formatTimestamp() {
		return new Date().toLocaleTimeString(
			'en-US',
			Logger.#config.dateFormatOptions,
		);
	}

	// Generic logging method
	static log(category, message, type = 'info') {
		const level = Logger.#config.levels[type] || Logger.#config.levels.info;
		const timestamp = chalk.gray(`[${Logger.#formatTimestamp()}]`);
		const categoryText = chalk.cyan(`[${category}]`);
		const icon = level.icon;
		const formattedMessage = level.color(message);
		console.log(`${timestamp} ${categoryText} ${icon} ${formattedMessage}`);
	}

	// Shortcut methods for specific log levels
	static info(category, message) {
		this.log(category, message, 'info');
	}

	static success(category, message) {
		this.log(category, message, 'success');
	}

	static warning(category, message) {
		this.log(category, message, 'warning');
	}

	static error(category, message) {
		this.log(category, message, 'error');
	}

	static debug(category, message) {
		this.log(category, message, 'debug');
	}

	// Enhanced table method with a border and title
	static table(data, title = 'Table Data') {
		const border = chalk.cyan('='.repeat(60));
		console.log(`\n${border}`);
		console.log(chalk.cyan.bold(title));
		console.table(data);
		console.log(border);
	}
}

module.exports = Logger;
