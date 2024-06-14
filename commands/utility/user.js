const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Get info about a user')
    .addIntegerOption(option => option.setName('target').setDescription('The user id').setRequired(true)),
    category: 'utility',
    async execute(interaction) {
        const user = interaction.options.getInteger('target') || interaction.user;
        const guildUser = await interaction.guild.members.fetch(user.id);
        const UserEmbed = new EmbedBuilder()
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '**Username:** ', value: `\`${user.username}\``, inline: true },
                { name: '**User ID:** ', value: `\`${user.id}\``, inline: true },
                { name: '**Roles:** \n', value: `${guildUser.roles.cache.map(r => r).join(' ')}` },
                { name: '**Joined at:** ', value: `<t:${parseInt(guildUser.joinedAt / 1000)}:F>` },
            )
            .setColor('Random')
        await interaction.reply({ embeds: [UserEmbed] });
    }
}
