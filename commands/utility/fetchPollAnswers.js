const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('fetch_poll_answers')
		.setDescription('Fetches the answers of the poll.')
		.addStringOption(option =>
			option.setName('message_id').setDescription('Message ID of the poll')
		)
		.addChannelOption(option =>
			option.setName('channel').setDescription('Channel where the poll is created')
		),
	category: 'utility',
	async execute(interaction) {
		const messageId = interaction.options.getString('message_id');
		const channel = interaction.options.getChannel('channel');
		const message = await channel.messages.fetch(messageId);

		// Prepare the header
		let reply = `Question : \`${message.poll.question.text}\`\n\n\`\`\`\nS.No.         Options        Votes\n`;

		// Add each answer in a formatted way
		message.poll.answers.forEach(answer => {
			const numberText = `${answer.id}`.padEnd(5);
			const optionText = `${answer.text}`.padEnd(15);
			const voteText = `${answer.voteCount}`;
			reply += `${numberText}         ${optionText}${voteText}\n`;
		});

		// Close the code block
		reply += '```';

		await interaction.reply(reply);
	},
};
