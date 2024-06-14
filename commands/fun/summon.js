const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
       .setName('summon')
       .setDescription('Summons the user from the undead')
       .addUserOption(option => option
            .setName('user')
            .setDescription('The user to summon')
            .setRequired(true)
        ),
    category:'fun',
    async execute(interaction) {
        const userOption = interaction.options.getUser('user');
        const userId = userOption.id;
        const embed = new EmbedBuilder()
            .setTitle('Summon Successful')
            .setDescription(`Summoned <@${userId}>`)
            .setColor('#00ff00');
        await interaction.channel.send({ content: `https://tenor.com/view/cat-spiritus-summon-vintage-fountain-pen-gif-22872604` }) && interaction.channel.send({ embeds: [embed] });
    }
}