const { SlashCommandBuilder } = require("discord.js");
const { QueueRepeatMode } = require("discord-player");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("loop")
        .setDescription("Change the loop mode")
        .addStringOption((option) =>
            option
                .setName("mode")
                .setDescription("The loop mode to set")
                .setRequired(true)
                .addChoices(
                    { name: "Off", value: "off" },
                    { name: "Track", value: "track" },
                    { name: "Queue", value: "queue" },
                ),
        ),

    async execute(interaction) {
        const queue = interaction.client.player.nodes.get(interaction.guild.id);

        if (!queue || !queue.node.isPlaying()) {
            return interaction.reply("No music is currently playing.");
        }

        const loopMode = interaction.options.getString("mode");

        let mode;
        switch (loopMode) {
            case "off":
                mode = QueueRepeatMode.OFF;
                break;
            case "track":
                mode = QueueRepeatMode.TRACK;
                break;
            case "queue":
                mode = QueueRepeatMode.QUEUE;
                break;
            default:
                mode = QueueRepeatMode.OFF;
        }

        // Set the repeat mode
        queue.setRepeatMode(mode);

        const modeMessages = {
            [QueueRepeatMode.OFF]: "Loop mode turned off",
            [QueueRepeatMode.TRACK]: "🔂 Now looping the current track",
            [QueueRepeatMode.QUEUE]: "🔁 Now looping the entire queue",
        };

        return interaction.reply(modeMessages[mode]);
    },
};
