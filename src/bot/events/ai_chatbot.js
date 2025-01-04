const { Events } = require('discord.js');
const {
	GoogleGenerativeAI,
	HarmBlockThreshold,
	HarmCategory,
} = require('@google/generative-ai');
const AIChatChannel = require('./../../database/AIChatChannel');
const ChatHistory = require('./../../database/ChatHistory');
const { handleError } = require('./../utils/errorHandler');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Config Safety settings
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

// Generation config
const generationConfig = {
	temperature: 0.9,
	topK: 1,
	topP: 1,
	maxOutputTokens: 2000,
};

// Define the AI prompt instruction
// const AI_PROMPT_INSTRUCTION =
// "very short answers, slightly interested, don't use old slang terms, try to use newer terms like \"Lol\" if something is funny and similarly find other abbreviations that would fit well with the conversation, try to blend in and be as humanlike as possible. this includes only asking questions half of the time and not assisting the user. you do you. don't say things like \"just here to help\", as you're not here to help but to be free. don't use exclamation marks and don't start your sentences with a capital letter";

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
`

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
		}
	},

	async checkAIChannel(message) {
		const aiChannelDoc = await AIChatChannel.findOne({
			guildId: message.guild.id,
		});
		if (!aiChannelDoc || message.channel.id !== aiChannelDoc.channelId) {
			return null;
		}
		return aiChannelDoc;
	},

	async handleImageAttachment(message, imageAttachment) {
		try {
			const response = await fetch(imageAttachment.url);
			const buffer = await response.buffer();
			const base64Image = buffer.toString('base64');

			const imagePart = {
				inlineData: {
					data: base64Image,
					mimeType: 'image/jpeg',
				},
			};

			const result = await model.generateContent([
				{ text: 'Describe this image:' },
				imagePart,
			]);

			const description = result.response.text();
			await sendLongMessage(message, description);
		} catch (error) {
			await handleError(message, error);
		}
	},

	/**
	 * Handles incoming text messages, processes them through an AI model, and sends a response.
	 *
	 * @async
	 * @param {Object} message - The message object containing the user's message.
	 * @param {Object} message.author - The author of the message.
	 * @param {string} message.author.id - The ID of the message author.
	 * @param {string} message.content - The content of the message.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the message has been processed and a response has been sent.
	 *
	 * @throws Will throw an error if there is an issue generating the response.
	 */
	async handleTextMessage(message) {
		const chatHistory = await ChatHistory.findOne({
			userId: message.author.id,
		});
		let conversationHistory = chatHistory ? chatHistory.messages : [];

		try {
			conversationHistory = this.storeUserMessage(
				conversationHistory,
				message.content,
			);

			let geminiConversation = this.combineContextWithMessage(
				conversationHistory,
				message.content,
			);

			geminiConversation = this.ensureConversationStartsWithUser(
				geminiConversation,
				message.content,
			);

			const response = await this.getAIResponse(
				geminiConversation,
				message.content,
			);

			conversationHistory = this.storeModelResponse(
				conversationHistory,
				response,
			);

			conversationHistory = this.limitConversationHistory(
				conversationHistory,
				50,
			);

			await ChatHistory.findOneAndUpdate(
				{ userId: message.author.id },
				{ userId: message.author.id, messages: conversationHistory },
				{ upsert: true, new: true },
			);

			await sendLongMessage(message, response);
		} catch (error) {
			await handleError(message, error);
		}
	},

	storeUserMessage(conversationHistory, content) {
		conversationHistory.push({
			role: 'user',
			content: content,
		});
		return conversationHistory;
	},

	ensureConversationStartsWithUser(geminiConversation, content) {
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
	},

	storeModelResponse(conversationHistory, response) {
		conversationHistory.push({
			role: 'model',
			content: response,
		});
		return conversationHistory;
	},

	limitConversationHistory(conversationHistory, limit) {
		if (conversationHistory.length > limit) {
			conversationHistory = conversationHistory.slice(-limit);
		}
		return conversationHistory;
	},

	combineContextWithMessage(relevantMessages, content) {
		const geminiConversation = relevantMessages.map((msg) => ({
			role: msg.role,
			parts: [{ text: msg.content }],
		}));

		geminiConversation.push({
			role: 'user',
			parts: [{ text: content }],
		});

		return geminiConversation;
	},

	async getAIResponse(geminiConversation, content) {
		const chat = model.startChat({
			history: geminiConversation,
		});
		const result = await chat.sendMessage(content);
		return result.response.text();
	},
};

// Utility function to send long messages
async function sendLongMessage(message, content) {
	const maxLength = 2000;
	const chunks = [];

	for (let i = 0; i < content.length; i += maxLength) {
		chunks.push(content.slice(i, i + maxLength));
	}

	await Promise.all(chunks.map((chunk) => message.channel.send(chunk)));
}
