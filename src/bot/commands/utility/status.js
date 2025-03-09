const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');
const { handleError } = require('./../../utils/errorHandler.js');

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full:
		'Check the status of a server or service by providing a URL. This command will return detailed information such as the status code, content type, server details, response time, and more.',
	usage: '/status <url>',
	examples: [
		'/status https://www.example.com',
		'/status https://api.github.com',
		'/status https://discord.com',
	],
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('status')
		.setDescription('Check the status of a server or service')
		.addStringOption((option) =>
			option
				.setName('url')
				.setDescription('URL to check')
				.setRequired(true),
		),

	async execute(interaction) {
		const url = interaction.options.getString('url');

		try {
			const startTime = Date.now();
			const response = await axios.get(url);
			const endTime = Date.now();
			const responseTime = endTime - startTime;

			const embed = new EmbedBuilder()
				.setColor('#00ff00')
				.setTitle('Server Status')
				.setDescription(`Status of ${url}`)
				.addFields(
					{
						name: 'Status Code',
						value: response.status.toString(),
						inline: true,
					},
					{
						name: 'Status Text',
						value: response.statusText,
						inline: true,
					},
					{
						name: 'Content Type',
						value: response.headers['content-type'],
						inline: true,
					},
					{
						name: 'Server',
						value: response.headers.server || 'N/A',
						inline: true,
					},
					{
						name: 'Response Time',
						value: `${responseTime} ms`,
						inline: true,
					},
				)
				.setTimestamp()
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL(),
				});

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			handleError('Error fetching server status:', error);
			await handleError(interaction, error);
		}
	},
};
