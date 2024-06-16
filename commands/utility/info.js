const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { version } = require('discord.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('info')
        .setDescription('Get info about a user or a server!')
        .addStringOption(option => option
            .setName('about')
            .setDescription('Choose what to get info about')
            .setRequired(true)
            .addChoices(
                { name: 'Server', value: 'server' },
                { name: 'Bot', value: 'bot' },
            )),
    category: 'utility',
    async execute(interaction) {
        const textChosen = interaction.options.getString('about');

        if (textChosen === 'server') {
            const { guild } = interaction;

            const serverName = guild.name;
            const serverID = guild.id;
            const owner = await guild.fetchOwner();
            const memberCount = guild.memberCount;
            const createdAt = guild.createdAt;
            const iconURL = guild.iconURL({ dynamic: true, size: 512 });
            const textChannelsCount = guild.channels.cache.filter(channel => channel.type === 0).size; // Type 0 is for GUILD_TEXT
            const voiceChannelsCount = guild.channels.cache.filter(channel => channel.type === 2).size; // Type 2 is for GUILD_VOICE
            const rolesCount = guild.roles.cache.size;
            const emojisCount = guild.emojis.cache.size;
            const boostLevel = guild.premiumTier;
            const boostsCount = guild.premiumSubscriptionCount;
            const verificationLevel = guild.verificationLevel;
            const description = guild.description || 'No description';
            const bannerURL = guild.bannerURL({ size: 512 }) || 'No banner';
            const afkChannel = guild.afkChannel ? guild.afkChannel.name : 'None';
            const afkTimeout = guild.afkTimeout / 60; // in minutes
            const explicitContentFilter = guild.explicitContentFilter;
            const defaultMessageNotifications = guild.defaultMessageNotifications;
            const maxMembers = guild.maximumMembers || 'Unlimited';
            const maxPresences = guild.maximumPresences || 'Unlimited';
            const onlineMembers = guild.members.cache.filter(member => member.presence?.status === 'online').size;
            const dndMembers = guild.members.cache.filter(member => member.presence?.status === 'dnd').size;
            const idleMembers = guild.members.cache.filter(member => member.presence?.status === 'idle').size;
            const offlineMembers = guild.members.cache.filter(member => !member.presence || member.presence.status === 'offline').size;
            const mfaLevel = guild.mfaLevel;
            const systemChannel = guild.systemChannel ? guild.systemChannel.name : 'None';
            const rulesChannel = guild.rulesChannel ? guild.rulesChannel.name : 'None';
            const vanityURLCode = guild.vanityURLCode || 'None';
            const partnered = guild.partnered;
            const verified = guild.verified;
            const preferredLocale = guild.preferredLocale;
            const boostProgressBarEnabled = guild.premiumProgressBarEnabled;

            // Calculate server creation time in years
            const creationDate = new Date(createdAt);
            const currentDate = new Date();
            const yearsAgo = currentDate.getFullYear() - creationDate.getFullYear();

            // Create an embed with the server info
            const serverInfoEmbed = new EmbedBuilder()
                .setTitle(`Server Information [ ${serverName} ]`)
                .setThumbnail(iconURL)
                .addFields(
                    { name: '📋 Name', value: serverName, inline: true },
                    { name: '🆔 ID', value: serverID, inline: true },
                    { name: '👑 Owner', value: `${owner.user.tag}`, inline: true },
                    { name: '📅 Created', value: `${yearsAgo} years ago`, inline: true },
                    { name: '📊 Channels', value: `Text: ${textChannelsCount} | Voice: ${voiceChannelsCount}`, inline: true },
                    { name: '👥 Members', value: `Total: ${memberCount}\nOnline: ${onlineMembers}\nDND: ${dndMembers}\nIdle: ${idleMembers}`, inline: true },
                    { name: '🎭 Roles', value: `${rolesCount}`, inline: true },
                    { name: '😁 Emojis', value: `${emojisCount}`, inline: true },
                    { name: '🔰 Boost Level', value: `${boostLevel} (${boostsCount} boosts)`, inline: true },
                    { name: '🛡️ Verification', value: `${verificationLevel}`, inline: true },
                    { name: '📝 Description', value: description, inline: false },
                    { name: '⚙️ System', value: `AFK: ${afkChannel}, Timeout: ${afkTimeout}m, Sys: ${systemChannel}`, inline: true },
                    { name: '🔒 MFA Level', value: `${mfaLevel}`, inline: true },
                    { name: '🌍 Locale', value: `${preferredLocale}`, inline: true },
                    { name: '🏅 Partnered', value: `${partnered}`, inline: true },
                    { name: '✅ Verified', value: `${verified}`, inline: true },
                    { name: '🔗 Vanity URL', value: vanityURLCode, inline: true },
                    { name: '📊 Boost Progress Bar', value: `${boostProgressBarEnabled}`, inline: true }
                )
                .setColor(0x00AE86);
            await interaction.reply({ embeds: [serverInfoEmbed] });
		}
        else if (textChosen === 'bot') {
            try {
                const sent = await interaction.deferReply({ fetchReply: true })
                const uptime = formatUptime(interaction.client.uptime)
          
                const description = `\`\`\`fix\nDeveloper:   kio2gamer\nStatus:      Under Development\nLanguage:    JavaScript\nCreated on:  ${interaction.client.user.createdAt.toUTCString()}\`\`\``
                const pingField = `\`\`\`fix\nPing:   ${sent.createdTimestamp - interaction.createdTimestamp} ms\nWS:     ${interaction.client.ws.ping} ms\nUptime: ${uptime}\nNode:   ${process.version}\nDJS:    v${version}\`\`\``
                const statsField = `\`\`\`fix\nBot ID: ${interaction.client.user.id}\nType: Private\nCommands: 26\nCommands Type: Slash Commands\`\`\``
          
                const embed = new EmbedBuilder()
                    .setTitle('Bot Info')
                    .setColor('Purple')
                    .setDescription(description)
                    .addFields(
                    { name: 'Ping', value: pingField, inline: true },
                    { name: 'Stats', value: statsField, inline: true }
                )

                await interaction.editReply({ embeds: [embed] })
              } catch (error) {
                await interaction.editReply('Oops! There was an error.').then((msg) => {setTimeout(() => {msg.delete()}, 10000)})
                console.log(error)
              }
        }
	},
}

function formatUptime(uptimeMilliseconds) {
    const seconds = Math.floor(uptimeMilliseconds / 1000)
    const days = Math.floor(seconds / 86400)
    const hours = Math.floor((seconds % 86400) / 3600)
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60)
    const secondsLeft = ((seconds % 86400) % 3600) % 60
  
    return `${days}d ${hours}h ${minutes}m ${secondsLeft}s`
}
