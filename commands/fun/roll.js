const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('roll')
		.setDescription('Roll a dice.'),
	category: 'fun',
    async execute(interaction) {
        const sides = 6; // You can customize the number of sides
        const roll = Math.floor(Math.random() * sides) + 1;
        const rollEmbed = new EmbedBuilder()
            .setTitle(`You rolled a ${roll}!`)
            .setColor('#00ff00')
            .setFooter({
                text: `Executed by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        await interaction.reply({ embeds: [rollEmbed] });
    }
}