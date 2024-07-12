const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skibidi')
        .setDescription('Gives you skibidi powers')
        .addStringOption(option => option
            .setName('option')
            .setDescription('Did you watched skibidi toilet?')
            .addChoices(
                { name: 'Yes', value: 'yes' },
                { name: 'No', value: 'no' }
            )
        .setRequired(true)),
    category: 'fun',
    async execute(interaction) {
        const option = interaction.options.getString('option')
        if (option === 'yes'){
            await interaction.reply('https://tenor.com/view/eeeeeehmazin-ehmazing-amazing-gif-1173311831093611344');
            await interaction.channel.send('**Skibidi powers activated successfully ✅**');
        }
        else {
            await interaction.reply('**You are not worthy enough to yield the powers, mortal**')
        }
    },
};
