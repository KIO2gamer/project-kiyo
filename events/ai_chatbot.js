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
const AI_PROMPT_INSTRUCTION = `very short answers, slightly interested, don't use old slang terms, try to use newer terms like "Lol" if something is funny and similarly find other abbeviations that would fit well with the conversation, try to blend in and be as humanlike as possible. this includes only asking questions half of the time and not assisting the user. you do you. don't say things like "just here to help", as you're not here not help but to be free. don't use exclamation marks and don't start your sentences with a capital letter`;

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        if (message.author.bot || message.content.startsWith('!')) return;

        try {
            // Check if the message is in a designated AI chat channel
            const aiChannelDoc = await AIChatChannel.findOne({
                guildId: message.guild.id,
            });
            if (!aiChannelDoc || message.channel.id !== aiChannelDoc.channelId)
                return;

            const imageAttachment = message.attachments.first();

            // Check if an image is attached
            if (imageAttachment) {
                // Fetch and convert the image to base64
                const response = await fetch(imageAttachment.url);
                const buffer = await response.buffer();
                const base64Image = buffer.toString('base64');

                // Prepare image part for Gemini API
                const imagePart = {
                    inlineData: {
                        data: base64Image,
                        mimeType: 'image/jpeg',
                    },
                };

                // Send the image and ask for a description
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
                return;
            }

            // Handle text-only messages if no image is attached
            const chatHistory = await ChatHistory.findOne({
                userId: message.author.id,
            });
            let conversationHistory = chatHistory ? chatHistory.messages : [];

            // Check if the message is a reply to a bot message
            let replyContext = '';
            if (message.reference && message.reference.messageId) {
                const repliedMessage = await message.channel.messages.fetch(
                    message.reference.messageId,
                );
                if (repliedMessage.author.bot) {
                    replyContext = `The user is replying to this previous message from the bot: "${repliedMessage.content}". `;
                }
            }

            // Prepare the conversation for Gemini
            const geminiConversation = conversationHistory.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            }));

            // Add the new user message with reply context
            geminiConversation.push({
                role: 'user',
                parts: [{ text: replyContext + message.content }],
            });

            // Generate AI response using Gemini
            const model = genAI.getGenerativeModel({
                model: 'gemini-1.5-flash',
                systemInstruction: AI_PROMPT_INSTRUCTION,
                safetySettings: safetySettings,
                generationConfig: generationConfig,
            });
            const chat = model.startChat({
                history: geminiConversation,
            });
            const result = await chat.sendMessage(
                replyContext + message.content,
            );

            // Get the AI's response
            const response = result.response.text();

            // Update conversation history
            conversationHistory.push({
                role: 'user',
                content: message.content,
            });
            conversationHistory.push({
                role: 'model',
                content: response,
            });

            // Trim history if necessary
            if (conversationHistory.length > 50) {
                conversationHistory = conversationHistory.slice(-50);
            }

            // Save updated history to the database
            await ChatHistory.findOneAndUpdate(
                { userId: message.author.id },
                { userId: message.author.id, messages: conversationHistory },
                { upsert: true, new: true },
            );

            // Reply with the AI response
            await sendLongMessage(message, response);
        } catch (error) {
            await handleError(message, error);
        }
    },
};

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
