const { SlashCommandBuilder, EmbedBuilder } = require('discord.js')

module.exports = {
    description_full:
        'Displays a list of available commands and their descriptions.',
    usage: '/help',
    examples: ['/help'],
    category: 'info',
data: new SlashCommandBuilder()
        .setName('help')
        .setDescription('Display a list of available commands')
        .addStringOption(option =>
            option
            .setName('command')
            .setDescription('The command to get help for')
            .setRequired(false)
        )
        .addStringOption(option =>
            option
            .setName('category')
            .setDescription('The category of commands to display')
            .setRequired(false)
        )
        .addStringOption(option =>
            option
            .setName('search')
            .setDescription('The search term to filter commands by')
            .setRequired(false)
        ),
    async execute(interaction) {
        const commandName = interaction.options.getString('command')
        const category = interaction.options.getString('category')
        const search = interaction.options.getString('search')
        
        if (commandName) {
            const command = interaction.client.commands.get(commandName)
            if (!command) {
                return interaction.reply(`Command \`${commandName}\` not found.`)
            }
            const embed = new EmbedBuilder()
                .setTitle(`Help for \`${commandName}\``)
                .setDescription(command.description_full || command.description || 'No description provided.')
                .addFields(
                    { name: 'Usage', value: command.usage || 'No usage provided.' },
                    ...(command.usage !== command.examples.join('\n') ? [{ name: 'Examples', value: command.examples.join('\n') || 'No examples provided.' }] : [])
                )
            return interaction.reply({ embeds: [embed] })
        }
        else if (category) {
            const commands = interaction.client.commands.filter(command => command.category === category)
            console.log(commands)
            if (commands.size === 0) {
                return interaction.reply(`No commands found in category \`${category}\`.`)
            }
            const embed = new EmbedBuilder()
                .setTitle(`Commands in category \`${category}\``)
                .setDescription(commands.map(command => `\`${command.data.name}\``).join(', '))
            return interaction.reply({ embeds: [embed] })
        }
    }
}