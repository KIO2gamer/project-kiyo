const { SlashCommandBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('game')
		.setDescription('Fetches game information')
		.addStringOption(option =>
			option.setName('search').setDescription('Name of the game').setRequired(true)
		),
	category: 'info',
	async execute(interaction) {
		const gameName = interaction.options.getString('search');

		try {
			const response = await fetch(
				`https://api.rawg.io/api/games?key=${process.env.RAWG_API_KEY}&search=${encodeURIComponent(gameName)}`
			);
			const data = await response.json();

			if (data.results && data.results.length > 0) {
				const game = data.results[0];

				await interaction.reply({
					content: `**${game.name}**\n\n${game.description_raw}\n\nGenres: ${game.genres.map(g => g.name).join(', ')}\nRelease Date: ${game.released}`,
					embeds: [
						{
							image: {
								url: game.background_image,
							},
						},
					],
				});
			} else {
				await interaction.reply('No game found with that name.');
			}
		} catch (error) {
			console.error(error);
			await interaction.reply('An error occurred while fetching game info.');
		}
	},
};
