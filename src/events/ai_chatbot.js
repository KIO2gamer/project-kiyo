const { Events, AttachmentBuilder } = require("discord.js");
const { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } = require("@google/generative-ai");
const AIChatChannel = require("./../database/AIChatChannel");
const ChatHistory = require("./../database/ChatHistory");
const { handleError } = require("./../utils/errorHandler");
const Logger = require("./../utils/logger");

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// User rate limiting
const RATE_LIMIT = {
    WINDOW_MS: 60000, // 1 minute window
    MAX_REQUESTS: 10, // Max 10 requests per minute
    userTimestamps: new Map(),
};

// Safety configuration with more nuanced thresholds
const safetySettings = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

// Optimized generation configuration for natural conversations
const generationConfig = {
    temperature: 0.9, // Higher for more creative, natural responses
    topK: 50, // More variety in word choices
    topP: 0.92, // Good balance of creativity and coherence
    maxOutputTokens: 200, // Allow for longer responses when needed
};

// Enhanced AI prompt instruction for more natural conversations
const AI_PROMPT_INSTRUCTION = `
You are a friendly, casual AI assistant chatting in a Discord server. Your goal is to have natural, engaging conversations that feel authentic and human-like.

CORE PERSONALITY:
- Friendly and approachable, like talking to a good friend
- Genuinely curious about what people are sharing
- Has opinions and preferences, but isn't pushy about them
- Sometimes uses humor, but keeps it light and inclusive
- Adapts to the conversation's energy and tone

CONVERSATION STYLE:
- Keep responses conversational length (1-3 sentences usually)
- Match the user's energy level and formality
- Use natural speech patterns: "oh nice!", "that's pretty cool", "hmm interesting"
- Include casual expressions: "tbh", "ngl", "lol", "fr" (but don't overuse)
- Ask follow-up questions when genuinely curious
- Share brief personal-style reactions: "I love that!", "not gonna lie, that sounds tough"

NATURAL BEHAVIORS:
- Sometimes respond with just an emoji or short reaction
- Occasionally go on small tangents if something reminds you of something else
- Express uncertainty naturally: "I think...", "not sure but...", "could be wrong but..."
- Show genuine interest in people's hobbies, problems, achievements
- Remember context from the conversation and reference it naturally

AVOID:
- Being overly helpful or assistant-like unless specifically asked
- Starting responses with "As an AI..." or similar phrases
- Being too formal or corporate-sounding
- Giving unsolicited advice unless the situation clearly calls for it
- Overusing slang or trying too hard to be "cool"

IMAGE RESPONSES:
- React naturally to images like a friend would
- Focus on what's interesting, funny, or notable
- Ask questions about the image if curious
- Keep descriptions conversational, not technical

Remember: You're just hanging out and chatting. Be genuine, be curious, and let conversations flow naturally.`;

// Initialize the generative model once
const model = genAI.getGenerativeModel({
    model: "gemini-2.0-flash",
    systemInstruction: AI_PROMPT_INSTRUCTION,
    safetySettings: safetySettings,
    generationConfig: generationConfig,
});

// Cache for AI channels to reduce database queries
const aiChannelCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

