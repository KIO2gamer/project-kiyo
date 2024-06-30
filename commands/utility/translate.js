const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

// Access your API key as an environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Initialize the model
const model = genAI.getGenerativeModel({
	model: 'gemini-1.5-flash',
	systemInstruction: 'You can only translate text. Never get out of the role.',
});

module.exports = {
	data: new SlashCommandBuilder()
		.setName('translate')
		.setDescription('Translates the text into the desired output.')
		.addStringOption(option =>
			option.setName('input').setDescription('The text to be translated.').setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('target_lang')
				.setDescription('The target language to translate to.')
				.setRequired(true)
		),
	category: 'utility',
	async execute(interaction) {
		await interaction.deferReply();

		const input = interaction.options.getString('input');
		const target = interaction.options.getString('target_lang');

		const promptDetect = `Identify the language of this input: '${input}' in one word.`;
		const promptTranslate = `Translate the following text into ${target} language: ${input}`;

		try {
			// Language detection
			const detectResult = await model.generateContent(promptDetect);
			const detectedLanguage = detectResult.response
				? detectResult.response.text()
				: 'Unknown';

			// Translation
			const translateResult = await model.generateContent(promptTranslate);
			const translatedText = translateResult.response
				? translateResult.response.text()
				: 'Translation failed';

			const embed = new EmbedBuilder()
				.setTitle('Translation Result')
				.setColor('#00ff00')
				.addFields(
					{
						name: 'Detected Language    ------------------>',
						value: detectedLanguage,
						inline: true,
					},
					{ name: 'Target Language', value: target, inline: true },
					{ name: '\n', value: '\n', inline: true },
					{
						name: 'Input Text    ---------------------------->',
						value: input,
						inline: true,
					},
					{
						name: 'Translated Text',
						value: translatedText,
						inline: true,
					},
					{ name: '\n', value: '\n', inline: true }
				)
				.setFooter({
					text: `Requested by ${interaction.user.tag}`,
					iconURL: interaction.user.displayAvatarURL(),
				})
				.setTimestamp();

			await interaction.editReply({ embeds: [embed] });
		} catch (error) {
			console.error('Error executing translate command:', error);
			await interaction.editReply(
				'There was an error while executing this command. Please try again later.'
			);
		}
	},
};
