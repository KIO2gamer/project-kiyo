const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription('Get info about the bot.'),
    category: 'info',
    async execute(interaction) {
        await sendBotInfo(interaction);
    }
};

async function sendBotInfo(interaction) {
    try {
        const sent = await interaction.deferReply({ fetchReply: true });
        const uptime = formatUptime(interaction.client.uptime);

        const description = `\`\`\`fix\nDeveloper:   kio2gamer\nStatus:      Under Development\nLanguage:    JavaScript\nCreated on:  ${interaction.client.user.createdAt.toUTCString()}\`\`\``;
        const pingField = `\`\`\`fix\nPing:   ${sent.createdTimestamp - interaction.createdTimestamp} ms\nWS:     ${interaction.client.ws.ping} ms\nUptime: ${uptime}\nNode:   ${process.version}\nDJS:    v${version}\`\`\``;
        const statsField = `\`\`\`fix\nBot ID: ${interaction.client.user.id}\nType: Private\nCommands: ${interaction.client.commands.size}\nCommands Type: Slash Commands\`\`\``;

        const embed = new EmbedBuilder()
            .setTitle('Bot Info')
            .setColor('Purple')
            .setDescription(description)
            .addFields(
                { name: 'Ping', value: pingField, inline: true },
                { name: 'Stats', value: statsField, inline: true }
            );

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        console.error("Error fetching bot info:", error);
        await interaction.editReply({ content: 'Oops! There was an error.', ephemeral: true });
    }
}

function formatUptime(uptimeMilliseconds) {
    const seconds = Math.floor(uptimeMilliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    const secondsLeft = ((seconds % 86400) % 3600) % 60;

    return `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;
}