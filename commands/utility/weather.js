const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const axios = require('axios');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weather')
        .setDescription('Get the current weather for a location.')
        .addStringOption(option =>
            option
                .setName('location')
                .setDescription('The location for which you want the weather.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option
                .setName('temperature')
                .setDescription('Choose the temperature format.')
                .setRequired(true)
                .addChoices({ name: 'Fahrenheit', value: 'F' }, { name: 'Celsius', value: 'C' })
        ),
    category: 'utility',
    async execute(interaction) {
        const location = interaction.options.getString('location');
        const temperatureFormat = interaction.options.getString('temperature');

        try {
            const response = await axios.get(
                `https://api.weatherapi.com/v1/current.json?key=ea32f85feec2496aac1152011231112&q=${encodeURIComponent(location)}&aqi=no`
            );
            const weatherData = response.data;

            let temp = weatherData.current.temp_c;
            if (temperatureFormat === 'F') {
                temp = weatherData.current.temp_f;
            }
            let feel = weatherData.current.feelslike_c;
            if (temperatureFormat === 'F') {
                feel = weatherData.current.feelslike_f;
            }
            const type = weatherData.current.condition.text;
            const name = weatherData.location.name;
            const icon = weatherData.current.condition.icon;
            const wind = weatherData.current.wind_mph;
            const pressure = weatherData.current.pressure_mb;

            const embed = new EmbedBuilder()
                .setColor('Blue')
                .setTitle(`Current weather of ${name}`)
                .addFields(
                    { name: `Temperature`, value: `${temp}°${temperatureFormat}`, inline: true },
                    { name: 'Feels Like', value: `${feel}°${temperatureFormat}`, inline: true },
                    { name: 'Weather', value: `${type}`, inline: true },
                    { name: 'Pressure', value: `${pressure}pa`, inline: true },
                    {
                        name: 'Wind Speed, Angle & Direction',
                        value: `${wind}mph at angle of ${weatherData.current.wind_degree}° in ${weatherData.current.wind_dir}`,
                        inline: true,
                    }
                )
                .setThumbnail(`https:${icon}`);

            await interaction.reply({ content: '', embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.reply({
                content: 'An error occurred while fetching the weather data.',
                ephemeral: true,
            });
        }
    },
};