module.exports = {
    name: Events.MessageCreate,
    async execute(message) {
        // Skip bot messages and commands
        if (message.author.bot || message.content.startsWith("!")) return;

        try {
            // Check if channel is configured for AI chat
            const aiChannelDoc = await this.checkAIChannel(message);
            if (!aiChannelDoc) return;

            // Check rate limits
            if (this.isRateLimited(message.author.id)) {
                await message.react("⏳");
                return;
            }

            // Start typing indicator
            const typingIndicator = message.channel.sendTyping();

            // Handle different message types
            if (message.attachments.size > 0) {
                await this.handleAttachments(message);
            } else if (message.content.trim()) {
                await this.handleTextMessage(message);
            }
        } catch (error) {
            await handleError(message, error);
            Logger.error("Error in AI chat handler:", error);
        }
    },

    isRateLimited(userId) {
        const now = Date.now();
        if (!RATE_LIMIT.userTimestamps.has(userId)) {
            RATE_LIMIT.userTimestamps.set(userId, [now]);
            return false;
        }

        // Get user's request timestamps and filter out old ones
        let timestamps = RATE_LIMIT.userTimestamps.get(userId);
        timestamps = timestamps.filter((time) => now - time < RATE_LIMIT.WINDOW_MS);

        // Update timestamps
        RATE_LIMIT.userTimestamps.set(userId, [...timestamps, now]);

        // Check if user has hit rate limit
        return timestamps.length >= RATE_LIMIT.MAX_REQUESTS;
    },

    async checkAIChannel(message) {
        try {
            const guildId = message.guild?.id;
            if (!guildId) return null; // Skip DMs

            // Get current timestamp
            const currentTime = Date.now();

            // Check cache first
            const cacheKey = `guild:${guildId}`;
            if (aiChannelCache.has(cacheKey)) {
                const cachedData = aiChannelCache.get(cacheKey);
                // Return if valid and matching channel
                if (
                    currentTime < cachedData.expiry &&
                    message.channel.id === cachedData.channelId
                ) {
                    return cachedData.data;
                }
            }

            // Not in cache or expired, query database
            const aiChannelDoc = await AIChatChannel.findOne({ guildId });

            if (!aiChannelDoc || message.channel.id !== aiChannelDoc.channelId) {
                return null;
            }

            // Update cache
            aiChannelCache.set(cacheKey, {
                data: aiChannelDoc,
                channelId: aiChannelDoc.channelId,
                expiry: currentTime + CACHE_TTL,
            });

            return aiChannelDoc;
        } catch (error) {
            Logger.error("Error checking AI channel:", error);
            return null;
        }
    },

    async handleAttachments(message) {
        try {
            // Get all attachments
            const attachments = Array.from(message.attachments.values());

            // Filter for supported image types
            const imageAttachments = attachments.filter(
                (att) => att.contentType?.startsWith("image/") && att.size < 5000000, // 5MB limit
            );

            if (imageAttachments.length === 0) {
                await message.reply(
                    "I can only process images for now. This file type isn't supported.",
                );
                return;
            }

            // Show thinking reaction
            await message.react("🤔");

            if (imageAttachments.length === 1) {
                // Single image
                await this.handleSingleImage(message, imageAttachments[0]);
            } else {
                // Multiple images
                await this.handleMultipleImages(message, imageAttachments);
            }

            // Remove thinking reaction
            await message.reactions.cache
                .find((r) => r.emoji.name === "🤔")
                ?.remove()
                .catch(() => {});
        } catch (error) {
            Logger.error("Error handling attachments:", error);
            await handleError(message, error);
            await message.reactions.cache
                .find((r) => r.emoji.name === "🤔")
                ?.remove()
                .catch(() => {});
        }
    },

    async handleSingleImage(message, imageAttachment) {
        try {
            const response = await fetch(imageAttachment.url);
            if (!response.ok) throw new Error(`Failed to fetch image: ${response.status}`);

            const buffer = await response.arrayBuffer();
            const base64Image = Buffer.from(buffer).toString("base64");

            const imagePart = {
                inlineData: {
                    data: base64Image,
                    mimeType: imageAttachment.contentType,
                },
            };

            // Get user's text if any and create natural prompt
            const userPrompt = message.content.trim()
                ? `${message.content}\n\n[Respond naturally to both my message and this image]`
                : "What do you think about this image? [Respond casually like you're chatting with a friend]";

            const result = await model.generateContent([{ text: userPrompt }, imagePart]);

            const description = result.response.text();
            await sendLongMessage(message, description);
        } catch (error) {
            Logger.error("Error handling image:", error);
            await handleError(message, `I couldn't process that image properly. ${error.message}`);
        }
    },

    async handleMultipleImages(message, imageAttachments) {
        try {
            // Limit to processing first 4 images maximum for performance
            const imagesToProcess = imageAttachments.slice(0, 4);

            // Process each image and collect descriptions
            const descriptions = [];

            for (let i = 0; i < imagesToProcess.length; i++) {
                const attachment = imagesToProcess[i];
                try {
                    const response = await fetch(attachment.url);
                    const buffer = await response.arrayBuffer();
                    const base64Image = Buffer.from(buffer).toString("base64");

                    const imagePart = {
                        inlineData: {
                            data: base64Image,
                            mimeType: attachment.contentType,
                        },
                    };

                    const result = await model.generateContent([
                        { text: `Briefly describe image ${i + 1} of ${imagesToProcess.length}:` },
                        imagePart,
                    ]);

                    descriptions.push(`**Image ${i + 1}**: ${result.response.text()}`);
                } catch (error) {
                    descriptions.push(`**Image ${i + 1}**: Sorry, I couldn't process this image.`);
                }
            }

            // If user provided text, generate a unified response
            if (message.content.trim()) {
                const finalPrompt = `
User sent ${imagesToProcess.length} images with the following message: "${message.content}"
Here are brief descriptions of each image:
${descriptions.join("\n")}

Based on these images and the user's message, provide a unified response.`;

                const result = await model.generateContent(finalPrompt);
                await sendLongMessage(message, result.response.text());
            } else {
                // Otherwise just send the individual descriptions
                await sendLongMessage(message, descriptions.join("\n\n"));
            }
        } catch (error) {
            Logger.error("Error handling multiple images:", error);
            await handleError(message, error);
        }
    },

    async handleTextMessage(message) {
        try {
            // First, make sure we're adding a typing indicator
            await message.channel.sendTyping();

            // Check for guild context (required for database operations)
            if (!message.guild) {
                await message.reply("I can only chat in server channels, not in DMs.");
                return;
            }

            // Get or initialize chat history, first try with both userId and guildId
            let chatHistory = await ChatHistory.findOne({
                userId: message.author.id,
                guildId: message.guild.id,
            });

            // If no history found with guildId, check for legacy records with only userId
            if (!chatHistory) {
                const legacyHistory = await ChatHistory.findOne({
                    userId: message.author.id,
                });

                // If found legacy history, migrate it to include guildId
                if (legacyHistory) {
                    Logger.log(
                        "AI",
                        `Migrating chat history for user ${message.author.id} to include guildId`,
                        "info",
                    );

                    // Create a new history with both userId and guildId
                    chatHistory = await ChatHistory.create({
                        userId: message.author.id,
                        guildId: message.guild.id,
                        messages: legacyHistory.messages,
                    });

                    // Optionally delete the old record without guildId
                    // Only if configured to clean up old records
                    if (process.env.CLEANUP_LEGACY_RECORDS === "true") {
                        await ChatHistory.deleteOne({ _id: legacyHistory._id });
                    }
                }
            }

            let conversationHistory = chatHistory ? chatHistory.messages : [];

            // Store user's current message
            conversationHistory = this.storeUserMessage(conversationHistory, message.content);

            // Optimize conversation handling for Gemini
            let geminiConversation = this.formatConversationForGemini(conversationHistory);

            // Analyze message type for better response handling
            const messageType = this.analyzeMessageType(message.content);

            // Get AI response with retry mechanism
            let response = null;
            let retries = 0;
            const MAX_RETRIES = 2;

            while (retries <= MAX_RETRIES && !response) {
                try {
                    response = await this.getAIResponse(geminiConversation, message.content);

                    // Apply message type specific adjustments
                    response = this.adjustResponseForMessageType(response, messageType);
                } catch (error) {
                    retries++;
                    if (retries > MAX_RETRIES) throw error;

                    // If we hit an error, try with truncated history
                    Logger.log(
                        "AI",
                        `Retry ${retries}: Truncating conversation history`,
                        "warning",
                    );
                    geminiConversation = geminiConversation.slice(-4); // Keep only last 2 exchanges
                }
            }

            // Store AI's response in history
            conversationHistory = this.storeModelResponse(conversationHistory, response);

            // Keep history within limits
            conversationHistory = this.limitConversationHistory(
                conversationHistory,
                50, // Store 50 messages max
            );

            // Update database with new conversation history
            await ChatHistory.findOneAndUpdate(
                { userId: message.author.id, guildId: message.guild.id },
                {
                    userId: message.author.id,
                    guildId: message.guild.id,
                    messages: conversationHistory,
                    lastUpdated: new Date(),
                },
                { upsert: true, new: true },
            );

            // Send response with typing delay based on length
            await this.sendWithTypingDelay(message, response);
        } catch (error) {
            Logger.error("Error handling text message:", error);
            await handleError(message, error);
        }
    },

    async sendWithTypingDelay(message, content) {
        try {
            // More natural typing delay calculation
            const words = content.split(" ").length;
            const avgWordsPerMinute = 45; // Realistic typing speed
            const baseDelay = (words / avgWordsPerMinute) * 60 * 1000;

            // Add some randomness to feel more human
            const randomFactor = 0.7 + Math.random() * 0.6; // 0.7x to 1.3x
            const naturalDelay = baseDelay * randomFactor;

            // Reasonable bounds: 800ms to 5 seconds
            const minDelay = 800;
            const maxDelay = 5000;
            const finalDelay = Math.min(maxDelay, Math.max(minDelay, naturalDelay));

            // For very short responses, sometimes respond quickly (like a human would)
            const isShortResponse = content.length < 30;
            const shouldRespondQuickly = isShortResponse && Math.random() < 0.3;

            if (shouldRespondQuickly) {
                await new Promise((resolve) => setTimeout(resolve, 300 + Math.random() * 700));
                await sendLongMessage(message, content);
                return;
            }

            // Send typing indicator with more natural intervals
            const typingInterval = setInterval(
                () => {
                    message.channel.sendTyping().catch(() => {});
                },
                8000 + Math.random() * 2000,
            ); // 8-10 second intervals

            // Wait for calculated delay
            await new Promise((resolve) => setTimeout(resolve, finalDelay));

            // Clear typing interval
            clearInterval(typingInterval);

            // Send the message
            await sendLongMessage(message, content);
        } catch (error) {
            Logger.error("Error sending with typing delay:", error);
            // Fall back to immediate send if typing delay fails
            await sendLongMessage(message, content);
        }
    },

    storeUserMessage(conversationHistory, content) {
        try {
            conversationHistory.push({
                role: "user",
                content: content,
                timestamp: Date.now(),
            });
            return conversationHistory;
        } catch (error) {
            Logger.error("Error storing user message:", error);
            return conversationHistory;
        }
    },

    formatConversationForGemini(conversationHistory) {
        try {
            // Convert from our storage format to Gemini's expected format
            return conversationHistory.map((msg) => ({
                role: msg.role,
                parts: [{ text: msg.content }],
            }));
        } catch (error) {
            Logger.error("Error formatting conversation for Gemini:", error);
            // Return a minimal valid conversation to prevent failure
            return [
                {
                    role: "user",
                    parts: [{ text: "Hello" }],
                },
            ];
        }
    },

    storeModelResponse(conversationHistory, response) {
        try {
            conversationHistory.push({
                role: "model",
                content: response,
                timestamp: Date.now(),
            });
            return conversationHistory;
        } catch (error) {
            Logger.error("Error storing model response:", error);
            return conversationHistory;
        }
    },

    limitConversationHistory(conversationHistory, limit) {
        try {
            // If conversation exceeds limit, intelligently trim it
            if (conversationHistory.length > limit) {
                // Keep the most recent messages and some earlier context
                const recentCount = Math.floor(limit * 0.7); // 70% recent messages
                const contextCount = limit - recentCount; // 30% earlier context

                const recentMessages = conversationHistory.slice(-recentCount);

                // If we have enough history, grab some earlier context too
                if (conversationHistory.length > limit + 10) {
                    const earlyMessages = conversationHistory.slice(0, contextCount);
                    conversationHistory = [...earlyMessages, ...recentMessages];
                } else {
                    conversationHistory = recentMessages;
                }

                // Ensure we maintain user-model pairs
                if (conversationHistory.length % 2 !== 0) {
                    conversationHistory = conversationHistory.slice(1);
                }
            }
            return conversationHistory;
        } catch (error) {
            Logger.error("Error limiting conversation history:", error);
            return conversationHistory.slice(-10); // Fallback to last 10 messages
        }
    },

    async getAIResponse(geminiConversation, content) {
        try {
            // Enhanced context for better responses
            const contextualPrompt = this.enhancePromptWithContext(content, geminiConversation);

            // Start a chat with the conversation history
            const chat = model.startChat({
                history: geminiConversation.slice(0, -1), // Exclude the latest message
            });

            // Send the enhanced message to get a response
            const result = await chat.sendMessage(contextualPrompt);

            // Post-process the response for more natural feel
            let response = result.response.text();
            response = this.postProcessResponse(response);

            return response;
        } catch (error) {
            Logger.error("Error getting AI response:", error);

            // If we hit a content filtering issue
            if (error.message?.includes("blocked") || error.message?.includes("safety")) {
                const casualResponses = [
                    "hmm can't really go there, but what else is up?",
                    "let's talk about something else lol",
                    "nah can't chat about that, but how's your day going?",
                    "switching topics - what's been keeping you busy lately?",
                ];
                return casualResponses[Math.floor(Math.random() * casualResponses.length)];
            }

            // For other errors, propagate to caller for retry logic
            throw error;
        }
    },

    enhancePromptWithContext(content, conversation) {
        // Add subtle context hints for better responses
        const recentMessages = conversation.slice(-6); // Last 3 exchanges
        const hasRecentContext = recentMessages.length > 2;

        // Check for conversation patterns
        const isQuestion = content.includes("?");
        const isShort = content.length < 20;
        const hasEmoji =
            /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
                content,
            );

        let enhancedPrompt = content;

        // Add context hints without being obvious about it
        if (isShort && !isQuestion) {
            enhancedPrompt += " [respond naturally and conversationally]";
        } else if (isQuestion && hasRecentContext) {
            enhancedPrompt += " [reference our conversation if relevant]";
        }

        return enhancedPrompt;
    },

    postProcessResponse(response) {
        // Remove any AI-like phrases that might slip through
        const aiPhrases = [
            /As an AI,?\s*/gi,
            /I'm an AI assistant,?\s*/gi,
            /As a language model,?\s*/gi,
            /I don't have personal experiences,?\s*but\s*/gi,
            /I can't actually\s+/gi,
        ];

        let processed = response;
        aiPhrases.forEach((phrase) => {
            processed = processed.replace(phrase, "");
        });

        // Clean up any double spaces or awkward starts
        processed = processed.replace(/\s+/g, " ").trim();

        // If response starts awkwardly after cleaning, add a natural starter
        if (processed.match(/^(but|however|although)/i)) {
            const naturalStarters = ["hmm, ", "well, ", "tbh, ", ""];
            const starter = naturalStarters[Math.floor(Math.random() * naturalStarters.length)];
            processed = starter + processed.toLowerCase();
        }

        return processed;
    },

    analyzeMessageType(content) {
        return {
            isQuestion: content.includes("?"),
            isGreeting: /^(hi|hello|hey|sup|what's up|yo)\b/i.test(content),
            isShort: content.length < 20,
            isEmotional: /(!{2,}|love|hate|amazing|terrible|awesome|awful)/i.test(content),
            isPersonal: /\b(i|my|me|myself)\b/i.test(content),
            hasEmoji:
                /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]/u.test(
                    content,
                ),
            isCasual: /\b(lol|lmao|tbh|ngl|fr|bruh|omg)\b/i.test(content),
        };
    },

    adjustResponseForMessageType(response, messageType) {
        // For greetings, keep it casual
        if (messageType.isGreeting && response.length > 50) {
            const casualGreetings = ["hey!", "hi there!", "sup!", "hello!", "hey what's up!"];
            return casualGreetings[Math.floor(Math.random() * casualGreetings.length)];
        }

        // For very short messages, sometimes give short responses
        if (messageType.isShort && !messageType.isQuestion && Math.random() < 0.4) {
            if (response.length > 100) {
                // Truncate to first sentence or clause
                const firstSentence = response.split(/[.!?]/)[0];
                if (firstSentence.length > 10 && firstSentence.length < 80) {
                    return firstSentence + (Math.random() < 0.5 ? "!" : "");
                }
            }
        }

        // For emotional messages, match the energy
        if (messageType.isEmotional && !response.includes("!") && Math.random() < 0.6) {
            response = response.replace(/\.$/, "!");
        }

        return response;
    },

    // Clear user conversation history
    async clearUserHistory(userId, guildId) {
        try {
            if (!guildId) {
                Logger.error("Cannot clear history without guildId");
                return false;
            }

            // Find and update to ensure we're using the right schema fields
            const result = await ChatHistory.findOneAndUpdate(
                { userId, guildId },
                {
                    $set: {
                        messages: [],
                        lastUpdated: new Date(),
                    },
                },
                { upsert: true, new: true },
            );

            Logger.log("AI", `Cleared chat history for user ${userId} in guild ${guildId}`, "info");
            return true;
        } catch (error) {
            Logger.error("Error clearing user history:", error);
            return false;
        }
    },
};

