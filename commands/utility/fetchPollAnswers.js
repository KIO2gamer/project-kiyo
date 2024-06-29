const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fetch_poll_answers')
        .setDescription('Fetchs the answers of the poll.')
        .addStringOption(option => 
            option
                .setName('message_id')
                .setDescription('Message ID of the poll')
        )
        .addChannelOption(option => 
            option
                .setName('channel')
                .setDescription('Channel where the poll is created')
        ),
    category: 'utility',
    async execute(interaction) {
        const messageId = interaction.options.getString('message_id');
        const channel = interaction.options.getChannel('channel')
        const message = await channel.messages.fetch(messageId);
        await interaction.reply(`Question : \`${message.poll.question.text}\`\n\n` + message.poll.answers.map(answer => `Option : \`${answer.text}\`\nVotes: ${answer.voteCount}`).join('\n\n'))
    }
}