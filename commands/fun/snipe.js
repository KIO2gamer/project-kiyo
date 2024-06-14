const { EmbedBuilder, SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
       .setName('snipe')
       .setDescription('Snipes the user')
       .addUserOption(option => option
            .setName('user')
            .setDescription('The user to snipe')
            .setRequired(true)
        ),
    category:'fun',
    async execute(interaction) {
        const userOption = interaction.options.getUser('user');
        const userId = userOption.id;
        const embed = new EmbedBuilder()
            .setTitle('Sniped Successful')
            .setDescription(`Your target (<@${userId}>) has been sniped.`)
            .setColor('#00ff00')
            .setFooter({ text: `Executed by ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() });
        await interaction.channel.send({ content: `https://tenor.com/view/family-guy-peter-griffin-gun-point-sniper-rifle-gif-16445332` }) && interaction.channel.send({ embeds: [embed] });
    }
}