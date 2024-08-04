const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Adds a role to a user')
        .addUserOption(option => 
            option.setName('target')
                .setDescription('The user to assign the role to')
                .setRequired(true))
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('The role to assign')
                .setRequired(true)),
    async execute(interaction) {
        const target = interaction.options.getUser('target');
        const role = interaction.options.getRole('role');
        const member = await interaction.guild.members.fetch(target.id);

        if (member.roles.cache.has(role.id)) {
            return interaction.reply(`${target} already has the ${role} role.`);
        }

        await member.roles.add(role);
        return interaction.reply(`${target} has been given the ${role} role.`);
    },
};
