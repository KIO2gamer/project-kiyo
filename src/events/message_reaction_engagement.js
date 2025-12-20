const { Events, EmbedBuilder } = require("discord.js");
const Logger = require("../utils/logger");

// In-memory tracker to avoid duplicate celebration messages per message ID
const celebratedMessages = new Set();
const STAR_EMOJI = "⭐";
const THRESHOLD = 3; // Number of star reactions before celebrating

module.exports = {
    name: Events.MessageReactionAdd,
    async execute(reaction, user) {
        try {
            // Ignore bots and partials we cannot fetch
            if (user.bot) return;
            if (reaction.partial) {
                try {
                    await reaction.fetch();
                } catch {
                    return;
                }
            }

            const message = reaction.message;
            if (!message.guild) return;

            // Only handle star reactions
            if (reaction.emoji.name !== STAR_EMOJI) return;

            // Avoid reacting to our own celebration messages
            if (celebratedMessages.has(message.id)) return;

            const starCount = reaction.count || reaction.users.cache.size;
            if (starCount < THRESHOLD) return;

            celebratedMessages.add(message.id);

            const embed = new EmbedBuilder()
                .setColor(0xffd166)
                .setTitle("Community Favorite ⭐")
                .setDescription(message.content?.slice(0, 1800) || "(no text content)")
                .addFields(
                    { name: "Author", value: `${message.author}`, inline: true },
                    { name: "Channel", value: `${message.channel}`, inline: true },
                    { name: "Stars", value: `${starCount}+`, inline: true },
                )
                .setTimestamp();

            // Attempt to include a jump link
            if (message.url) {
                embed.addFields({ name: "Jump", value: `[View Message](${message.url})` });
            }

            await message.channel.send({ embeds: [embed] });
        } catch (error) {
            await Logger.warn(`Reaction engagement handler failed: ${error.message}`);
        }
    },
};
