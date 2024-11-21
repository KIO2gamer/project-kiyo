const { SlashCommandBuilder } = require('discord.js');
const { handleError } = require('./../../utils/errorHandler');
const AIChatChannel = require('./../../../database/AIChatChannel');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('set_ai_chat_channel')
		.setDescription('Set the channel for AI chat interactions')
		.addChannelOption(option =>
			option
				.setName('channel')
				.setDescription('The channel to set for AI chat')
				.setRequired(true),
		),
	description_full:
		'Sets a specific channel where users can interact with the AI chatbot. This helps keep AI conversations organized in a dedicated channel.',
	category: 'setup',
	usage: '/set_ai_chat_channel #channel',
	examples: [
		'/set_ai_chat_channel #ai-chat',
		'/set_ai_chat_channel #bot-commands',
		'/set_ai_chat_channel #chatbot',
	],

	async execute(interaction) {
		const channel = interaction.options.getChannel('channel');

		try {
			await AIChatChannel.findOneAndUpdate(
				{ guildId: interaction.guild.id },
				{ channelId: channel.id },
				{ upsert: true, new: true },
			);
			await interaction.editReply(
				`AI chat channel has been set to ${channel}`,
			);
		}
		catch (error) {
			await handleError(interaction, error);
		}
	},
};
