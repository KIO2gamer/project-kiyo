const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder().setName("queue").setDescription("Shows the current song queue"),

    async execute(interaction) {
        // Get the queue for the server (using v5+ method)
        const queue = interaction.client.player.nodes.get(interaction.guild.id);

        // Check if there is a queue and if music is playing
        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply("No music is currently playing.");
        }

        // Get current track
        const currentTrack = queue.currentTrack;

        // Get upcoming tracks in queue
        const tracks = queue.tracks.data.slice(0, 10).map((track, i) => {
            return `${i + 1}. **${track.title}** ([link](${track.url}))`;
        });

        const embed = new EmbedBuilder()
            .setTitle("Server Queue")
            .setDescription(
                `Currently Playing: **${currentTrack.title}** ([link](${currentTrack.url}))\n\n${tracks.join("\n")}${
                    queue.tracks.data.length > 10
                        ? `\n...${queue.tracks.data.length - 10} more track(s)`
                        : ""
                }`,
            )
            .setColor("#FF0000");

        return interaction.reply({ embeds: [embed] });
    },
};
