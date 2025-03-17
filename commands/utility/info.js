const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { version } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get info about a user or a server!')
        .addStringOption(option =>
            option
                .setName('about')
                .setDescription('Choose what to get info about')
                .setRequired(true)
                .addChoices({ name: 'Server', value: 'server' }, { name: 'Bot', value: 'bot' })
        ),
    category: 'utility',
    async execute(interaction) {
        const textChosen = interaction.options.getString('about');

        if (textChosen === 'server') {
            const guildTextChannelCount = interaction.guild.channels.cache
                .filter(c => c.type === 0)
                .toJSON().length;
            const guildVoiceChannelCount = interaction.guild.channels.cache
                .filter(c => c.type === 2)
                .toJSON().length;
            const guildCategoryChannelCount = interaction.guild.channels.cache
                .filter(c => c.type === 4)
                .toJSON().length;
            const guildThreadsChannelCount = interaction.guild.channels.cache
                .filter(c => c.type === 5)
                .toJSON().length;

            const serverEmbed = new EmbedBuilder()
                .setTitle(`Server Information`)
                .setThumbnail(interaction.guild.iconURL()).setDescription(`
                    <a:server:1174372626475528226> **Server name:** ${interaction.guild.name}
                    <:owner:1220961237647622155> **Owner:** ${(await interaction.guild.fetchOwner()).user}
                    <:time:1220962252421599252> **Created at:** <t:${parseInt(interaction.guild.createdTimestamp / 1000)}:F>
                    <:globe:1220960794993492019> **Total Channels:** \`${guildTextChannelCount + guildVoiceChannelCount + guildThreadsChannelCount}\`
                    <:BF5:1220490510981009521> **Text Channels:** \`${guildTextChannelCount}\`
                    <:BF5:1220490510981009521> **Voice Channels:** \`${guildVoiceChannelCount}\`
                    <:BF5:1220490510981009521> **Category Channels:** \`${guildCategoryChannelCount}\`
                    <:BF5:1220490510981009521> **Threads Channels:** \`${guildThreadsChannelCount}\`
                    <:members:1220960228242227260> **Total members:** \`${interaction.guild.memberCount}\`
                    <:roleplaying:1220959187773685830> **Roles:** \`${interaction.guild.roles.cache.size}\`
                    <a:evolvingnitro:1174216699092930620> **Total boosts:** \`${interaction.guild.premiumSubscriptionCount}\`
                `);

            await interaction.reply({ embeds: [serverEmbed] });
        } else if (textChosen === 'bot') {
            try {
                const sent = await interaction.deferReply({ fetchReply: true });
                const uptime = formatUptime(interaction.client.uptime);

                const description = `\`\`\`fix\nDeveloper:   kio2gamer\nStatus:      Under Development\nLanguage:    JavaScript\nCreated on:  ${interaction.client.user.createdAt.toUTCString()}\`\`\``;
                const pingField = `\`\`\`fix\nPing:   ${sent.createdTimestamp - interaction.createdTimestamp} ms\nWS:     ${interaction.client.ws.ping} ms\nUptime: ${uptime}\nNode:   ${process.version}\nDJS:    v${version}\`\`\``;
                const statsField = `\`\`\`fix\nBot ID: ${interaction.client.user.id}\nType: Private\nCommands: 26\nCommands Type: Slash Commands\`\`\``;

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
                await interaction.editReply('Oops! There was an error.').then(msg => {
                    setTimeout(() => {
                        msg.delete();
                    }, 10000);
                });
                console.log(error);
            }
        }
    },
};

function formatUptime(uptimeMilliseconds) {
    const seconds = Math.floor(uptimeMilliseconds / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60);
    const secondsLeft = ((seconds % 86400) % 3600) % 60;

    return `${days}d ${hours}h ${minutes}m ${secondsLeft}s`;
}
