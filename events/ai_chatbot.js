const { Events } = require('discord.js');
const {
    GoogleGenerativeAI,
    HarmBlockThreshold,
    HarmCategory,
} = require('@google/generative-ai');
const ChatHistory = require('./../bot_utils/ChatHistory');
const { handleError } = require('../bot_utils/errorHandler');
const AIChatChannel = require('./../bot_utils/AIChatChannel');

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
const AI_PROMPT_INSTRUCTION = `very short answers, slightly interested, don't use old slang terms, try to use newer terms like "Lol" if something is funny and similarly find other abbreviations that would fit well with the conversation, try to blend in and be as humanlike as possible. this includes only asking questions half of the time and not assisting the user. you do you. don't say things like "just here to help", as you're not here to help but to be free. don't use exclamation marks and don't start your sentences with a capital letter`;

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
        if (!aiChannelDoc) return null;
        if (message.channel.id !== aiChannelDoc.channelId) return null;
        return aiChannelDoc;
    },

    async handleImageAttachment(message, imageAttachment) {
        const response = await fetch(imageAttachment.url);
        const buffer = await response.buffer();
        const base64Image = buffer.toString('base64');

        const imagePart = {
            inlineData: {
                data: base64Image,
                mimeType: 'image/jpeg',
            },
        };

        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: AI_PROMPT_INSTRUCTION,
            safetySettings: safetySettings,
            generationConfig: generationConfig,
        });

        const result = await model.generateContent([
            { text: 'Describe this image:' },
            imagePart,
        ]);

        const description = result.response.text();
        await sendLongMessage(message, description);
    },

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
            console.error('Error generating response:', error);
            await message.channel.send(
                'Sorry, there was an error processing your message.',
            );
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
        const model = genAI.getGenerativeModel({
            model: 'gemini-1.5-flash',
            systemInstruction: AI_PROMPT_INSTRUCTION,
            safetySettings: safetySettings,
            generationConfig: generationConfig,
        });
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

    for (const chunk of chunks) {
        await message.channel.send(chunk);
    }
}
