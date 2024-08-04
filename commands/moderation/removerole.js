const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('removerole')
        .setDescription('Removes a role from a user')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to remove the role from')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role to remove')
                .setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const role = interaction.options.getRole('role');
        const member = await interaction.guild.members.fetch(target.id);

        if (!member.roles.cache.has(role.id)) {
            return interaction.reply(`${target} does not have the ${role} role.`);
        }

        await member.roles.remove(role);
        return interaction.reply(`${target} has been removed from the ${role} role.`);
    },
};
