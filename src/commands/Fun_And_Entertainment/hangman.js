const { EmbedBuilder, MessageFlags, SlashCommandBuilder } = require("discord.js");

const fs = require("fs").promises;

// --- Constants ---
const WORD_LIST_PATH = "./assets/texts/wordList.txt";
const MAX_GUESSES = 6;
const GAME_TIMEOUT = 300000; // 5 minutes
const GAME_COLOR = 0x0099ff;
const GAME_OVER_COLOR = 0xff0000;
const WIN_COLOR = 0x00ff00;
const TIMEOUT_COLOR = 0xffa500;
const EMOJI_HEART = "❤️";
const EMOJI_LETTER_BOX = "⬜";
const EMOJI_CHECK_MARK = "✅";
const EMOJI_CROSS_MARK = "❌";

const hangmanImages = [
    "https://upload.wikimedia.org/wikipedia/commons/8/8b/Hangman-0.png",
    "https://upload.wikimedia.org/wikipedia/commons/3/37/Hangman-1.png",
    "https://upload.wikimedia.org/wikipedia/commons/7/70/Hangman-2.png",
    "https://upload.wikimedia.org/wikipedia/commons/9/97/Hangman-3.png",
    "https://upload.wikimedia.org/wikipedia/commons/2/27/Hangman-4.png",
    "https://upload.wikimedia.org/wikipedia/commons/6/6b/Hangman-5.png",
    "https://upload.wikimedia.org/wikipedia/commons/d/d6/Hangman-6.png",
];

const funnyMessages = [
    "Oops! That letter's not hanging around here!",
    "Nice try, but that letter's playing hide and seek!",
    "Sorry, that letter's on vacation today!",
    "Nope! That letter must be invisible!",
    "Uh-oh! That letter's social distancing from this word!",
];

module.exports = {
    description_full: "A thrilling multiplayer game of hangman!",
    usage: "/hangman",
    examples: ["/hangman"],

    data: new SlashCommandBuilder()
        .setName("hangman")
        .setDescription("Start a multiplayer exciting game of hangman!"),
    async execute(interaction) {
        try {
            await interaction.deferReply(); // Defer reply for potential file reading delay
            const words = await loadWords();
            if (!words) {
                return interaction.editReply("Oops! The word list is as empty as a ghost town!");
            }

            const word = selectWord(words);
            const gameState = initializeGameState(word);
            const gameActive = true;
            const winner = null; // Track the user who guesses the word

            const gameEmbed = createGameEmbed(gameState, hangmanImages[0]);
            const msg = await interaction.editReply({ embeds: [gameEmbed] });

            const collector = createCollector(interaction, gameActive); // Pass gameActive to collector
            startGameCollector(
                collector,
                interaction,
                msg,
                word,
                gameState,
                gameEmbed,
                gameActive,
                winner,
            ); // Pass gameActive and winner
        } catch (error) {
            handleError("Multiplayer Hangman game error:", error);
            await interaction.editReply(
                "Oops! An error occurred while setting up the multiplayer game. Maybe the hangman is playing with others?",
            );
        }
    },
};

// --- Helper Functions ---

async function loadWords() {
    try {
        const data = await fs.readFile(WORD_LIST_PATH, "utf-8");
        return data
            .split("\n")
            .map((word) => word.trim())
            .filter((word) => word);
    } catch (error) {
        handleError("Failed to read the word list file:", error);
        return null;
    }
}

function selectWord(words) {
    return words[Math.floor(Math.random() * words.length)];
}

function initializeGameState(word) {
    return {
        word: word,
        guessedLetters: [],
        remainingGuesses: MAX_GUESSES,
        wordState: "_ ".repeat(word.length).trim(),
    };
}

function createGameEmbed(gameState, thumbnail) {
    return new EmbedBuilder()
        .setColor(GAME_COLOR)
        .setTitle("🎭 Multiplayer Hangman Extravaganza! 🎭") // Multiplayer title
        .setDescription(
            `A word is waiting to be guessed by anyone in the channel!\nCan you save the stickman together? Let's find out!\n\n\`\`\`${gameState.wordState}\`\`\``, // Multiplayer description
        )
        .setThumbnail(thumbnail)
        .addFields(
            {
                name: "💪 Guesses Left (Shared)", // Indicate shared guesses
                value: "❤️".repeat(gameState.remainingGuesses),
                inline: true,
            },
            {
                name: "🔤 Guessed Letters (All Players)", // Indicate shared guessed letters
                value: getGuessedLettersDisplay(gameState.guessedLetters),
                inline: true,
            },
        )
        .setFooter({
            text: "Type a letter to make a guess - anyone can join!",
        }); // Multiplayer footer
}

function getGuessedLettersDisplay(guessedLetters) {
    return guessedLetters.length > 0 ? guessedLetters.join(", ").toUpperCase() : "None yet!";
}

function createCollector(interaction, gameActive) {
    // Added gameActive parameter
    const filter = (m) =>
        !m.author.bot &&
        gameActive && // Any non-bot user can guess while game is active
        m.content.length === 1 &&
        /[a-z]/i.test(m.content);
    return interaction.channel.createMessageCollector({
        filter,
        time: GAME_TIMEOUT,
    });
}

