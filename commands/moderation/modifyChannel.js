const { SlashCommandBuilder } = require('@discordjs/builders');
const { PermissionFlagsBits, PermissionsBitField } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modifychannel')
        .setDescription('Modifies the selected channel.')
        .addChannelOption(option => 
            option.setName('channel')
                .setDescription('The channel to modify')
                .setRequired(true))
        .addStringOption(option => 
            option.setName('name')
                .setDescription('New name of the channel'))
        .addStringOption(option => 
            option.setName('topic')
                .setDescription('New description (topic) of the channel')),
    category: 'moderation',
    async execute(interaction) {
        const channel = interaction.options.getChannel('channel');
        const newName = interaction.options.getString('name');
        const newTopic = interaction.options.getString('topic');

        if (!channel.isTextBased()) {
            return interaction.reply({ content: 'Please select a text-based channel.', ephemeral: true });
        }

        // Check if user has permission to manage channels
        if (!interaction.member.permissions.has(PermissionFlagsBits.ManageChannels)) {
            return interaction.reply({ content: 'You do not have permission to manage channels.', ephemeral: true });
        }
        try {
            // Modify channel name
            if (newName) { await channel.setName(newName); }
            // Modify channel topic (description)
            if (newTopic) { await channel.setTopic(newTopic); }
            return interaction.reply({ content: 'Channel successfully modified.', ephemeral: true });
        } catch (error) {
            console.error(error);
            return interaction.reply({ content: `An error occurred while modifying the channel: ${error.message}`, ephemeral: true });
        }
    }
};
