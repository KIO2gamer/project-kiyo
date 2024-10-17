const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs').promises;
const path = require('path');

module.exports = {
    description_full: 'Unscramble a randomly chosen word within 30 seconds.',
    usage: '/unscramble',
    examples: ['/unscramble'],
    category: 'games',
    data: new SlashCommandBuilder()
        .setName('unscramble')
        .setDescription('Unscramble the word and win!'),
    async execute(interaction) {
        try {
            const words = await loadWords();
            const { chosenWord, shuffledWord } = selectAndShuffleWord(words);
            const embed = createEmbed(shuffledWord);

            await interaction.editReply({ embeds: [embed] });
            const result = await handleGuessing(interaction, chosenWord);
            await updateEmbed(interaction, embed, result, chosenWord);
        } catch (error) {
            console.error('Error in unscramble command:', error);
            await interaction.editReply(
                'An error occurred while running the game.',
            );
        }
    },
};

async function loadWords() {
    const filePath = path.join(
        __dirname,
        '..',
        '..',
        'assets',
        'texts',
        'hangmanWords.txt',
    );
    const data = await fs.readFile(filePath, 'utf-8');
    const words = data
        .split('\n')
        .map((word) => word.trim())
        .filter((word) => word);
    if (words.length === 0) throw new Error('The word list is empty!');
    return words;
}

function selectAndShuffleWord(words) {
    const chosenWord = words[Math.floor(Math.random() * words.length)];
    const shuffledWord = shuffleWord(chosenWord);
    return { chosenWord, shuffledWord };
}

function shuffleWord(word) {
    return word
        .split('')
        .sort(() => Math.random() - 0.5)
        .join('');
}

function createEmbed(shuffledWord) {
    return new EmbedBuilder()
        .setColor(0x0099ff)
        .setTitle('Unscramble the Word!')
        .setDescription(`\`\`\`${shuffledWord}\`\`\``)
        .setFooter({ text: 'You have 30 seconds to guess!' });
}

async function handleGuessing(interaction, chosenWord) {
    const filter = (m) => m.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({
        filter,
        time: 30000,
    });

    return new Promise((resolve) => {
        collector.on('collect', (msg) => {
            if (msg.content.toLowerCase() === chosenWord.toLowerCase()) {
                collector.stop('correct');
            } else {
                msg.reply('Incorrect, try again!');
            }
        });

        collector.on('end', (collected, reason) => {
            resolve(reason === 'correct' ? 'correct' : 'timeout');
        });
    });
}

async function updateEmbed(interaction, embed, result, chosenWord) {
    if (result === 'correct') {
        embed
            .setColor(0x00ff00)
            .setTitle('Correct!')
            .setDescription(
                `You got it right! The word was **${chosenWord}**. 🎉`,
            )
            .setFooter({ text: `You completed in ${interaction.createdTimestamp - interaction.createdTimestamp}ms!` });
    } else {
        embed
            .setColor(0xff0000)
            .setTitle('Time Up!')
            .setDescription(`The word was **${chosenWord}**.`)
            .setFooter({ text: 'You had 30 seconds to guess!' });
    }
    await interaction.editReply({ embeds: [embed] });
}
