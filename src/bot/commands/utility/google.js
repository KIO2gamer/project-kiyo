const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

const GOOGLE_BLUE = '#4285F4'; // Google Blue color
const GOOGLE_RED = '#EA4335'; // Google Red color for errors
const MAX_RESULTS = 5; // Number of search results to display
const MAX_SNIPPET_LENGTH = 200; // Max characters for snippet in embed

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full:
		'Searches Google for the given query and displays the top results.',
	usage: '/google <query>',
	examples: [
		'/google discord bot tutorial',
		'/google best restaurants near me',
	],
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('google')
		.setDescription('Search Google for a query')
		.addStringOption((option) =>
			option
				.setName('query')
				.setDescription('The search query')
				.setRequired(true),
		),

	async execute(interaction) {
		const query = interaction.options.getString('query');
		const apiKey = process.env.GOOGLE_API_KEY;
		const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

		if (!apiKey || !searchEngineId) {
			handleError(
				'Google API key or Search Engine ID not found in environment variables.',
			);
			return interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(GOOGLE_RED)
						.setTitle('⚙️ Command Configuration Error')
						.setDescription(
							'The Google Search command is not properly configured by the server administrator.\n\nPlease inform them to set up the `GOOGLE_API_KEY` and `GOOGLE_SEARCH_ENGINE_ID` environment variables.',
						),
				],
				flags: MessageFlags.Ephemeral,
			});
		}

		try {
			const response = await axios.get(
				'https://www.googleapis.com/customsearch/v1',
				{
					params: {
						key: apiKey,
						cx: searchEngineId,
						q: query,
					},
				},
			);

			const results = response.data.items?.slice(0, MAX_RESULTS) || []; // Safely access items and limit results

			if (results.length === 0) {
				return interaction.reply({
					embeds: [
						new EmbedBuilder()
							.setColor(GOOGLE_BLUE)
							.setTitle(`🔍 No Results for "${query}"`)
							.setDescription(
								`Unfortunately, Google Custom Search did not return any relevant results for the query: \`${query}\`. \n\nPlease try a different or broader search term.`,
							),
					],
					flags: MessageFlags.Ephemeral,
				});
			}

			const embed = new EmbedBuilder()
				.setColor(GOOGLE_BLUE)
				.setTitle(`🔍 Google Search Results for: "${query}"`) // More descriptive title
				.setDescription(
					`Here are the top ${results.length} search results for your query:\n\n`, // Introduction in description
				)
				.setURL(
					`https://www.google.com/search?q=${encodeURIComponent(query)}`,
				) // Link to Google search page
				.setTimestamp()
				.setFooter({ text: 'Powered by Google Custom Search' }); // Footer for attribution

			let resultList = ''; // Build the result list string for the description

			results.forEach((item, index) => {
				const title = item.title;
				const link = item.link;
				let snippet = item.snippet || 'No description available.'; // Fallback for missing snippet

				// Clean up snippet and truncate if necessary
				snippet = snippet.replace(/(\r\n|\n|\r)/gm, ' ').trim(); // Replace line breaks with spaces and trim
				if (snippet.length > MAX_SNIPPET_LENGTH) {
					snippet = snippet.substring(0, MAX_SNIPPET_LENGTH) + '...'; // Truncate and add ellipsis
				}

				resultList += `${index + 1}. **[${title}](${link})**\n`; // Markdown title and link
				resultList += `${snippet}\n\n`; // Snippet with spacing
			});

			embed.setDescription(embed.data.description + resultList); // Append results to description

			await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
		} catch (error) {
			handleError('Error performing Google search:', error);
			let errorMessage =
				'An error occurred while performing the search. Please try again later.';

			if (error.response) {
				// API error details
				errorMessage = `Google Search API Error: ${error.response.status} ${error.response.statusText}\n${error.response.data?.error?.message || 'No detailed error message available.'}`;
				handleError('Google API Error Details:', error.response.data); // Log detailed API error
			} else if (error.request) {
				errorMessage =
					'Error reaching Google Search API. Please check your internet connection or the service might be temporarily unavailable.';
			}

			await interaction.reply({
				embeds: [
					new EmbedBuilder()
						.setColor(GOOGLE_RED)
						.setTitle('⚠️ Search Error')
						.setDescription(errorMessage),
				],
				flags: MessageFlags.Ephemeral,
			});
		}
	},
};
