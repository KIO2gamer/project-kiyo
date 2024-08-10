const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
	data: new SlashCommandBuilder().setName('hangman').setDescription('Play a game of Hangman!'),
	async execute(interaction) {
		const wordToGuess = getWordToGuess();
		let wordDisplay = '_ '.repeat(wordToGuess.length).trim();
		let incorrectGuesses = 0;
		const maxIncorrectGuesses = 6;
		const guessedLetters = [];

		let embed = new EmbedBuilder()
			.setColor('#0099ff')
			.setTitle('Hangman')
			.setDescription(`Word: ${wordDisplay}`)
			.addFields(
				{ name: 'Incorrect Guesses', value: `${incorrectGuesses}/${maxIncorrectGuesses}` },
				{
					name: 'Guessed Letters',
					value: guessedLetters.length > 0 ? guessedLetters.join(', ') : 'None',
				}
			);

		await interaction.reply({ embeds: [embed] });

		const filter = m => !m.author.bot && m.content.length === 1 && /^[a-zA-Z]$/.test(m.content);
		const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

		collector.on('collect', async msg => {
			const guess = msg.content.toLowerCase();

			if (guessedLetters.includes(guess)) {
				await msg.reply('You already guessed that letter!');
				return;
			}

			guessedLetters.push(guess);

			if (wordToGuess.includes(guess)) {
				let updatedWordDisplay = '';
				for (let i = 0; i < wordToGuess.length; i++) {
					if (wordToGuess[i] === guess || wordDisplay[i * 2] !== '_') {
						updatedWordDisplay += wordDisplay[i * 2] + ' ';
					} else {
						updatedWordDisplay += '\_';
					}
				}
				updatedWordDisplay = updatedWordDisplay.trim();

				embed.setDescription(`Word: ${updatedWordDisplay}`);
				await msg.reply({ embeds: [embed] });

				if (updatedWordDisplay.replace(/\s/g, '') === wordToGuess) {
					collector.stop('won');
				}
			} else {
				incorrectGuesses++;
				embed.setFields(
					{
						name: 'Incorrect Guesses',
						value: `${incorrectGuesses}/${maxIncorrectGuesses}`,
					},
					{ name: 'Guessed Letters', value: guessedLetters.join(', ') }
				);
				await msg.reply({ embeds: [embed] });

				if (incorrectGuesses >= maxIncorrectGuesses) {
					collector.stop('lost');
				}
			}
		});

		collector.on('end', (collected, reason) => {
			if (reason === 'won') {
				embed.setDescription(`You won! The word was **${wordToGuess}**`);
				embed.setColor('#00FF00');
				interaction.followUp({ embeds: [embed] });
			} else if (reason === 'lost') {
				embed.setDescription(`You lost! The word was **${wordToGuess}**`);
				embed.setColor('#FF0000');
				interaction.followUp({ embeds: [embed] });
			} else {
				embed.setDescription(`Time's up! The word was **${wordToGuess}**`);
				interaction.followUp({ embeds: [embed] });
			}
		});
	},
};

function getWordToGuess() {
	const wordListFile = path.join('./assets/texts/hangmanWords.txt');
	const fileContent = fs.readFileSync(wordListFile, 'utf-8');
	const words = fileContent.split('\n');
	const randomIndex = Math.floor(Math.random() * words.length);
	return words[randomIndex];
}
