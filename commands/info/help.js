const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

const commandData = new SlashCommandBuilder()
    .setName('help')
    .setDescription('Get help with commands.');

module.exports = {
    data: commandData,
    async execute(interaction) {
        const commandsDirectory = path.join(__dirname, '..'); 
        const categories = fs.readdirSync(commandsDirectory).filter(f => fs.statSync(path.join(commandsDirectory, f)).isDirectory());

        const generateHelpEmbed = (categoryIndex) => {
            const category = categories[categoryIndex];
            const embed = new EmbedBuilder()
                .setColor('#2ecc71') 
                .setTitle(`Help - ${category.toUpperCase()}`)
                .setDescription(`Use buttons to navigate categories.\n\n**${category.toUpperCase()} Commands:**`);

            const commandFiles = fs.readdirSync(path.join(commandsDirectory, category)).filter(file => file.endsWith('.js'));
            commandFiles.forEach(file => {
                const command = require(`../${category}/${file}`);
                embed.addFields({ name: `/${command.data.name}`, value: command.data.description || 'No description provided.' });
            });

            return embed;
        };

        let currentCategoryIndex = 0;
        const initialEmbed = generateHelpEmbed(currentCategoryIndex);

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('prev')
                    .setLabel('◀️ Previous')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentCategoryIndex === 0),
                new ButtonBuilder()
                    .setCustomId('next')
                    .setLabel('Next ▶️')
                    .setStyle(ButtonStyle.Primary)
                    .setDisabled(currentCategoryIndex === categories.length - 1)
            );

        const message = await interaction.reply({ embeds: [initialEmbed], components: [buttons], fetchReply: true });

        const collector = message.createMessageComponentCollector({ componentType: 'BUTTON', time: 60000 }); 

        collector.on('collect', async i => {
            if (i.user.id !== interaction.user.id) return i.reply({ content: "This isn't for you!", ephemeral: true });

            if (i.customId === 'prev') currentCategoryIndex--;
            else if (i.customId === 'next') currentCategoryIndex++;

            buttons.components[0].setDisabled(currentCategoryIndex === 0); 
            buttons.components[1].setDisabled(currentCategoryIndex === categories.length - 1); 

            const newEmbed = generateHelpEmbed(currentCategoryIndex);
            await i.update({ embeds: [newEmbed], components: [buttons] });
        });

        collector.on('end', () => interaction.editReply({ components: [] })); 
    }
};