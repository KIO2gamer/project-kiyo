const fs = require('fs').promises;
const path = require('path');

class TemplateHandler {
	constructor() {
		this.templateCache = new Map();
	}

	async loadTemplate(templateName) {
		if (!this.templateCache.has(templateName)) {
			const templatePath = path.join(__dirname, `../templates/${templateName}.html`);
			const template = await fs.readFile(templatePath, 'utf8');
			this.templateCache.set(templateName, template);
		}
		return this.templateCache.get(templateName);
	}

	async generateResponse(templateName, options) {
		const {
			title,
			heading,
			message,
			additionalMessage,
			buttonText,
			buttonLink,
			status = 'info'
		} = options;

		const template = await this.loadTemplate(templateName);

		const statusColors = {
			success: '#16a34a',
			error: '#dc2626',
			warning: '#eab308',
			info: '#3b82f6'
		};

		const titleColor = statusColors[status] || statusColors.info;
		const buttonHtml = buttonText && buttonLink
			? `<a href="${buttonLink}" class="button">${buttonText}</a>`
			: '';

		return template
			.replace('${title}', title)
			.replace('titleColor', titleColor)
			.replace('${heading}', heading)
			.replace('${message}', message)
			.replace('${additionalMessage}', additionalMessage || '')
			.replace('${buttonHtml}', buttonHtml);
	}
}

module.exports = new TemplateHandler();