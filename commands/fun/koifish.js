const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	description_full: '',
	usage: '',
	examples: ['', ''],
	data: new SlashCommandBuilder().setName('koifish').setDescription('Fish'),

	async execute(interaction) {
		interaction.reply(`https://tenor.com/view/schizoaz-lil-koi-big-nuts-lil-gif-18596477`);
	},
};
