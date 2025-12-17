const {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    EmbedBuilder,
    SlashCommandBuilder,
    MessageFlags,
} = require("discord.js");
const { handleError } = require("../../utils/errorHandler");
const axios = require("axios");

// Primary/secondary lyrics sources and track search
const LRCLIB_BASE_URL = "https://lrclib.net/api"; // Free, no key
const ITUNES_SEARCH_BASE_URL = "https://itunes.apple.com/search"; // Free, no key, for track discovery
const VAGALUME_BASE_URL = "https://api.vagalume.com.br/search.php"; // Free tier key (optional)
const LYRICS_OVH_BASE_URL = "https://api.lyrics.ovh/v1"; // Fallback, no key
const GAME_COLOR = "#7289DA"; // Discord Blurple for game embeds
const CORRECT_COLOR = "#4CAF50"; // Green for correct answers
const WRONG_COLOR = "#F44336"; // Red for wrong/time's up
const SKIP_COLOR = "#FFC107"; // Amber for skipped
const FINAL_COLOR = "#9C27B0"; // Purple for final score
const ERROR_COLOR = "#FF5722"; // Deep Orange for errors
const ROUND_DELAY = 5000; // Delay between rounds in milliseconds (5 seconds)
const GUESS_TIME = 30000; // Time to guess in milliseconds (30 seconds)
const MAX_ROUNDS = 5; // Maximum allowed rounds
const FILL_BLANK_CHAR = "_____"; // Character to represent blanks

