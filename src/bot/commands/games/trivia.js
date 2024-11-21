const {
  SlashCommandBuilder,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require('discord.js');
const he = require('he');

module.exports = {
  description_full:
    'The bot will provide a trivia question with four multiple-choice answers. Users can click buttons to guess the correct answer.',
  usage: '/trivia',
  examples: ['/trivia'],
  category: 'games',
  data: new SlashCommandBuilder()
    .setName('trivia')
    .setDescription('Answer a fun trivia question and test your knowledge!'),
  async execute(interaction) {
    try {
      const response = await fetch(
        'https://opentdb.com/api.php?amount=1&type=multiple',
      );
      const data = await response.json();
      const questionData = data.results[0];

      const decodedQuestion = he.decode(questionData.question);
      const decodedAnswers = questionData.incorrect_answers.map((answer) =>
        he.decode(answer),
      );
      decodedAnswers.push(he.decode(questionData.correct_answer));

      const answers = [...decodedAnswers].sort(() => Math.random() - 0.5);
      const correctIndex = answers.indexOf(
        he.decode(questionData.correct_answer),
      );

      const embed = new EmbedBuilder()
        .setColor('#FF69B4')
        .setTitle('🎲 Epic Trivia Challenge! 🎲')
        .setDescription(
          `**${decodedQuestion}**\n\n*Choose wisely, you have 20 seconds!*`,
        )
        .setFooter({
          text: `Category: ${questionData.category} | Difficulty: ${questionData.difficulty.charAt(0).toUpperCase() + questionData.difficulty.slice(1)}`,
        });

      const row = new ActionRowBuilder().addComponents(
        ['A', 'B', 'C', 'D'].map((letter) =>
          new ButtonBuilder()
            .setCustomId(letter)
            .setLabel(letter)
            .setStyle(ButtonStyle.Primary),
        ),
      );

      const answerFields = answers.map((answer, index) => ({
        name: `Option ${['A', 'B', 'C', 'D'][index]}`,
        value: answer,
        inline: true,
      }));
      embed.addFields(answerFields);

      await interaction.editReply({ embeds: [embed], components: [row] });

      const filter = (i) =>
        ['A', 'B', 'C', 'D'].includes(i.customId) &&
        i.user.id === interaction.user.id;
      const collector = interaction.channel.createMessageComponentCollector({
        filter,
        time: 20000,
      });

      let answered = false;

      collector.on('collect', async (i) => {
        answered = true;
        const userAnswer = ['A', 'B', 'C', 'D'].indexOf(i.customId);
        const correct = userAnswer === correctIndex;

        const resultEmbed = new EmbedBuilder()
          .setColor(correct ? '#00FF00' : '#FF0000')
          .setTitle(
            correct
              ? "🎉 Correct! You're a Trivia Master! 🎉"
              : '😢 Oops! Not Quite Right 😢',
          )
          .setDescription(
            `The correct answer was: **${answers[correctIndex]}**`,
          )
          .addFields(
            {
              name: 'Your Answer',
              value: answers[userAnswer],
              inline: true,
            },
            {
              name: 'Correct Answer',
              value: answers[correctIndex],
              inline: true,
            },
          )
          .setFooter({
            text: `You answered in ${((i.createdTimestamp - interaction.createdTimestamp) / 1000).toFixed(2)} seconds!`,
          });

        await i.update({ embeds: [resultEmbed], components: [] });
        collector.stop();
      });

      collector.on('end', async () => {
        if (!answered) {
          const timeoutEmbed = new EmbedBuilder()
            .setColor('#FFA500')
            .setTitle("⏰ Time's Up! ⏰")
            .setDescription(
              `The correct answer was: **${answers[correctIndex]}**`,
            )
            .setFooter({ text: 'Better luck next time!' });

          await interaction.reply({
            embeds: [timeoutEmbed],
            components: [],
          });
        }
      });
    } catch (error) {
      console.error('Error fetching trivia:', error);
      await interaction.editReply({
        content: "Oops! The trivia machine broke. Let's try again later!",
        ephemeral: true,
      });
    }
  },
};
