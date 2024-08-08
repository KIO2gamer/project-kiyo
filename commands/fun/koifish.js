const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder().setName('koifish').setDescription('Fish'),
	category: 'fun',
	async execute(interaction) {
		interaction.reply(`https://tenor.com/view/schizoaz-lil-koi-big-nuts-lil-gif-18596477`)
	},
};
