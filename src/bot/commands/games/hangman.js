const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;

const hangmanImages = [
  'https://upload.wikimedia.org/wikipedia/commons/8/8b/Hangman-0.png',
  'https://upload.wikimedia.org/wikipedia/commons/3/37/Hangman-1.png',
  'https://upload.wikimedia.org/wikipedia/commons/7/70/Hangman-2.png',
  'https://upload.wikimedia.org/wikipedia/commons/9/97/Hangman-3.png',
  'https://upload.wikimedia.org/wikipedia/commons/2/27/Hangman-4.png',
  'https://upload.wikimedia.org/wikipedia/commons/6/6b/Hangman-5.png',
  'https://upload.wikimedia.org/wikipedia/commons/d/d6/Hangman-6.png',
];

const funnyMessages = [
  "Oops! That letter's not hanging around here!",
  "Nice try, but that letter's playing hide and seek!",
  "Sorry, that letter's on vacation today!",
  'Nope! That letter must be invisible!',
  "Uh-oh! That letter's social distancing from this word!",
];

module.exports = {
  description_full: 'A thrilling game of hangman with fun twists!',
  usage: '/hangman',
  examples: ['/hangman'],
  category: 'games',
  data: new SlashCommandBuilder()
    .setName('hangman')
    .setDescription('Start an exciting game of hangman!'),
  async execute(interaction) {
    try {
      const data = await fs.readFile(
        './assets/texts/hangmanWords.txt',
        'utf-8',
      );
      const words = data
        .split('\n')
        .map((word) => word.trim())
        .filter((word) => word);

      if (words.length === 0) {
        await interaction.reply(
          'Oops! The word list is as empty as a ghost town!',
        );
        return;
      }

      const word = words[Math.floor(Math.random() * words.length)];
      const guessedLetters = [];
      let remainingGuesses = 6;
      let wordState = '_ '.repeat(word.length).trim();

      const gameEmbed = new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('🎭 Hangman Extravaganza! 🎭')
        .setDescription(
          `Can you save the stickman? Let's find out!\n\n\`\`\`${wordState}\`\`\``,
        )
        .setThumbnail(hangmanImages[0])
        .addFields(
          {
            name: '💪 Guesses Left',
            value: '❤️'.repeat(remainingGuesses),
            inline: true,
          },
          {
            name: '🔤 Guessed Letters',
            value: 'None yet!',
            inline: true,
          },
        )
        .setFooter({ text: 'Type a letter to make a guess!' });

      const msg = await interaction.editReply({
        embeds: [gameEmbed],
        fetchReply: true,
      });

      const filter = (m) =>
        m.author.id === interaction.user.id &&
        m.content.length === 1 &&
        /[a-z]/i.test(m.content);
      const collector = interaction.channel.createMessageCollector({
        filter,
        time: 300000,
      });

      collector.on('collect', async (m) => {
        const letter = m.content.toLowerCase();
        if (guessedLetters.includes(letter)) {
          const reply = await m.reply(
            "You've already guessed that letter! Try another one.",
          );
          setTimeout(() => reply.delete(), 3000);
          m.delete();
          return;
        }

        guessedLetters.push(letter);

        if (word.includes(letter)) {
          for (let j = 0; j < word.length; j++) {
            if (word[j] === letter) {
              wordState =
                wordState.substring(0, j * 2) +
                letter +
                wordState.substring(j * 2 + 1);
            }
          }
          const reply = await m.reply(
            `🎉 Great guess! '${letter.toUpperCase()}' is in the word!`,
          );
          setTimeout(() => reply.delete(), 3000);
        } else {
          remainingGuesses--;
          const funnyMessage =
            funnyMessages[Math.floor(Math.random() * funnyMessages.length)];
          const reply = await m.reply(`😅 ${funnyMessage}`);
          setTimeout(() => reply.delete(), 3000);
        }

        m.delete();

        gameEmbed
          .setDescription(
            `Let's keep the guessing game going!\n\n\`\`\`${wordState}\`\`\``,
          )
          .setThumbnail(hangmanImages[6 - remainingGuesses])
          .setFields([
            {
              name: '💪 Guesses Left',
              value:
                remainingGuesses > 0
                  ? '❤️'.repeat(remainingGuesses)
                  : 'None left!',
              inline: true,
            },
            {
              name: '🔤 Guessed Letters',
              value:
                guessedLetters.length > 0
                  ? guessedLetters.join(', ').toUpperCase()
                  : 'None yet!',
              inline: true,
            },
          ]);

        if (remainingGuesses === 0) {
          gameEmbed
            .setColor(0xff0000)
            .setTitle('💀 Game Over! The hangman got hanged! 💀')
            .setDescription(
              `Oh no! The word was **${word}**. Better luck next time!`,
            )
            .setFooter({
              text: "Don't worry, it's just a game... right?",
            });
          await msg.edit({ embeds: [gameEmbed] });
          collector.stop();
          return;
        }

        if (wordState.replace(/ /g, '') === word) {
          gameEmbed
            .setColor(0x00ff00)
            .setTitle('🎊 Woohoo! You saved the day! 🎊')
            .setDescription(
              `Congratulations! You guessed the word **${word}**!`,
            )
            .setFooter({
              text: "You're officially a word wizard!",
            });
          await msg.edit({ embeds: [gameEmbed] });
          collector.stop();
          return;
        }

        await msg.edit({ embeds: [gameEmbed] });
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          gameEmbed
            .setColor(0xff0000)
            .setTitle("⏰ Time's Up! ⏰")
            .setDescription(
              `Looks like the clock won this round! The word was **${word}**.`,
            )
            .setFooter({
              text: "Time flies when you're having fun... or trying to guess words!",
            });
          msg.edit({ embeds: [gameEmbed] });
        }
      });
    } catch (err) {
      console.error('Failed to read the word list:', err);
      await interaction.reply(
        'Oops! An error occurred while setting up the game. Maybe the hangman took a coffee break?',
      );
    }
  },
};
