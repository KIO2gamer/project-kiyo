const { SlashCommandBuilder } = require('discord.js');
const { EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Check the status of a server or service')
		.addStringOption(option =>
			option
				.setName('url')
				.setDescription('URL to check')
				.setRequired(true),
		),
	category: 'utility',
	description_full:
		'Check the status of a server or service by providing a URL. This command will return detailed information such as the status code, content type, server details, response time, and more.',
	usage: '/status <url>',
	examples: [
		'/status https://www.example.com',
		'/status https://api.github.com',
		'/status https://discord.com',
	],
	async execute(interaction) {
		const url = interaction.options.getString('url');
		try {
			const startTime = Date.now();
			const response = await fetch(url);
			const endTime = Date.now();
			const responseTime = endTime - startTime;

			const statusCode = response.status;
			const contentType = response.headers.get('content-type');
			const serverInfo = response.headers.get('server');
			const lastModified = response.headers.get('last-modified');
			const contentLength = response.headers.get('content-length');

			const embed = new EmbedBuilder()
				.setColor(response.ok ? 0x00ff00 : 0xff0000)
				.setTitle(`Status Check: ${url}`)
				.setDescription(
					response.ok ? 'Service is online' : 'Service is offline',
				)
				.addFields(
					{
						name: 'Status Code',
						value: statusCode.toString(),
						inline: true,
					},
					{
						name: 'Response Time',
						value: `${responseTime}ms`,
						inline: true,
					},
					{
						name: 'Content Type',
						value: contentType || 'Not specified',
						inline: true,
					},
					{
						name: 'Server',
						value: serverInfo || 'Not specified',
						inline: true,
					},
					{
						name: 'Last Modified',
						value: lastModified || 'Not specified',
						inline: true,
					},
					{
						name: 'Content Length',
						value: contentLength
							? `${contentLength} bytes`
							: 'Not specified',
						inline: true,
					},
				)
				.setFooter({ text: 'Status check performed at' })
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
		}
		catch (error) {
			const errorEmbed = new EmbedBuilder()
				.setColor(0xff0000)
				.setTitle('Error')
				.setDescription(`Failed to check status for ${url}`)
				.addFields({ name: 'Error Message', value: error.message })
				.setFooter({ text: 'Error occurred at' })
				.setTimestamp();

			await interaction.editReply({ embeds: [errorEmbed] });
		}
	},
};
