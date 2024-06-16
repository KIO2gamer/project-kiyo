const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('user')
    .setDescription('Get info about a user')
    .addUserOption(option => option.setName('target').setDescription('The user id')),
    category: 'utility',
    async execute(interaction) {
        const user = interaction.options.getInteger('target') || interaction.user;
        const guildUser = await interaction.guild.members.fetch(user.id);
        const UserEmbed = new EmbedBuilder()
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: '**Username:** ', value: `\`${user.username}\``},
                { name: '**Roles:** \n', value: `${guildUser.roles.cache.map(r => r).join(' | ')}` },
                { name: '**Joined server:** ', value: `<t:${parseInt(guildUser.joinedAt / 1000)}:R>`, inline: true },
                { name: '**Created Discord:** ', value: `<t:${parseInt(user.createdAt / 1000)}:R>`, inline: true },
            )
            .setFooter({ text: `User ID: ${user.id}` })
            .setTimestamp()
            .setColor('Random')
        await interaction.reply({ embeds: [UserEmbed] });
        console.log(guildUser)
    }
}
