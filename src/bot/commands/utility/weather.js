const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { handleError } = require('../../utils/errorHandler');
const axios = require('axios');

const { MessageFlags } = require('discord.js');

module.exports = {
	description_full:
		'Fetches and displays the current weather for a given city using the WeatherAPI. Information includes temperature, feels like temperature, humidity, wind, pressure, UV index, and more.',
	usage: '/weather <city>',
	examples: ['/weather London', '/weather "New York"'],
	category: 'utility',
	data: new SlashCommandBuilder()
		.setName('weather')
		.setDescription('Get the current weather for a location')
		.addStringOption(option =>
			option
				.setName('location')
				.setDescription('The city to get weather for')
				.setRequired(true)
		),

	async execute(interaction) {
		const city = interaction.options.getString('location');
		const apiKey = process.env.WEATHER_API_KEY;

		if (!apiKey) {
			await handleError(
				interaction,
				new Error('Weather API key is not configured.'),
				'API',
				'The weather service is not properly configured.'
			);
			return;
		}

		try {
			// Validate city name
			if (!/^[a-zA-Z\s,.-]+$/.test(city)) {
				await handleError(
					interaction,
					new Error('Invalid city name format.'),
					'VALIDATION',
					'Please provide a valid city name using only letters, spaces, and basic punctuation.'
				);
				return;
			}

			const response = await axios.get(
				`http://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`
			);

			const weatherData = response.data;
			const embed = new EmbedBuilder()
				.setTitle(`Weather in ${weatherData.name}, ${weatherData.sys.country}`)
				.setDescription(`Current weather conditions for ${city}`)
				.addFields(
					{
						name: '🌡️ Temperature',
						value: `${Math.round(weatherData.main.temp)}°C (Feels like ${Math.round(weatherData.main.feels_like)}°C)`,
						inline: true
					},
					{
						name: '💧 Humidity',
						value: `${weatherData.main.humidity}%`,
						inline: true
					},
					{
						name: '🌪️ Wind',
						value: `${weatherData.wind.speed} m/s`,
						inline: true
					},
					{
						name: '☁️ Conditions',
						value: weatherData.weather[0].description.charAt(0).toUpperCase() +
							weatherData.weather[0].description.slice(1),
						inline: true
					}
				)
				.setColor('#0099ff')
				.setTimestamp()
				.setFooter({
					text: 'Powered by OpenWeatherMap',
					iconURL: 'https://openweathermap.org/img/w/' + weatherData.weather[0].icon + '.png'
				});

			await interaction.reply({ embeds: [embed] });

		} catch (error) {
			if (error.response) {
				switch (error.response.status) {
					case 404:
						await handleError(
							interaction,
							new Error(`Could not find weather data for "${city}"`),
							'VALIDATION',
							'Please check the city name and try again.'
						);
						break;
					case 401:
						await handleError(
							interaction,
							error,
							'API',
							'Weather API authentication failed.'
						);
						break;
					case 429:
						await handleError(
							interaction,
							error,
							'RATE_LIMIT',
							'Weather API rate limit reached. Please try again later.'
						);
						break;
					default:
						await handleError(
							interaction,
							error,
							'API',
							'Weather service is currently unavailable.'
						);
				}
			} else if (error.request) {
				await handleError(
					interaction,
					error,
					'API',
					'Could not connect to the weather service. Please try again later.'
				);
			} else {
				await handleError(
					interaction,
					error,
					'COMMAND_EXECUTION',
					'An unexpected error occurred while fetching weather data.'
				);
			}
		}
	},
};
