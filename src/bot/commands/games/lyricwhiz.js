const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const axios = require('axios');

module.exports = {
	category: 'games',
	data: new SlashCommandBuilder()
		.setName('lyricwhiz')
		.setDescription('Play a lyric guessing game!')
		.addIntegerOption(option =>
			option
				.setName('rounds')
				.setDescription('Number of rounds to play (1-5)')
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(5),
		),

	async execute(interaction) {
		const rounds = interaction.options.getInteger('rounds');
		let score = 0;
		let currentRound = 0;

		const playRound = async () => {
			currentRound++;
			try {
				let lyrics = '';
				let randomTrack;
				let attempts = 0;
				const maxAttempts = 5;

				while (!lyrics && attempts < maxAttempts) {
					const response = await axios.get(
						'https://api.musixmatch.com/ws/1.1/track.search',
						{
							params: {
								apikey: process.env.MUSIXMATCH_API_KEY,
								f_has_lyrics: 1,
								page_size: 100,
								page: 1,
							},
						},
					);

					const tracks = response.data.message.body.track_list;
					randomTrack =
						tracks.length > 0
							? tracks[Math.floor(Math.random() * tracks.length)]
								.track
							: null;

					const lyricsResponse = await axios.get(
						'https://api.musixmatch.com/ws/1.1/track.lyrics.get',
						{
							params: {
								apikey: process.env.MUSIXMATCH_API_KEY,
								track_id: randomTrack.track_id,
							},
						},
					);

					lyrics =
						lyricsResponse.data.message.body.lyrics.lyrics_body;

					if (!lyrics) {
						attempts++;
					}
				}

				if (!lyrics) {
					throw new Error(
						'Unable to find a song with lyrics after multiple attempts',
					);
				}

				const artist = randomTrack.artist_name;
				const title = randomTrack.track_name;

				const lines = lyrics
					.split('\n')
					.filter(
						line =>
							line.trim() !== '' &&
							!line.includes(
								'This Lyrics is NOT for Commercial use',
							),
					);
				const shuffledLines = lines.toSorted(() => 0.5 - Math.random());
				const randomLines = shuffledLines.slice(0, 3);

				const descriptionLines = randomLines
					.map(line => `"${line}"`)
					.join('\n\n');
				const description = `Guess the song from these lyrics:\n\n${descriptionLines}`;

				const questionEmbed = new EmbedBuilder()
					.setColor('#0099ff')
					.setTitle(`Lyric Whiz - Round ${currentRound}/${rounds}`)
					.setDescription(description)
					.setFooter({ text: 'You have 30 seconds to guess!' });

				const row = new ActionRowBuilder().addComponents(
					new ButtonBuilder()
						.setCustomId('skip')
						.setLabel('Skip')
						.setStyle(ButtonStyle.Secondary),
				);

				await interaction.editReply({
					embeds: [questionEmbed],
					components: [row],
				});

				const filter = i => i.user.id === interaction.user.id;
				const collector =
					interaction.channel.createMessageComponentCollector({
						filter,
						time: 30000,
					});

				collector.on('collect', async i => {
					if (i.customId === 'skip') {
						collector.stop('skipped');
					}
				});

				const messageCollector =
					interaction.channel.createMessageCollector({
						filter: m => m.author.id === interaction.user.id,
						time: 30000,
					});

				messageCollector.on('collect', async message => {
					const guess = message.content.toLowerCase();
					const correctTitle = title.toLowerCase();
					const correctArtist = artist.toLowerCase();

					if (
						guess.includes(correctTitle) ||
						guess.includes(correctArtist)
					) {
						score++;
						const correctEmbed = new EmbedBuilder()
							.setColor('#00ff00')
							.setTitle('Correct!')
							.setDescription(
								`You got it right!\nThe song is "${title}" by ${artist}.\nYour current score: ${score}/${currentRound}`,
							);

						await interaction.followUp({ embeds: [correctEmbed] });
						collector.stop('correct');
					}
				});

				collector.on('end', async (collected, reason) => {
					if (reason === 'time') {
						const timeUpEmbed = new EmbedBuilder()
							.setColor('#ff0000')
							.setTitle('Time\'s up!')
							.setDescription(
								`The correct answer was "${title}" by ${artist}.\nYour current score: ${score}/${currentRound}`,
							);

						await interaction.followUp({ embeds: [timeUpEmbed] });
					}
					else if (reason === 'skipped') {
						const skippedEmbed = new EmbedBuilder()
							.setColor('#ffa500')
							.setTitle('Skipped!')
							.setDescription(
								`The song was "${title}" by ${artist}.\nYour current score: ${score}/${currentRound}`,
							);

						await interaction.followUp({ embeds: [skippedEmbed] });
					}

					if (currentRound < rounds) {
						setTimeout(playRound, 5000);
					}
					else {
						const finalEmbed = new EmbedBuilder()
							.setColor('#9932cc')
							.setTitle('Game Over!')
							.setDescription(
								`Final Score: ${score}/${rounds}\n\n${getFinalMessage(score, rounds)}`,
							);

						await interaction.followUp({ embeds: [finalEmbed] });
					}
				});
			}
			catch (error) {
				console.error('Error in lyricwhiz command:', error);
				const errorEmbed = new EmbedBuilder()
					.setColor('#ff0000')
					.setTitle('Error')
					.setDescription(
						'Sorry, there was an error while trying to play the game. Please try again later.',
					);

				await interaction.editReply({ embeds: [errorEmbed] });
			}
		};

		playRound();
	},
};

function getFinalMessage(score, rounds) {
	const percentage = (score / rounds) * 100;
	if (percentage === 100) {return 'Perfect score! You\'re a true Lyric Whiz! 🎵🏆';}
	if (percentage >= 80) return 'Wow! You\'re a lyrical genius! 🎶😎';
	if (percentage >= 60) {return 'Great job! You\'ve got some serious music knowledge! 🎸👍';}
	if (percentage >= 40) return 'Not bad! Keep listening to more music! 🎧😊';
	if (percentage >= 20) {return 'Room for improvement! Time to update your playlist! 📻🔍';}
	return 'Don\'t worry, even the greatest musicians started somewhere! Keep practicing! 🎹🌟';
}
