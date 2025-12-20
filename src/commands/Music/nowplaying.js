const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { useQueue } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("nowplaying")
        .setDescription("Show the currently playing song"),

    async execute(interaction) {
        const queue = useQueue(interaction.guild.id);

        if (!queue || !queue.isPlaying()) {
            return interaction.reply({
                content: "❌ No music is currently playing!",
                ephemeral: true,
            });
        }

        await interaction.deferReply();

        try {
            const track = queue.currentTrack;
            if (!track) {
                return interaction.editReply({
                    content: "❌ No track is currently playing!",
                });
            }

            const progress = queue.node.createProgressBar({
                length: 20,
                timecodes: true,
            });

            const requester =
                (track?.requestedBy && typeof track.requestedBy.toString === "function"
                    ? track.requestedBy.toString()
                    : null) ||
                (queue.metadata?.requestedBy &&
                typeof queue.metadata.requestedBy.toString === "function"
                    ? queue.metadata.requestedBy.toString()
                    : null) ||
                interaction.user.toString();

            const embed = new EmbedBuilder()
                .setColor("#00BFFF")
                .setTitle("🎵 Now Playing")
                .setDescription(`**[${track.title}](${track.url})**`)
                .addFields(
                    { name: "Artist", value: track.author || "Unknown", inline: true },
                    { name: "Duration", value: track.duration || "Unknown", inline: true },
                    {
                        name: "Requested by",
                        value: requester,
                        inline: true,
                    },
                    { name: "Progress", value: progress || "N/A" },
                )
                .setThumbnail(track.thumbnail)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            console.error(error);
            await interaction.editReply({
                content: `❌ An error occurred: ${error.message}`,
            });
        }
    },
};
