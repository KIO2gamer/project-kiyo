const fs = require('fs').promises;
const path = require('path');

class TemplateHandler {
	constructor() {
		this.templateCache = new Map();
	}

	async loadTemplate(templateName) {
		if (this.templateCache.has(templateName)) {
			return this.templateCache.get(templateName);
		}

		// Construct template path RELATIVE to templateHandler.js
		const templatePath = path.join(__dirname, 'templates', `${templateName}.html`);

		try {
			const template = await fs.readFile(templatePath, 'utf8');
			this.templateCache.set(templateName, template);
			console.log(`✅ Template "${templateName}" loaded from: ${templatePath}`); // Log successful load
			return template;
		} catch (error) {
			console.error(`❌ Error loading template "${templateName}" from: ${templatePath}`); // Log error with path
			console.error(error); // Log full error for debugging
			throw new Error(`Failed to load template "${templateName}": ${error.message}`); // Re-throw with more context
		}
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

		try {
			const template = await this.loadTemplate(templateName); // Load template using loadTemplate method

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
		} catch (error) {
			console.error(`❌ Error generating response from template "${templateName}":`, error);
			console.error(error);
			// Fallback to a simple error message in case template processing fails
			return `
                <!DOCTYPE html><html><head><title>Error</title></head><body>
                <h1>Error generating response</h1><p>Template: ${templateName}</p>
                <p>Error details: ${error.message}</p></body></html>
            `;
		}
	}
}

module.exports = new TemplateHandler();