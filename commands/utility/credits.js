const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('credits')
		.setDescription('Shows an embed of users who helped make this bot.'),
	category: 'utility',
	async execute(interaction) {
		const embed = new EmbedBuilder()
			.setTitle('✨ Credits ✨')
			.setColor('#0099ff')
			.setDescription(
				'__**Slash Commands Contributors:**__\n\n' +
					'</steel:1255822140251312244> - **steeles.0**\n' +
					'</koifish:1255822140251312240> - **hallow_spice**\n' +
					'</donottouch:1255822140251312242> - **umbree_on_toast**\n' +
					'</rickroll:1255822140251312241> - **flashxdfx**\n' +
					'</summon:1255822140251312245> - **eesmal**\n' +
					'</snipe:1255822140251312243> - **na51f**\n' +
					'</photo:1267798092669784106> - **spheroidon**\n' +
					'</skibidi:1259209405044359180> - **zenoz231**\n' +
					'</quokka:1261574222975864882> - **wickiwacka2**\n' +
					'</uwu:1267834425002164235> - **rizzwan.**\n' +
					'</boba:1268899141652713535> - **pepsi_pro**'
			)
			.setFooter({ text: 'Thanks to all the contributors!' });

		await interaction.reply({ embeds: [embed] });
	},
};
