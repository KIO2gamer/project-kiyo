const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType,
} = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("Play a song from YouTube, Spotify, or other sources")
        .addStringOption((option) =>
            option
                .setName("query")
                .setDescription("The song URL or search query")
                .setRequired(true),
        ),

    async execute(interaction) {
        const query = interaction.options.getString("query");
        const voiceChannel = interaction.member.voice.channel;

        if (!voiceChannel) {
            return interaction.reply("You need to be in a voice channel to use this command!");
        }

        await interaction.deferReply();

        try {
            const player = interaction.client.player;

            // Search for the song
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
            });

            if (!searchResult.tracks.length) return interaction.followUp("No results found!");

            // If it's a direct URL or a playlist, play it immediately
            if (
                searchResult.playlist ||
                query.includes("youtube.com/") ||
                query.includes("youtu.be/") ||
                query.includes("spotify.com/") ||
                query.includes("soundcloud.com/")
            ) {
                // Create a queue instance
                const queue = player.nodes.create(interaction.guild, {
                    metadata: {
                        channel: interaction.channel,
                        client: interaction.guild.members.me,
                        requestedBy: interaction.user,
                    },
                    selfDeaf: true,
                    volume: 80,
                    leaveOnEmpty: true,
                    leaveOnEnd: true,
                });

                try {
                    if (!queue.connection) await queue.connect(voiceChannel);
                } catch {
                    queue.delete();
                    return interaction.followUp("Could not join your voice channel!");
                }

                // Handle playlist
                if (searchResult.playlist) {
                    queue.addTrack(searchResult.tracks);
                    await interaction.followUp(
                        `🎵 | Added ${searchResult.tracks.length} songs from **${searchResult.playlist.title}** to the queue!`,
                    );
                } else {
                    // Single track from URL
                    const track = searchResult.tracks[0];
                    queue.addTrack(track);
                    await interaction.followUp(`🎵 | Added **${track.title}** to the queue!`);
                }

                if (!queue.node.isPlaying()) {
                    await queue.node.play();
                }

                return;
            }

            // Get only first 10 results
            const tracks = searchResult.tracks.slice(0, 10);

            // Store tracks in client for the selection handler to access
            // This allows us to access the tracks when the select menu is used
            if (!interaction.client.songSelections) {
                interaction.client.songSelections = new Map();
            }

            // Store search results with the user's ID as the key
            interaction.client.songSelections.set(interaction.user.id, {
                tracks,
                voiceChannel,
                messageId: null, // Will be updated after sending
            });

            // Create selection menu
            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId("song-select")
                    .setPlaceholder("Select a song to play")
                    .addOptions(
                        tracks.map((track, index) => ({
                            label:
                                track.title.length > 100
                                    ? track.title.substring(0, 97) + "..."
                                    : track.title,
                            description: `By ${track.author} (${track.duration})`,
                            value: index.toString(),
                        })),
                    ),
            );

            // Create embed listing the songs
            const embed = new EmbedBuilder()
                .setTitle("🎵 Song Selection")
                .setDescription(
                    `Here are the search results for **${query}**.\nSelect a song from the dropdown menu below:`,
                )
                .addFields(
                    tracks.map((track, index) => ({
                        name: `${index + 1}. ${track.title}`,
                        value: `By ${track.author} | Duration: ${track.duration}`,
                        inline: false,
                    })),
                )
                .setColor("#FF0000");

            const response = await interaction.followUp({
                embeds: [embed],
                components: [row],
            });

            // Store the message ID so we can edit it later
            const selectionData = interaction.client.songSelections.get(interaction.user.id);
            selectionData.messageId = response.id;
            interaction.client.songSelections.set(interaction.user.id, selectionData);

            // Set a timeout to remove the menu after 30 seconds
            setTimeout(() => {
                const selectionData = interaction.client.songSelections.get(interaction.user.id);
                if (selectionData && selectionData.messageId === response.id) {
                    // Only edit if this is still the active selection
                    response.edit({ components: [] }).catch(() => {});
                    interaction.client.songSelections.delete(interaction.user.id);
                }
            }, 30000);
        } catch (error) {
            console.error(error);
            return interaction.followUp("There was an error trying to execute that command!");
        }
    },

    // Handler for the song selection menu
    async handleSelectMenu(interaction) {
        // Get the stored selection data
        const selectionData = interaction.client.songSelections.get(interaction.user.id);

        if (!selectionData) {
            return interaction.reply({
                content: "Your song selection has expired. Please run the play command again.",
                ephemeral: true,
            });
        }

        const { tracks, voiceChannel, messageId } = selectionData;

        // Get the selected track
        const trackIndex = parseInt(interaction.values[0]);
        const track = tracks[trackIndex];

        const player = interaction.client.player;

        // Create a queue instance
        const queue = player.nodes.create(interaction.guild, {
            metadata: {
                channel: interaction.channel,
                client: interaction.guild.members.me,
                requestedBy: interaction.user,
            },
            selfDeaf: true,
            volume: 80,
            leaveOnEmpty: true,
            leaveOnEnd: true,
        });

        try {
            if (!queue.connection) await queue.connect(voiceChannel);
        } catch (error) {
            queue.delete();
            return interaction.reply({
                content: "Could not join your voice channel!",
                ephemeral: true,
            });
        }

        // Add the track to the queue
        queue.addTrack(track);

        if (!queue.node.isPlaying()) {
            await queue.node.play();
        }

        // Update the original message
        const message = await interaction.channel.messages.fetch(messageId).catch(() => null);
        if (message) {
            await message
                .edit({
                    content: `🎵 | **${track.title}** selected by ${interaction.user}`,
                    components: [],
                    embeds: [],
                })
                .catch(() => {});
        }

        // Reply to the interaction
        await interaction.reply(`🎵 | Added **${track.title}** to the queue!`);

        // Clear the selection data
        interaction.client.songSelections.delete(interaction.user.id);
    },

    // Handler for the song selection menu
    async handleSelectMenu(interaction) {
        // Get selected track index
        const trackIndex = parseInt(interaction.values[0]);

        try {
            const player = interaction.client.player;

            // We need to run search again to get the track list
            const query = interaction.message.embeds[0].description.split("**")[1];
            const searchResult = await player.search(query, {
                requestedBy: interaction.user,
            });

            if (!searchResult.tracks.length) {
                return interaction.reply({
                    content: "No results found! Please try the search again.",
                    ephemeral: true,
                });
            }

            // Get the tracks and selected track
            const tracks = searchResult.tracks.slice(0, 10);
            const track = tracks[trackIndex];
            const voiceChannel = interaction.member.voice.channel;

            if (!voiceChannel) {
                return interaction.reply({
                    content: "You need to be in a voice channel to play music!",
                    ephemeral: true,
                });
            }

            // Create a queue instance
            const queue = player.nodes.create(interaction.guild, {
                metadata: {
                    channel: interaction.channel,
                    client: interaction.guild.members.me,
                    requestedBy: interaction.user,
                },
                selfDeaf: true,
                volume: 80,
                leaveOnEmpty: true,
                leaveOnEnd: true,
            });

            try {
                if (!queue.connection) await queue.connect(voiceChannel);
            } catch {
                queue.delete();
                return interaction.reply({
                    content: "Could not join your voice channel!",
                    ephemeral: true,
                });
            }

            queue.addTrack(track);

            if (!queue.node.isPlaying()) {
                await queue.node.play();
            }

            // Update the original message
            await interaction.message
                .edit({
                    content: `🎵 | **${track.title}** selected by ${interaction.user}`,
                    components: [],
                    embeds: [],
                })
                .catch(() => {});

            // Reply to the interaction
            await interaction.reply(`🎵 | Added **${track.title}** to the queue!`);
        } catch (error) {
            console.error("Error in song selection handler:", error);
            return interaction.reply({
                content: "There was an error while processing your selection.",
                ephemeral: true,
            });
        }
    },
};
