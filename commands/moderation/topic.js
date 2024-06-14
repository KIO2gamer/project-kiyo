const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('topic')
    .setDescription('Sends a message about changing the topic.')
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers | PermissionFlagsBits.ManageChannels)
    .addUserOption((option) => option.setName('user1').setDescription('The user1 to change the topic of.').setRequired(false))
    .addUserOption((option) => option.setName('user2').setDescription('The user2 to change the topic of.').setRequired(false))
    .addUserOption((option) => option.setName('user3').setDescription('The user3 to change the topic of.').setRequired(false)),
    category: 'utility',
    async execute(interaction) {
        const user1 = interaction.options.getUser('user1') || "";
        const user2 = interaction.options.getUser('user2') || "";
        const user3 = interaction.options.getUser('user3') || "";
        await interaction.reply({ content: 'Done', ephemeral: true });
        await interaction.channel.send(`${user1}${user2}${user3}\n**Please change the topic immediately. Failing to do so will result in a mute/ban.**`);
    }
}