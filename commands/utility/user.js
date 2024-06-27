const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('user')
        .setDescription('Get info about a user')
        .addUserOption(option => option.setName('target').setDescription('The user to get info about')),
    category: 'utility',
    async execute(interaction) {
        const user = interaction.options.getUser('target') || interaction.user;
        let guildUser;

        try {
            guildUser = await interaction.guild.members.fetch(user.id);
        } catch (error) {
            return interaction.reply({ content: 'User not found in this server.', ephemeral: true });
        }

        const roles = guildUser.roles.cache
            .filter(role => role.id !== interaction.guild.id)
            .map(role => role.toString())
            .join(' | ');

        const presence = guildUser.presence ? guildUser.presence.status : 'offline';
        const userFlags = guildUser.user.flags.toArray().map(flag => flag.replace(/_/g, ' '));

        const UserEmbed = new EmbedBuilder()
            .setTitle(`${user.username}'s Information`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Username:', value: `\`${user.username}\``, inline: true },
                { name: 'ID:', value: `\`${user.id}\``, inline: true },
                { name: 'Presence:', value: `\`${presence}\``, inline: true },
                { name: 'Bot:', value: `\`${user.bot ? 'Yes' : 'No'}\``, inline: true },
                { name: 'System:', value: `\`${user.system ? 'Yes' : 'No'}\``, inline: true },
                { name: 'Flags:', value: `\`${userFlags || 'None'}\``, inline: true },
                { name: 'Roles:', value: `${roles || 'None'}` },
                { name: 'Joined Server:', value: `<t:${parseInt(guildUser.joinedTimestamp / 1000)}:R>`, inline: true },
                { name: 'Account Created:', value: `<t:${parseInt(user.createdTimestamp / 1000)}:R>`, inline: true }
            )
            .setTimestamp()
            .setColor('Random');

        await interaction.reply({ embeds: [UserEmbed] });
    }
};
