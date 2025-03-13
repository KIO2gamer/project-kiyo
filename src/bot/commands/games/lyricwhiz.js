const {
	SlashCommandBuilder,
	EmbedBuilder,
	ActionRowBuilder,
	ButtonBuilder,
	ButtonStyle,
} = require('discord.js');
const axios = require('axios');

const LYRICS_API_BASE_URL = 'https://api.lyrics.ovh/v1'; // Free lyrics API base URL
const GAME_COLOR = '#7289DA'; // Discord Blurple for game embeds
const CORRECT_COLOR = '#4CAF50'; // Green for correct answers
const WRONG_COLOR = '#F44336'; // Red for wrong/time's up
const SKIP_COLOR = '#FFC107'; // Amber for skipped
const FINAL_COLOR = '#9C27B0'; // Purple for final score
const ERROR_COLOR = '#FF5722'; // Deep Orange for errors
const ROUND_DELAY = 5000; // Delay between rounds in milliseconds (5 seconds)
const GUESS_TIME = 30000; // Time to guess in milliseconds (30 seconds)
const MAX_ROUNDS = 5; // Maximum allowed rounds
const FILL_BLANK_CHAR = '_____'; // Character to represent blanks

// **New: Genres/Keywords List**
const GENRES_KEYWORDS = [
	'pop',
	'rock',
	'hip hop',
	'country',
	'electronic',
	'jazz',
	'classical',
	'blues',
	'folk',
	'indie',
	'metal',
	'reggae',
	'ska',
	'funk',
	'soul',
	'disco',
	'gospel',
	'r&b',
	'latin',
	'ballad',
	'dance',
	'summer hits',
	'love songs',
	'party music',
	'workout songs',
	'chill music',
	// Add more genres/keywords as you like!
];

const { MessageFlags } = require('discord.js');

module.exports = {
	category: 'games',
	data: new SlashCommandBuilder()
		.setName('lyricwhiz')
		.setDescription('Play a lyric fill-in-the-blanks guessing game!') // Updated description
		.addIntegerOption(option =>
			option
				.setName('rounds')
				.setDescription(`Number of rounds to play (1-${MAX_ROUNDS})`)
				.setRequired(true)
				.setMinValue(1)
				.setMaxValue(MAX_ROUNDS),
		),

	async execute(interaction) {
		const requestedRounds = interaction.options.getInteger('rounds');
		let score = 0;
		let currentRound = 0;
		const totalRounds = Math.min(requestedRounds, MAX_ROUNDS); // Limit rounds to MAX_ROUNDS

		const playRound = async () => {
			currentRound++;
			let songData;
			try {
				songData = await getRandomSongAndLyricsFromAPI(); // Use API to get random song and lyrics
			} catch (error) {
				handleError('Error fetching song data:', error);
				return interaction.editReply({
					embeds: [
						new EmbedBuilder()
							.setColor(ERROR_COLOR)
							.setTitle('Game Error')
							.setDescription(
								'Oops! Something went wrong while fetching a song. Please try again later.',
							),
					],
					flags: MessageFlags.Ephemeral,
				});
			}

			const { artist, title, lyrics, fillInLyrics } = songData; // Get fillInLyrics as well
			const questionEmbed = new EmbedBuilder()
				.setColor(GAME_COLOR)
				.setTitle(`Lyric Whiz - Round ${currentRound}/${totalRounds}`)
				.setDescription(
					`Fill in the blanks and guess the song:\n\n\`\`\`${fillInLyrics}\`\`\`\n\n**Hint:** Guess the song title or "song title by artist name"`,
				) // Updated description
				.setFooter({
					text: `You have ${GUESS_TIME / 1000} seconds to guess!`,
				});

			const actionRow = new ActionRowBuilder().addComponents(
				new ButtonBuilder()
					.setCustomId('skip')
					.setLabel('Skip')
					.setStyle(ButtonStyle.Secondary),
			);

			await interaction.editReply({
				embeds: [questionEmbed],
				components: [actionRow],
			});

			const buttonCollector = interaction.channel.createMessageComponentCollector({
				filter: i => i.user.id === interaction.user.id && i.customId === 'skip',
				time: GUESS_TIME,
			});

			const messageCollector = interaction.channel.createMessageCollector({
				filter: m => m.author.id === interaction.user.id,
				time: GUESS_TIME,
			});

			buttonCollector.on('collect', async i => {
				buttonCollector.stop('skipped');
				messageCollector.stop('skipped'); // Stop message collector as well
				await i.deferUpdate(); // Acknowledge button interaction
			});

			messageCollector.on('collect', async message => {
				const guess = message.content.toLowerCase().trim();
				const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9 ]/g, '');
				const normalizedArtist = artist.toLowerCase().replace(/[^a-z0-9 ]/g, '');

				// Allow multiple answer formats
				const matchPatterns = [
					normalizedTitle,
					`${normalizedTitle} by ${normalizedArtist}`,
					`${normalizedArtist} ${normalizedTitle}`,
				];

				if (matchPatterns.some(pattern => guess === pattern)) {
					score++;
					messageCollector.stop('correct');
					buttonCollector.stop('correct');
				}
			});

			// Combined collector end logic within buttonCollector's 'end' event
			buttonCollector.on('end', async (collected, reason) => {
				messageCollector.stop(reason); // Ensure messageCollector also ends with the same reason

				if (reason === 'correct') {
					const correctEmbed = new EmbedBuilder()
						.setColor(CORRECT_COLOR)
						.setTitle('🎉 Correct!')
						.setDescription(
							`You got it right!\nThe song is **"${title}"** by **${artist}**.\nYour current score: ${score}/${currentRound}`,
						);
					await interaction.followUp({ embeds: [correctEmbed] });
				} else if (reason === 'time') {
					const timeUpEmbed = new EmbedBuilder()
						.setColor(WRONG_COLOR)
						.setTitle("⏰ Time's up!")
						.setDescription(
							`Time ran out! The song was **"${title}"** by **${artist}**.\nYour current score: ${score}/${currentRound}`, // Updated message
						);
					await interaction.followUp({ embeds: [timeUpEmbed] });
				} else if (reason === 'skipped') {
					const skippedEmbed = new EmbedBuilder()
						.setColor(SKIP_COLOR)
						.setTitle('⏭️ Skipped!')
						.setDescription(
							`Skipped! No problem, the song was **"${title}"** by **${artist}**.\nYour current score: ${score}/${currentRound}`, // Updated message
						);
					await interaction.followUp({ embeds: [skippedEmbed] });
				}

				if (currentRound < totalRounds) {
					setTimeout(playRound, ROUND_DELAY);
				} else {
					const finalEmbed = new EmbedBuilder()
						.setColor(FINAL_COLOR)
						.setTitle('🏆 Game Over!')
						.setDescription(
							`Final Score: **${score}/${totalRounds}**\n\n${getFinalMessage(score, totalRounds)}`,
						);
					await interaction.followUp({ embeds: [finalEmbed] });
				}
			});
		};

		await interaction.deferReply(); // Defer reply to handle potential API delays
		playRound();
	},
};