// Popular genres/keywords only (kept short for better matching)
const GENRES_KEYWORDS = [
    "pop",
    "rock",
    "hip hop",
    "r&b",
    "electronic",
    "dance",
    "country",
    "latin",
    "indie",
    "metal",
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName("lyricwhiz")
        .setDescription("Play a lyric fill-in-the-blanks guessing game!") // Updated description
        .addIntegerOption((option) =>
            option
                .setName("rounds")
                .setDescription(`Number of rounds to play (1-${MAX_ROUNDS})`)
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(MAX_ROUNDS),
        ),

    async execute(interaction) {
        const requestedRounds = interaction.options.getInteger("rounds");
        let score = 0;
        let currentRound = 0;
        const totalRounds = Math.min(requestedRounds, MAX_ROUNDS); // Limit rounds to MAX_ROUNDS

        const playRound = async () => {
            currentRound++;
            let songData;
            try {
                songData = await getRandomSongAndLyricsFromAPI(); // Use API to get random song and lyrics
            } catch (error) {
                handleError("Error fetching song data:", error);
                return interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(ERROR_COLOR)
                            .setTitle("Game Error")
                            .setDescription(
                                "Oops! Something went wrong while fetching a song. Please try again later.",
                            ),
                    ],
                    flags: MessageFlags.Ephemeral,
                });
            }

            const { artist, title, fillInLyrics } = songData; // Get fillInLyrics as well
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
                    .setCustomId("skip")
                    .setLabel("Skip")
                    .setStyle(ButtonStyle.Secondary),
            );

            await interaction.editReply({
                embeds: [questionEmbed],
                components: [actionRow],
            });

            const buttonCollector = interaction.channel.createMessageComponentCollector({
                filter: (i) => i.user.id === interaction.user.id && i.customId === "skip",
                time: GUESS_TIME,
            });

            const messageCollector = interaction.channel.createMessageCollector({
                filter: (m) => m.author.id === interaction.user.id,
                time: GUESS_TIME,
            });

            buttonCollector.on("collect", async (i) => {
                buttonCollector.stop("skipped");
                messageCollector.stop("skipped"); // Stop message collector as well
                await i.deferUpdate(); // Acknowledge button interaction
            });

            messageCollector.on("collect", async (message) => {
                const guess = message.content.toLowerCase().trim();
                const normalizedTitle = title.toLowerCase().replace(/[^a-z0-9 ]/g, "");
                const normalizedArtist = artist.toLowerCase().replace(/[^a-z0-9 ]/g, "");

                // Allow multiple answer formats
                const matchPatterns = [
                    normalizedTitle,
                    `${normalizedTitle} by ${normalizedArtist}`,
                    `${normalizedArtist} ${normalizedTitle}`,
                ];

                if (matchPatterns.some((pattern) => guess === pattern)) {
                    score++;
                    messageCollector.stop("correct");
                    buttonCollector.stop("correct");
                }
            });

            // Combined collector end logic within buttonCollector's 'end' event
            buttonCollector.on("end", async (collected, reason) => {
                messageCollector.stop(reason); // Ensure messageCollector also ends with the same reason

                if (reason === "correct") {
                    const correctEmbed = new EmbedBuilder()
                        .setColor(CORRECT_COLOR)
                        .setTitle("🎉 Correct!")
                        .setDescription(
                            `You got it right!\nThe song is **"${title}"** by **${artist}**.\nYour current score: ${score}/${currentRound}`,
                        );
                    await interaction.followUp({ embeds: [correctEmbed] });
                } else if (reason === "time") {
                    const timeUpEmbed = new EmbedBuilder()
                        .setColor(WRONG_COLOR)
                        .setTitle("⏰ Time's up!")
                        .setDescription(
                            `Time ran out! The song was **"${title}"** by **${artist}**.\nYour current score: ${score}/${currentRound}`, // Updated message
                        );
                    await interaction.followUp({ embeds: [timeUpEmbed] });
                } else if (reason === "skipped") {
                    const skippedEmbed = new EmbedBuilder()
                        .setColor(SKIP_COLOR)
                        .setTitle("⏭️ Skipped!")
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
                        .setTitle("🏆 Game Over!")
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

// Primary: LRCLIB (no key), fallback: Vagalume (requires key), last resort: lyrics.ovh
async function getRandomSongAndLyricsFromAPI() {
    const genreKeyword = selectRandomGenreKeyword();
    try {
        // 1) Find candidate tracks via iTunes Search (free)
        const itunesRes = await axios.get(ITUNES_SEARCH_BASE_URL, {
            params: {
                term: genreKeyword,
                media: "music",
                entity: "song",
                limit: 50,
            },
            timeout: 7000,
        });

        const items = Array.isArray(itunesRes.data?.results) ? itunesRes.data.results : [];
        if (!items.length) throw new Error(`No tracks found for "${genreKeyword}"`);

        // Try up to 5 random tracks
        const pool = [...items];
        for (let i = 0; i < Math.min(5, pool.length); i++) {
            const idx = Math.floor(Math.random() * pool.length);
            const t = pool.splice(idx, 1)[0];
            const artist = sanitizeName(t.artistName);
            const title = sanitizeName(t.trackName);
            const durationSec = t.trackTimeMillis
                ? Math.round(t.trackTimeMillis / 1000)
                : undefined;

            // 2) Try LRCLIB
            const lrclibLyrics = await fetchLyricsFromLRCLIB({ artist, title, durationSec });
            if (lrclibLyrics) {
                const fillInLyrics = createFillInSnippet(lrclibLyrics, 90);
                return { artist, title, lyrics: lrclibLyrics, fillInLyrics };
            }

            // 3) Try Vagalume (if key present)
            const vagalumeKey = process.env.VAGALUME_API_KEY;
            if (vagalumeKey) {
                const vagaLyrics = await fetchLyricsFromVagalume({
                    artist,
                    title,
                    apikey: vagalumeKey,
                });
                if (vagaLyrics) {
                    const fillInLyrics = createFillInSnippet(vagaLyrics, 90);
                    return { artist, title, lyrics: vagaLyrics, fillInLyrics };
                }
            }

            // 4) Last resort: lyrics.ovh
            const ovhLyrics = await fetchLyricsFromLyricsOVH({ artist, title });
            if (ovhLyrics) {
                const fillInLyrics = createFillInSnippet(ovhLyrics, 90);
                return { artist, title, lyrics: ovhLyrics, fillInLyrics };
            }
        }

        throw new Error(`No lyrics found for several ${genreKeyword} tracks`);
    } catch (error) {
        handleError(`Lyric fetch error (${genreKeyword}):`, error?.message || error);
        throw new Error(`Couldn't find lyrics for ${genreKeyword} tracks. Try another genre!`);
    }
}

function sanitizeName(s) {
    return String(s || "")
        .replace(/\([^)]*\)/g, "")
        .replace(/\[[^\]]*\]/g, "")
        .trim();
}

async function fetchLyricsFromLRCLIB({ artist, title, durationSec }) {
    try {
        const url = `${LRCLIB_BASE_URL}/get`;
        const params = new URLSearchParams({
            track_name: title,
            artist_name: artist,
        });
        if (typeof durationSec === "number" && Number.isFinite(durationSec)) {
            params.append("duration", String(durationSec));
        }
        const res = await axios.get(`${url}?${params.toString()}`, { timeout: 7000 });
        const plain = res.data?.plainLyrics;
        if (typeof plain === "string" && plain.trim().length) {
            return plain.trim();
        }
        return null;
    } catch (e) {
        await handleError("LRCLIB fetch failed:", e, false);
        return null;
    }
}

async function fetchLyricsFromVagalume({ artist, title, apikey }) {
    try {
        const res = await axios.get(VAGALUME_BASE_URL, {
            params: { art: artist, mus: title, apikey },
            timeout: 7000,
        });
        const mus = res.data?.mus;
        const text = Array.isArray(mus) && mus[0]?.text;
        if (typeof text === "string" && text.trim().length) {
            return text.trim();
        }
        return null;
    } catch (e) {
        await handleError("Vagalume fetch failed:", e, false);
        return null;
    }
}

async function fetchLyricsFromLyricsOVH({ artist, title }) {
    try {
        const res = await axios.get(
            `${LYRICS_OVH_BASE_URL}/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
            { timeout: 6000 },
        );
        const text = res.data?.lyrics;
        if (typeof text === "string" && text.trim().length) {
            return text.trim();
        }
        return null;
    } catch (e) {
        await handleError("Lyrics.ovh fetch failed:", e, false);
        return null;
    }
}

// **New Function: selectRandomGenreKeyword**
function selectRandomGenreKeyword() {
    return GENRES_KEYWORDS[Math.floor(Math.random() * GENRES_KEYWORDS.length)];
}

function createFillInSnippet(lyrics, maxChars = 90) {
    const snippet = pickSnippet(lyrics, maxChars);
    return blankEveryThirdWord(snippet);
}

function pickSnippet(lyrics, maxChars) {
    const lines = String(lyrics)
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);

    if (lines.length === 0) return "";

    // Prefer non-chorus-like lines with decent length
    let attempts = 0;
    while (attempts < 5) {
        attempts++;
        const idx = Math.floor(Math.random() * lines.length);
        const base = lines[idx];

        // If line is too short, try to merge with the next line
        let text = base;
        if (text.length < Math.floor(maxChars * 0.6) && idx + 1 < lines.length) {
            const merged = `${base} ${lines[idx + 1]}`;
            if (merged.length <= maxChars * 1.6) text = merged;
        }

        if (text.length <= maxChars) {
            // Center with ellipses to denote snippet
            return addEllipses(text);
        }

        // Window within text to maxChars, cut at word boundary
        const startMax = Math.max(0, text.length - maxChars);
        const roughStart = Math.floor(Math.random() * (startMax + 1));
        let end = Math.min(text.length, roughStart + maxChars);
        let start = roughStart;

        // Adjust to nearest spaces
        const spaceAfter = text.indexOf(" ", end);
        if (spaceAfter !== -1 && spaceAfter - roughStart <= maxChars + 10) end = spaceAfter;
        const spaceBefore = text.lastIndexOf(" ", roughStart);
        if (spaceBefore !== -1 && roughStart - spaceBefore <= 10) start = spaceBefore + 1;

        const slice = text.slice(start, end).trim();
        if (slice.length > 0) return addEllipses(slice);
    }

    // Fallback to first maxChars
    return addEllipses(lines[0].slice(0, maxChars).trim());
}

function addEllipses(text) {
    const t = text.trim();
    if (!t) return t;
    // use single ellipsis on both sides to indicate partial context
    return `… ${t} …`;
}

function blankEveryThirdWord(text) {
    const parts = String(text).split(/(\s+)/); // keep whitespace
    let output = "";
    let wordIdx = 0;
    for (const token of parts) {
        if (token.trim().length === 0) {
            output += token;
            continue;
        }
        // Token may include punctuation; only treat as word if contains letters
        const isWord = /[A-Za-z]/.test(token);
        if (!isWord) {
            output += token;
            continue;
        }

        if (wordIdx % 3 === 1) {
            output += FILL_BLANK_CHAR;
        } else {
            output += token;
        }
        wordIdx++;
    }
    return output;
}

function getFinalMessage(score, rounds) {
    const percentage = (score / rounds) * 100;
    if (percentage === 100) {
        return "🎶🎤 Perfect score! You're a true Lyric Whiz champion! 🏆";
    } else if (percentage >= 80) {
        return "🌟 You're a lyrical superstar! Amazing music knowledge! 🤩";
    } else if (percentage >= 60) {
        return "Great job! You really know your music! Keep it up! 👍🎵";
    } else if (percentage >= 40) {
        return "Not bad! You have a good ear for music! 🎧😊";
    } else if (percentage >= 20) {
        return "Room for improvement! Time to update your playlist! 📻🔍";
    } else {
        return "Don't worry, everyone starts somewhere! Keep listening and playing! 🎹🌟";
    }
}
