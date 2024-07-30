const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('credits')
		.setDescription('Shows an embed of users who helped make this bot.'),
	category: 'utility',
	async execute(interaction) {
		const embed = new EmbedBuilder().setTitle('Credits').setColor('Random').setDescription(`
                __**Slash Commands Contributors:**__

                </steel:1255822140251312244> - steeles.0
                </koifish:1255822140251312240> - hallow_spice
                </donottouch:1255822140251312242> - umbree_on_toast
                </rickroll:1255822140251312241> - flashxdfx
                </summon:1255822140251312245> - eesmal
                </snipe:1255822140251312243> - na51f
                </photo:1267798092669784106> - spheroidon
                </skibidi:1259209405044359180> - zenoz231
                </quokka:1261574222975864882> - wickiwacka2
            `);

		await interaction.reply({ embeds: [embed] });
	},
};