// **Updated Function: getRandomSongAndLyricsFromAPI - Now uses lyrics.ovh search**
async function getRandomSongAndLyricsFromAPI() {
	const genreKeyword = selectRandomGenreKeyword();
	try {
		const searchResponse = await axios.get(
			`https://api.musixmatch.com/ws/1.1/track.search?apikey=${encodeURIComponent(process.env.MUSIXMATCH_API_KEY)}&q_track_artist=${encodeURIComponent(genreKeyword)}&f_has_lyrics=1&s_track_rating=desc&page_size=50`,
		);

		const tracks = searchResponse.data.message.body.track_list;
		if (!tracks?.length) throw new Error(`No tracks found for "${genreKeyword}"`);

		// Try up to 3 tracks before failing
		for (let i = 0; i < Math.min(3, tracks.length); i++) {
			const randomIndex = Math.floor(Math.random() * tracks.length);
			const track = tracks[randomIndex].track;
			const artist = encodeURIComponent(track.artist_name.replace(/\([^)]*\)/g, '').trim());
			const title = encodeURIComponent(track.track_name.replace(/\([^)]*\)/g, '').trim());

			try {
				const lyricsResponse = await axios.get(
					`${LYRICS_API_BASE_URL}/${artist}/${title}`,
					{ timeout: 5000 },
				);

				if (lyricsResponse.data?.lyrics) {
					const lyrics = lyricsResponse.data.lyrics;
					const fillInLyrics = createFillInLyrics(lyrics);
					return {
						artist: decodeURIComponent(artist),
						title: decodeURIComponent(title),
						lyrics,
						fillInLyrics,
					};
				}
			} catch (error) {
				if (error.response?.status !== 404) throw error;
				// Remove failed track and retry
				tracks.splice(randomIndex, 1);
			}
		}
		throw new Error(`No lyrics found for 3 random ${genreKeyword} tracks`);
	} catch (error) {
		handleError(`Lyric fetch error (${genreKeyword}):`, error.message);
		throw new Error(`Couldn't find lyrics for ${genreKeyword} tracks. Try another genre!`);
	}
}

// **New Function: selectRandomGenreKeyword**
function selectRandomGenreKeyword() {
	return GENRES_KEYWORDS[Math.floor(Math.random() * GENRES_KEYWORDS.length)];
}

function createFillInLyrics(lyrics) {
	// Preserve line breaks and stanza structure
	const lines = lyrics.split('\n');
	let fillInText = '';

	lines.forEach((line, lineIndex) => {
		if (line.trim() === '') return;
		const words = line.split(/(\s+)/); // Split including whitespace
		let lineOutput = '';

		words.forEach((word, wordIndex) => {
			if (word.trim() === '') {
				lineOutput += word;
				return;
			}

			// Blank out every 3rd meaningful word (preserves punctuation)
			if ((wordIndex + lineIndex) % 3 === 1) {
				lineOutput += FILL_BLANK_CHAR;
			} else {
				lineOutput += word;
			}
		});

		fillInText += lineOutput + '\n';
	});

	return fillInText;
}

function getFinalMessage(score, rounds) {
	const percentage = (score / rounds) * 100;
	if (percentage === 100) {
		return "🎶🎤 Perfect score! You're a true Lyric Whiz champion! 🏆";
	} else if (percentage >= 80) {
		return "🌟 You're a lyrical superstar! Amazing music knowledge! 🤩";
	} else if (percentage >= 60) {
		return 'Great job! You really know your music! Keep it up! 👍🎵';
	} else if (percentage >= 40) {
		return 'Not bad! You have a good ear for music! 🎧😊';
	} else if (percentage >= 20) {
		return 'Room for improvement! Time to update your playlist! 📻🔍';
	} else {
		return "Don't worry, everyone starts somewhere! Keep listening and playing! 🎹🌟";
	}
}
