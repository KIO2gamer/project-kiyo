const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('credits')
		.setDescription('Shows an embed of users who helped make this bot.'),
	category: 'utility',
	async execute(interaction) {
		const embed = new EmbedBuilder().setTitle('Credits').setColor('Random').setDescription(`
                __**Slash Commands Contributors:**__
                </steel:1204487408511483976> - steeles.0
                </koifish:1204462350913114159> - hallow_spice
                </donottouch:1204459199686377562> - umbree_on_toast
                </rickroll:1204438699258155049> - flashxdfx
                </summon:1230217345985941574> - eesmal
                </snipe:1230417868013699072> - na51f
            `);

		await interaction.reply({ embeds: [embed] });
	},
};
