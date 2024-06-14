const { Events, EmbedBuilder } = require('discord.js')

module.exports = {
  name: Events.GuildMemberAdd,
  once: false,
  async execute(interaction) {
    const channelId = '935017969271054352'
    const channel = interaction.client.channels.cache.get(channelId)

    const welcomeCard = `https://api.popcat.xyz/welcomecard?background=https://wallpapers-clan.com/wp-content/uploads/2023/11/cool-minecraft-pixel-desktop-wallpaper-preview.jpg&text1=${encodeURIComponent(
      interaction.user.username
    )}&text2=Welcome+To+${encodeURIComponent(
      interaction.guild.name
    )}&text3=Member+${String(
      interaction.guild.memberCount
    )}&avatar=${interaction.user.avatarURL({ extension: 'png' })}`

    await channel.send(welcomeCard)
  },
}