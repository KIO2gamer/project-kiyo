const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to reload.')
                .setRequired(true)),
    category: 'moderation',
    async execute(interaction) {
        const commandName = interaction.options.getString('command', true).toLowerCase();
        const command = interaction.client.commands.get(commandName);

        if (!command) {
            return interaction.reply({ content: `There is no command with name \`${commandName}\`!`, ephemeral: true });
        }

        const commandPath = path.resolve(__dirname, `../${command.category}/${command.data.name}.js`);

        try {
            // Remove the cached command module
            delete require.cache[require.resolve(commandPath)];

            // Require the new command module
            const newCommand = require(commandPath);

            // Delete the old command from the client's commands collection
            interaction.client.commands.delete(command.data.name);

            // Set the new command in the client's commands collection
            interaction.client.commands.set(newCommand.data.name, newCommand);

            await interaction.reply({ content: `Command \`${newCommand.data.name}\` was reloaded successfully!`, ephemeral: true });
        } catch (error) {
            console.error(error);
            await interaction.reply({ content: `There was an error while reloading the command \`${command.data.name}\`:\n\`${error.message}\``, ephemeral: true });
        }
    },
};
