const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('guessthenumber')
		.setDescription('Try to guess the secret number between 1 and 100!'),
	async execute(interaction) {
		const randomNumber = Math.floor(Math.random() * 100) + 1;
		let guessesLeft = 7;
		let gameWon = false; // Flag to track if the game has been won

		await interaction.reply(
			"I've chosen a secret number between 1 and 100. You have 7 guesses!"
		);

		// Timer message
		let timeLeft = 30; // Seconds
		const timerMessage = await interaction.followUp(`Time Remaining: ${timeLeft} seconds`);

		const countdown = setInterval(async () => {
			if (!gameWon) {
				// Only decrement if the game hasn't been won
				timeLeft--;
				if (timeLeft >= 0) {
					await timerMessage.edit(`Time Remaining: ${timeLeft} seconds`);
				}
			}

			if (timeLeft <= 0 && !gameWon) {
				clearInterval(countdown);
				await timerMessage.edit("Time's up!");
				interaction.followUp(`The number was ${randomNumber}.`);
			}
		}, 1000);

		// Guess collection
		const filter = m => !isNaN(m.content) && m.author.id === interaction.user.id;
		const collector = interaction.channel.createMessageCollector({
			filter,
			max: guessesLeft,
			time: 30000,
		});

		collector.on('collect', async msg => {
			const guess = parseInt(msg.content);

			if (guess === randomNumber) {
				gameWon = true; // Set the flag when the game is won
				clearInterval(countdown); // Stop the timer
				await timerMessage.edit(
					`<@${msg.author.id}> guessed the number! It was ${randomNumber}!`
				);
				collector.stop('win'); // Stop further guesses
			} else if (guess < randomNumber) {
				guessesLeft--;
				interaction.followUp(`Too low! You have ${guessesLeft} guesses left.`);
			} else {
				guessesLeft--;
				interaction.followUp(`Too high! You have ${guessesLeft} guesses left.`);
			}
		});
	},
};