function startGameCollector(
    collector,
    interaction,
    msg,
    word,
    gameState,
    gameEmbed,
    gameActive,
    winner,
) {
    // Added gameActive and winner parameters
    collector.on("collect", async (m) => {
        const letter = m.content.toLowerCase();
        if (gameState.guessedLetters.includes(letter)) {
            handleGuess(m);
            return;
        }

        gameState.guessedLetters.push(letter);

        if (gameState.word.includes(letter)) {
            handleCorrectGuess(m, letter, gameState, gameEmbed, msg);
        } else {
            handleIncorrectGuess(m, gameState, gameEmbed, msg);
        }

        if (checkGameOver(gameState)) {
            gameActive = false; // Update gameActive here
            return collector.stop("gameOver");
        }
        if (checkWin(gameState)) {
            gameActive = false; // Update gameActive here
            winner = m.author; // Set the winner as the user who guessed the last letter
            return collector.stop("win");
        }

        await msg.edit({ embeds: [gameEmbed] });
    });

    collector.on("end", async (collected, reason) => {
        if (reason === "time") {
            handleTimeout(msg, gameState);
        } else if (reason === "gameOver") {
            handleGameOver(msg, gameState);
        } else if (reason === "win") {
            handleWin(msg, gameState, winner); // Pass winner to handleWin
        }
    });
}

async function handleCorrectGuess(message, letter, gameState, gameEmbed, gameMessage) {
    updateWordState(letter, gameState);
    gameEmbed.setDescription(
        `Let's keep the guessing game going!\n\n\`\`\`${gameState.wordState}\`\`\``,
    );
    const reply = await message.reply(
        `🎉 Great guess, ${message.author}! '${letter.toUpperCase()}' is in the word!`, // Mention the user who guessed correctly
    );
    // setTimeout(() => reply.delete(), DELETE_DELAY); // Keeping messages for multiplayer context
}

function updateWordState(letter, gameState) {
    let newWordState = "";
    for (let i = 0; i < gameState.word.length; i++) {
        if (gameState.word[i] === letter || gameState.guessedLetters.includes(gameState.word[i])) {
            newWordState += gameState.word[i] + " ";
        } else {
            newWordState += "_ ";
        }
    }
    gameState.wordState = newWordState.trim();
}

async function handleIncorrectGuess(message, gameState, gameEmbed, gameMessage) {
    gameState.remainingGuesses--;
    const funnyMessage = funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
    const reply = await message.reply(`😅 ${funnyMessage} - Nice try, ${message.author}!`);

    gameEmbed
        .setDescription(`Let's keep the guessing game going!\n\n\`\`\`${gameState.wordState}\`\`\``)
        .setThumbnail(hangmanImages[MAX_GUESSES - gameState.remainingGuesses])
        .setFields([
            {
                name: "💪 Guesses Left (Shared)", // Indicate shared guesses
                value:
                    gameState.remainingGuesses > 0
                        ? "❤️".repeat(gameState.remainingGuesses)
                        : "None left!",
                inline: true,
            },
            {
                name: "🔤 Guessed Letters (All Players)", // Indicate shared guessed letters
                value: getGuessedLettersDisplay(gameState.guessedLetters),
                inline: true,
            },
        ]);
}

async function handleGuess(message) {
    const reply = await message.reply(
        `${message.author}, you've already guessed that letter! Try another one.`,
    );
}

function checkGameOver(gameState) {
    return gameState.remainingGuesses <= 0;
}

function checkWin(gameState) {
    return gameState.wordState.replace(/ /g, "") === gameState.word;
}

async function handleTimeout(msg, gameState) {
    const gameEmbed = new EmbedBuilder()
        .setColor(TIMEOUT_COLOR)
        .setTitle("⏰ Time's Up! For Everyone! ⏰") // Multiplayer timeout title
        .setDescription(
            `Looks like time ran out for all of you! The word was **${gameState.word}**.`, // Multiplayer timeout description
        )
        .setFooter({
            text: "Maybe teamwork makes the dream work... next time!", // Multiplayer timeout footer
        });
    await msg.edit({ embeds: [gameEmbed] });
}

async function handleGameOver(msg, gameState) {
    const gameEmbed = new EmbedBuilder()
        .setColor(GAME_OVER_COLOR)
        .setTitle("💀 Game Over! For All! 💀") // Multiplayer game over title
        .setDescription(
            `Oh no! You all ran out of guesses! The word was **${gameState.word}**. Better luck next time, team!`, // Multiplayer game over description
        )
        .setFooter({
            text: "Don't worry, it's just a game... for everyone!", // Multiplayer game over footer
        });
    await msg.edit({ embeds: [gameEmbed] });
}

async function handleWin(msg, gameState, winner) {
    // Added winner parameter
    const gameEmbed = new EmbedBuilder()
        .setColor(WIN_COLOR)
        .setTitle(`🎊 We Have a Winner! 🎊 Congratulations, ${winner}!`) // Multiplayer win title - Announce winner
        .setDescription(
            `🎉 Woohoo! ${winner}, you saved the day for everyone! You guessed the word **${gameState.word}**!`, // Multiplayer win description - Congratulate winner
        )
        .setFooter({
            text: "You're officially a word wizard... of the channel!", // Multiplayer win footer
        });
    await msg.edit({ embeds: [gameEmbed] });
}
