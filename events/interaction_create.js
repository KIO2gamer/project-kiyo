const { Events } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        if (!interaction.isCommand()) return;

        const command = interaction.client.commands.get(
            interaction.commandName
        );

        if (!command) {
            console.error(
                `No command matching ${interaction.commandName} was found.`
            );
            return;
        }

        try {
            if (interaction.commandName === 'get_yt_sub_role') {
                await command.execute(interaction);
                return;
            }
            // Defer reply to ensure response time is handled within the 3-second window
            await interaction.deferReply();

            // Execute the command
            await command.execute(interaction);
        } catch (error) {
            console.error(`Error executing ${interaction.commandName}`);
            console.error(error);

            // Send a failure message if something goes wrong
            try {
                await interaction.reply({
                    content: 'There was an error executing this command!',
                });
            } catch (editError) {
                console.error('Failed to edit reply: ', editError);
            }
        }
    },
};
