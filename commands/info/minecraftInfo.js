const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('minecraft')
        .setDescription('Sends info about a Minecraft player')
        .addStringOption(option => option
            .setName('username')
            .setDescription('Search for a Minecraft player')
            .setRequired(true)),
    category: 'fun',
    cooldown: 10, // Command cooldown in seconds
    async execute(interaction) {
        const username = interaction.options.getString('username');

        try {
            const response = await fetch(`https://api.mojang.com/users/profiles/minecraft/${username}`);
            const data = await response.json();

            if (data && data.id && data.name) {
                const skinUrl = `https://crafatar.com/avatars/${data.id}?size=512&overlay`;

                const playerData = {
                    name: data.name,
                    uuid: data.id,
                    skinUrl: skinUrl
                };

                await interaction.reply({ embeds: [createEmbed(playerData)] });
            } else {
                await interaction.reply('Could not find the Minecraft player.');
            }
        } catch (error) {
            console.error(error);
            await interaction.reply('An error occurred while fetching the player information. Please try again later.');
        }
    },
};

function createEmbed(playerData) {
    return new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`Minecraft Player: ${playerData.name}`)
        .setImage(playerData.skinUrl)
        .addFields(
            { name: 'Username', value: playerData.name, inline: true },
            { name: 'UUID', value: playerData.uuid, inline: true }
        )
        .setTimestamp();
}
