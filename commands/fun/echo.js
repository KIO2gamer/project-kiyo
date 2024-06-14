const {
    SlashCommandBuilder,
    ChannelType,
    EmbedBuilder,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('echo')
        .setDescription('Replies with your input!')
        .addStringOption(option =>
            option.setName('input')
            .setDescription('The input to echo back')
            // Ensure the text will fit in an embed description, if the user chooses that option
            .setMaxLength(2000)
            .setRequired(true))
        .addChannelOption(option =>
            option
            .setName('channel')
            .setDescription('The channel to echo into')
            // Ensure the user can only select a TextChannel for output
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true))
        .addBooleanOption(option =>
            option
            .setName('embed')
            .setDescription('Whether or not the echo should be embedded'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    category: 'fun',
    async execute(interaction) {
        const input = interaction.options.getString('input');
        const channel = interaction.options.getChannel('channel');
        const embed = interaction.options.getBoolean('embed');

        if (embed) {
            const echoEmbed = new EmbedBuilder()
                .setTitle(`Echoed by ${interaction.user.tag}`)
                .setDescription(`**Message:** ${input}`)

            await channel.send({
                embeds: [echoEmbed]
            });
            await interaction.reply({
                content: 'Echoed successfully',
                ephemeral: true
            })
        } else {
            await channel.send(`Message: ${input}\nEchoed by: ${interaction.user.tag}`);
            await interaction.reply({
                content: 'Echoed successfully',
                ephemeral: true
            })
        }
    },
}