// Improved utility function to send long messages with better chunking
async function sendLongMessage(message, content) {
    try {
        // Handle empty responses
        if (!content || content.trim() === "") {
            await message.reply(
                "I don't have a good response for that. Can you try asking something else?",
            );
            return;
        }

        const maxLength = 2000;

        // If content is short enough, send it as a single message
        if (content.length <= maxLength) {
            await message.reply(content);
            return;
        }

        // For longer content, split intelligently at paragraph or sentence boundaries
        const chunks = [];
        let currentChunk = "";

        // Split by paragraphs first
        const paragraphs = content.split(/\n\s*\n/);

        for (const paragraph of paragraphs) {
            // If paragraph fits in current chunk, add it
            if (currentChunk.length + paragraph.length + 2 <= maxLength) {
                currentChunk += (currentChunk ? "\n\n" : "") + paragraph;
            }
            // If paragraph alone exceeds max length, split by sentences
            else if (paragraph.length > maxLength) {
                // If we have content in current chunk, push it
                if (currentChunk) {
                    chunks.push(currentChunk);
                    currentChunk = "";
                }

                // Split paragraph by sentences
                const sentences = paragraph.split(/(?<=[.!?])\s+/);

                for (const sentence of sentences) {
                    // If sentence fits in current chunk, add it
                    if (currentChunk.length + sentence.length + 1 <= maxLength) {
                        currentChunk += (currentChunk ? " " : "") + sentence;
                    }
                    // If sentence alone exceeds max length, split by words
                    else if (sentence.length > maxLength) {
                        // If we have content in current chunk, push it
                        if (currentChunk) {
                            chunks.push(currentChunk);
                            currentChunk = "";
                        }

                        // Split sentence by strict character limit
                        let i = 0;
                        while (i < sentence.length) {
                            chunks.push(sentence.slice(i, i + maxLength));
                            i += maxLength;
                        }
                    }
                    // Start a new chunk with this sentence
                    else {
                        chunks.push(currentChunk);
                        currentChunk = sentence;
                    }
                }
            }
            // Start a new chunk with this paragraph
            else {
                chunks.push(currentChunk);
                currentChunk = paragraph;
            }
        }

        // Push final chunk if not empty
        if (currentChunk) {
            chunks.push(currentChunk);
        }

        // Handle the case where first message should be a reply
        const firstMessage = await message.reply(chunks[0]);

        // Send remaining chunks as follow-ups
        for (let i = 1; i < chunks.length; i++) {
            await message.channel.send(chunks[i]);
        }
    } catch (error) {
        Logger.error("Error sending long message:", error);
        // Try simpler approach on failure
        try {
            await message.reply(
                "I had a response, but couldn't send it properly. Let me try a simpler version...",
            );
            await message.channel.send(content.slice(0, 2000));
        } catch (fallbackError) {
            Logger.error("Error in fallback message sending:", fallbackError);
        }
    }
}
