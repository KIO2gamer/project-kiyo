const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('credits')
		.setDescription('Shows an embed of users who helped make this bot.'),
	category: 'utility',
	async execute(interaction) {
		const contributors = [
			{ command: 'steel', name: 'steeles.0', id: '1255822140251312244' },
			{ command: 'koifish', name: 'hallow_spice', id: '1255822140251312240' },
			{ command: 'donottouch', name: 'umbree_on_toast', id: '1255822140251312242' },
			{ command: 'rickroll', name: 'flashxdfx', id: '1255822140251312241' },
			{ command: 'summon', name: 'eesmal', id: '1255822140251312245' },
			{ command: 'snipe', name: 'na51f', id: '1255822140251312243' },
			{ command: 'photo', name: 'spheroidon', id: '1267798092669784106' },
			{ command: 'skibidi', name: 'zenoz231', id: '1259209405044359180' },
			{ command: 'quokka', name: 'wickiwacka2', id: '1261574222975864882' },
			{ command: 'uwu', name: 'rizzwan.', id: '1267834425002164235' },
			{ command: 'boba', name: 'pepsi_pro', id: '1268899141652713535' },
		];

		const embed = new EmbedBuilder()
			.setTitle('✨ Credits ✨')
			.setColor('#0099ff')
			.setDescription(
				'A big thank you to all the amazing contributors who helped make this bot possible!'
			)
			.setTimestamp()
			.setFooter({ text: 'Thanks to all the contributors!' });

		contributors.forEach(contributor => {
			embed.addFields([
				{
					name: `**${contributor.name}**`,
					value: `</${contributor.command}:${contributor.id}>`,
					inline: true,
				},
			]);
		});

		await interaction.reply({ embeds: [embed] });
	},
};
