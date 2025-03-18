const { SlashCommandBuilder } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("stop")
        .setDescription("Stops the music and clears the queue"),

    async execute(interaction) {
        const queue = interaction.client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply("No music is currently playing.");
        }

        queue.delete();
        interaction.reply("🛑 | Stopped the music and cleared the queue!");
    },
};
