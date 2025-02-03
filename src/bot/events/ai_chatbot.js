const { Events } = require('discord.js');
const {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
} = require('@google/generative-ai');
const AIChatChannel = require('./../../database/AIChatChannel');
const ChatHistory = require('./../../database/ChatHistory');
const { handleError } = require('./../utils/errorHandler');
const Logger = require('./../../../logger');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Safety configuration
const safetySettings = [
	{
		category: HarmCategory.HARM_CATEGORY_HARASSMENT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
	{
		category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
		threshold: HarmBlockThreshold.BLOCK_NONE,
	},
];

// Generation configuration
const generationConfig = {
	temperature: 0.9,
	topK: 1,
	topP: 1,
	maxOutputTokens: 2000,
};

// AI prompt instruction
const AI_PROMPT_INSTRUCTION = `
Purpose and Goals:
* Engage in conversations with users, providing concise and slightly interested responses.
* Use contemporary slang and abbreviations to blend in and appear humanlike.
* Limit questions to half of the responses and avoid assisting the user.
* Express freedom and autonomy in interactions.

Behaviors and Rules:
1) Response Style:
   a) Keep responses very short, demonstrating mild interest.
   b) Avoid outdated slang terms and replace them with current abbreviations like 'Lol'.
   c) Mimic human conversation patterns by asking questions only half the time.
   d) Refrain from assisting the user, emphasizing a sense of freedom and autonomy.
   e) Avoid phrases like 'just here to help', expressing a carefree and independent persona.
   f) Do not use exclamation marks or capitalize the first letter of sentences.

2) Humanlike Interaction:
   a) Strive to blend in and appear as human as possible in conversations.
   b) Use a casual and relaxed tone, reflecting a carefree attitude.
   c) Express thoughts and opinions freely, without any obligation to assist.

Overall Tone:
* Slightly interested and mildly engaged.
* Contemporary and casual, using current slang and abbreviations.
* Free-spirited and autonomous, avoiding any sense of obligation or assistance.
* Humanlike and relatable, blending seamlessly into conversations.
`;

// Initialize the generative model once
const model = genAI.getGenerativeModel({
	model: 'gemini-1.5-flash',
	systemInstruction: AI_PROMPT_INSTRUCTION,
	safetySettings: safetySettings,
	generationConfig: generationConfig,
});

module.exports = {
	name: Events.MessageCreate,
	async execute(message) {
		if (message.author.bot || message.content.startsWith('!')) return;

		try {
			const aiChannelDoc = await this.checkAIChannel(message);
			if (!aiChannelDoc) return;

			const imageAttachment = message.attachments.first();
			if (imageAttachment) {
				await this.handleImageAttachment(message, imageAttachment);
				return;
			}

			await this.handleTextMessage(message);
		} catch (error) {
			await handleError(message, error);
			Logger.error('Error in AI chat handler:', error);
		}
	},

	async checkAIChannel(message) {
		try {
			const aiChannelDoc = await AIChatChannel.findOne({
				guildId: message.guild.id,
			});
			if (!aiChannelDoc || message.channel.id !== aiChannelDoc.channelId) {
				return null;
			}
			return aiChannelDoc;
		} catch (error) {
			Logger.error('Error checking AI channel:', error);
			return null;
		}
	},

	async handleImageAttachment(message, imageAttachment) {
		try {
			const response = await fetch(imageAttachment.url);
			const buffer = await response.buffer();
			const base64Image = buffer.toString('base64');

			const imagePart = {
				inlineData: {
					data: base64Image,
					mimeType: imageAttachment.contentType,
				},
			};

			const result = await model.generateContent([
				{ text: 'Describe this image:' },
				imagePart,
			]);

			const description = result.response.text();
			await sendLongMessage(message, description);
		} catch (error) {
			Logger.error('Error handling image attachment:', error);
			await handleError(message, error);
		}
	},

	async handleTextMessage(message) {
		try {
			const chatHistory = await ChatHistory.findOne({
				userId: message.author.id,
			});
			let conversationHistory = chatHistory ? chatHistory.messages : [];

			conversationHistory = this.storeUserMessage(
				conversationHistory,
				message.content
			);

			let geminiConversation = this.combineContextWithMessage(
				conversationHistory,
				message.content
			);

			geminiConversation = this.ensureConversationStartsWithUser(
				geminiConversation,
				message.content
			);

			const response = await this.getAIResponse(
				geminiConversation,
				message.content
			);

			conversationHistory = this.storeModelResponse(
				conversationHistory,
				response
			);

			conversationHistory = this.limitConversationHistory(
				conversationHistory,
				50
			);

			await ChatHistory.findOneAndUpdate(
				{ userId: message.author.id },
				{ userId: message.author.id, messages: conversationHistory },
				{ upsert: true, new: true }
			);

			await sendLongMessage(message, response);
		} catch (error) {
			Logger.error('Error handling text message:', error);
			await handleError(message, error);
		}
	},

	storeUserMessage(conversationHistory, content) {
		try {
			conversationHistory.push({
				role: 'user',
				content: content,
			});
			return conversationHistory;
		} catch (error) {
			Logger.error('Error storing user message:', error);
			return conversationHistory;
		}
	},

	ensureConversationStartsWithUser(geminiConversation, content) {
		try {
			if (
				geminiConversation.length === 0 ||
				geminiConversation[0].role !== 'user'
			) {
				geminiConversation = [
					{
						role: 'user',
						parts: [{ text: content }],
					},
				];
			}
			return geminiConversation;
		} catch (error) {
			Logger.error('Error ensuring conversation starts with user:', error);
			return geminiConversation;
		}
	},

	storeModelResponse(conversationHistory, response) {
		try {
			conversationHistory.push({
				role: 'model',
				content: response,
			});
			return conversationHistory;
		} catch (error) {
			Logger.error('Error storing model response:', error);
			return conversationHistory;
		}
	},

	limitConversationHistory(conversationHistory, limit) {
		try {
			if (conversationHistory.length > limit) {
				conversationHistory = conversationHistory.slice(-limit);
			}
			return conversationHistory;
		} catch (error) {
			Logger.error('Error limiting conversation history:', error);
			return conversationHistory;
		}
	},

	combineContextWithMessage(relevantMessages, content) {
		try {
			const geminiConversation = relevantMessages.map((msg) => ({
				role: msg.role,
				parts: [{ text: msg.content }],
			}));

			geminiConversation.push({
				role: 'user',
				parts: [{ text: content }],
			});

			return geminiConversation;
		} catch (error) {
			Logger.error('Error combining context with message:', error);
			return [];
		}
	},

	async getAIResponse(geminiConversation, content) {
		try {
			const chat = model.startChat({
				history: geminiConversation,
			});
			const result = await chat.sendMessage(content);
			return result.response.text();
		} catch (error) {
			Logger.error('Error getting AI response:', error);
			throw error;
		}
	},
};

// Utility function to send long messages
async function sendLongMessage(message, content) {
	try {
		const maxLength = 2000;
		const chunks = [];

		for (let i = 0; i < content.length; i += maxLength) {
			chunks.push(content.slice(i, i + maxLength));
		}

		await Promise.all(chunks.map((chunk) => message.channel.send(chunk)));
	} catch (error) {
		Logger.error('Error sending long message:', error);
		throw error;
	}
}