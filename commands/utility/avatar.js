const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Get the avatar of the user.')
        .addUserOption(option =>
            option.setName('target').setDescription("The user's avatar to show").setRequired(true)
        ),
    category: 'utility',
    async execute(interaction) {
        const userTarget = interaction.options.getUser('target');
        if (userTarget.id === interaction.user.id) {
            const yourEmbed = new EmbedBuilder()
                .setTitle(`Your Avatar : `)
                .setImage(userTarget.displayAvatarURL());

            return interaction.reply({ embeds: [yourEmbed] });
        }
        const avatarEmbed = new EmbedBuilder()
            .setTitle(`${userTarget.username}'s Avatar`)
            .setImage(userTarget.displayAvatarURL());

        return interaction.reply({ embeds: [avatarEmbed] });
    },
};
