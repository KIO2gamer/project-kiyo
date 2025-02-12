const fs = require('fs').promises;
const path = require('path');

class TemplateHandler {
	constructor() {
		this.templateCache = null;
	}

	async loadTemplate() {
		if (!this.templateCache) {
			const templatePath = path.join(__dirname, '../templates/oauth-response.html');
			this.templateCache = await fs.readFile(templatePath, 'utf8');
		}
		return this.templateCache;
	}

	async generateResponse(options) {
		const {
			title,
			heading,
			message,
			additionalMessage,
			buttonText,
			buttonLink
		} = options;

		const template = await this.loadTemplate();

		const titleColor = title === 'Success' ? '#16a34a' : '#dc2626';
		const buttonHtml = buttonText && buttonLink
			? `<a href="${buttonLink}" class="button">${buttonText}</a>`
			: '';

		return template
			.replace('${title}', title)
			.replace('titleColor', titleColor)
			.replace('${heading}', heading)
			.replace('${message}', message)
			.replace('${additionalMessage}', additionalMessage)
			.replace('${buttonHtml}', buttonHtml);
	}
}

module.exports = new TemplateHandler();