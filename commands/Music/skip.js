const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("skip")
        .setDescription("Skip to the next song in the queue"),

    async execute(interaction) {
        const queue = interaction.client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply("No music is currently playing.");
        }

        const currentSong = queue.currentTrack;

        queue.node.skip();
        interaction.reply(`⏭️ | Skipped **${currentSong.title}**`);
    },
};
