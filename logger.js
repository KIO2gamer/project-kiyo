const chalk = require('chalk');

class Logger {
	static #colors = {
		info: chalk.blue,
		success: chalk.green,
		warning: chalk.yellow,
		error: chalk.red
	};

	static #formatTimestamp() {
		return new Date().toISOString().replace('T', ' ').split('.')[0];
	}

	static log(category, message, type = 'info') {
		const timestamp = chalk.gray(`[${this.#formatTimestamp()}]`);
		const categoryText = chalk.cyan(`[${category}]`);
		const coloredMessage = this.#colors[type](message);

		console.log(`${timestamp} ${categoryText} ${coloredMessage}`);
	}

	static table(data, title) {
		console.log(chalk.cyan(`\n${title}`));
		console.table(data);
	}
}

module.exports = Logger;