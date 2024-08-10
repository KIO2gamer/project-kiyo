const { SlashCommandBuilder, PollLayoutType } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('create_poll')
		.setDescription('Create a poll')
		.addStringOption(option =>
			option.setName('question').setDescription('The question of the poll').setRequired(true)
		)
		.addStringOption(option =>
			option
				.setName('options')
				.setDescription('The options of the poll, separated by commas')
				.setRequired(true)
		)
		.addBooleanOption(option =>
			option
				.setName('multi_select')
				.setDescription('Allow multi selection of answers or not')
				.setRequired(true)
		)
		.addIntegerOption(option =>
			option
				.setName('duration')
				.setDescription('Duration of poll in hours (max 32 hours)')
				.setRequired(true)
		),
	 
	async execute(interaction) {
		try {
			const question = interaction.options.getString('question');
			const options = interaction.options
				.getString('options')
				.split(',')
				.map(option => option.trim());
			const multiSelect = interaction.options.getBoolean('multi_select');
			let duration = interaction.options.getInteger('duration');

			if (options.length < 2) {
				return interaction.reply('Please provide at least two options for the poll.');
			}

			// Convert hours to minutes and ensure it does not exceed 768 minutes
			const maxDuration = 768;
			duration = Math.min(duration * 60, maxDuration);

			await interaction.reply({
				content: 'Poll created successfully!',
				poll: {
					question: { text: question },
					answers: options.map(option => ({ text: option })),
					allowMultiselect: multiSelect,
					duration: duration, // Duration in minutes
					layoutType: PollLayoutType.Default,
				},
			});
		} catch (error) {
			console.error(error);
			await interaction.reply('An error occurred while creating the poll.');
		}
	},
};
