const {
  SlashCommandBuilder,
  EmbedBuilder,
  version: djsVersion,
} = require('discord.js');

module.exports = {
  description_full:
    'Displays comprehensive information about the bot, including developer details, operational metrics, and system specifications.',
  usage: '/bot_info',
  examples: ['/bot_info'],
  category: 'info',
  data: new SlashCommandBuilder()
    .setName('bot_info')
    .setDescription('Retrieve detailed information about the bot.'),

  async execute(interaction) {
    const sent = await interaction.editReply({ content: 'Pinging...' });
    await sendBotInfo(sent, interaction);
  },
};

async function sendBotInfo(sent, interaction) {
  try {
    const uptime = formatUptime(interaction.client.uptime);
    const description = `\`\`\`fix
Developer: kio2gamer
Status: In Development
Language: JavaScript
Creation Date: ${interaction.client.user.createdAt.toUTCString()}
\`\`\``;

    const performanceMetrics = `\`\`\`fix
Latency: ${sent.createdTimestamp - interaction.createdTimestamp}ms
WebSocket: ${interaction.client.ws.ping}ms
Uptime: ${uptime}
Node.js Version: ${process.version}
discord.js Version: v${djsVersion}
\`\`\``;

    const systemSpecs = `\`\`\`fix 
Bot ID: ${interaction.client.user.id}
Type: Private
Command Count: ${interaction.client.commands.size}
Command Type: Slash Commands
Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
\`\`\``;

    const embed = new EmbedBuilder()
      .setTitle('Bot Information')
      .setURL(process.env.DISCORD_INVITE)
      .setColor('#8A2BE2')
      .setDescription(description)
      .addFields(
        {
          name: 'Performance Metrics',
          value: performanceMetrics,
          inline: true,
        },
        {
          name: 'System Specifications',
          value: systemSpecs,
          inline: true,
        },
      )
      .setFooter({
        text: 'Note: Invite link is restricted to bot owner only.',
      })
      .setTimestamp();

    await interaction.editReply({ content: ' ', embeds: [embed] });
  } catch (error) {
    console.error('Error retrieving bot information:', error);
    await interaction.editReply({
      content:
        'An unexpected error occurred while fetching bot information. Please try again later.',
      ephemeral: true,
    });
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
