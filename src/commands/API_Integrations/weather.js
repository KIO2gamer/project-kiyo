const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require("discord.js");

const axios = require("axios");

module.exports = {
    description_full:
        "Fetches and displays the current weather for a given city using the WeatherAPI. Information includes temperature, feels like temperature, humidity, wind, pressure, UV index, and more.",
    usage: "/weather <city>",
    examples: ["/weather London", "/weather \"New York\""],

    data: new SlashCommandBuilder()
        .setName("weather")
        .setDescription("Get the current weather for a location")
        .addStringOption((option) =>
            option
                .setName("location")
                .setDescription("The city to get weather for")
                .setRequired(true),
        ),

    async execute(interaction) {
        const city = interaction.options.getString("location");
        const apiKey = process.env.WEATHER_API_KEY;

        if (!apiKey) {
            await interaction.reply({
                content:
                    "Weather service is not properly configured. Please contact an administrator.",
                ephemeral: true,
            });
            return;
        }

        try {
            // Validate city name
            if (!/^[a-zA-Z\s,.-]+$/.test(city)) {
                await interaction.reply({
                    content:
                        "Please provide a valid city name using only letters, spaces, and basic punctuation.",
                    ephemeral: true,
                });
                return;
            }

            const baseUrl = "https://api.openweathermap.org/data/2.5/weather";
            const params = new URLSearchParams({
                q: city,
                appid: apiKey,
                units: "metric",
            });

            const response = await axios.get(`${baseUrl}?${params.toString()}`);

            const weatherData = response.data;
            const embed = new EmbedBuilder()
                .setTitle(`Weather in ${weatherData.name}, ${weatherData.sys.country}`)
                .setDescription(`Current weather conditions for ${city}`)
                .addFields(
                    {
                        name: "🌡️ Temperature",
                        value: `${Math.round(weatherData.main.temp)}°C (Feels like ${Math.round(weatherData.main.feels_like)}°C)`,
                        inline: true,
                    },
                    {
                        name: "💧 Humidity",
                        value: `${weatherData.main.humidity}%`,
                        inline: true,
                    },
                    {
                        name: "🌪️ Wind",
                        value: `${weatherData.wind.speed} m/s`,
                        inline: true,
                    },
                    {
                        name: "☁️ Conditions",
                        value:
                            weatherData.weather[0].description.charAt(0).toUpperCase() +
                            weatherData.weather[0].description.slice(1),
                        inline: true,
                    },
                )
                .setColor("#0099ff")
                .setTimestamp()
                .setFooter({
                    text: "Powered by OpenWeatherMap",
                    iconURL:
                        "https://openweathermap.org/img/w/" + weatherData.weather[0].icon + ".png",
                });

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error("Weather API error:", error);

            let errorMessage = "An unexpected error occurred while fetching weather data.";

            if (error.response) {
                switch (error.response.status) {
                case 404:
                    errorMessage = `Could not find weather data for "${city}". Please check the city name and try again.`;
                    break;
                case 401:
                    errorMessage =
                            "Weather API authentication failed. Please contact an administrator.";
                    break;
                case 429:
                    errorMessage = "Weather API rate limit reached. Please try again later.";
                    break;
                default:
                    errorMessage =
                            "Weather service is currently unavailable. Please try again later.";
                }
            } else if (error.request) {
                errorMessage = "Could not connect to the weather service. Please try again later.";
            }

            await interaction.reply({ content: errorMessage, ephemeral: true });
        }
    },
};
