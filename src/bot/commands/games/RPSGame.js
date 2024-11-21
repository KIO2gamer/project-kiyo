const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	description_full:
		'An exciting game of Rock, Paper, Scissors, Lizard, Spock against the bot!',
	usage: '/rpsls <choice>',
	examples: [
		'/rpsls rock',
		'/rpsls paper',
		'/rpsls scissors',
		'/rpsls lizard',
		'/rpsls spock',
	],
	category: 'games',
	data: new SlashCommandBuilder()
		.setName('rpsls')
		.setDescription('Play Rock, Paper, Scissors, Lizard, Spock!')
		.addStringOption(option =>
			option
				.setName('choice')
				.setDescription('Choose your weapon!')
				.setRequired(true)
				.addChoices(
					{ name: 'Rock 🪨', value: 'rock' },
					{ name: 'Paper 📄', value: 'paper' },
					{ name: 'Scissors ✂️', value: 'scissors' },
					{ name: 'Lizard 🦎', value: 'lizard' },
					{ name: 'Spock 🖖', value: 'spock' },
				),
		),
	async execute(interaction) {
		const userChoice = interaction.options.getString('choice');
		const choices = ['rock', 'paper', 'scissors', 'lizard', 'spock'];
		const botChoice = choices[Math.floor(Math.random() * choices.length)];

		const emojis = {
			rock: '🪨',
			paper: '📄',
			scissors: '✂️',
			lizard: '🦎',
			spock: '🖖',
		};

		const winConditions = {
			rock: ['scissors', 'lizard'],
			paper: ['rock', 'spock'],
			scissors: ['paper', 'lizard'],
			lizard: ['paper', 'spock'],
			spock: ['rock', 'scissors'],
		};

		const actionDescriptions = {
			rock: { scissors: 'crushes', lizard: 'crushes' },
			paper: { rock: 'covers', spock: 'disproves' },
			scissors: { paper: 'cuts', lizard: 'decapitates' },
			lizard: { paper: 'eats', spock: 'poisons' },
			spock: { rock: 'vaporizes', scissors: 'smashes' },
		};

		let result = '';
		let action = '';

		if (userChoice === botChoice) {
			result = "It's a tie! Great minds think alike! 🤝";
		} else if (winConditions[userChoice].includes(botChoice)) {
			result = `You win! 🎉`;
			action = `${emojis[userChoice]} ${actionDescriptions[userChoice][botChoice]} ${emojis[botChoice]}`;
		} else {
			result = `You lose! Better luck next time! 😢`;
			action = `${emojis[botChoice]} ${actionDescriptions[botChoice][userChoice]} ${emojis[userChoice]}`;
		}

		const embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Rock, Paper, Scissors, Lizard, Spock')
			.setDescription(
				`You chose ${emojis[userChoice]} ${userChoice}.\nI chose ${emojis[botChoice]} ${botChoice}.\n\n${result}\n${action}`,
			)
			.setFooter({ text: 'As Sheldon Cooper would say, "Bazinga!"' });

		await interaction.reply({ embeds: [embed] });
	},
};
