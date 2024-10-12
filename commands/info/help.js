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
            .setName('search')
            .setDescription('The search term to filter commands by')
            .setRequired(false)
        ),
    async execute(interaction) {
        const commandName = interaction.options.getString('command')
        const search = interaction.options.getString('search')
        
        if (commandName) {
            const command = interaction.client.commands.get(commandName)
            if (!command) {
                return interaction.reply(`Command \`${commandName}\` not found.`)
            }
            const embed = new EmbedBuilder()
                .setTitle(`Help for \`${commandName}\``)
                .setDescription(command.description_full || command.data.description || 'No description provided.')
                .addFields(
                    { name: 'Usage', value: command.usage || 'No usage provided.' },
                    ...(command.usage !== command.examples.join('\n') ? [{ name: 'Examples', value: command.examples.join('\n') || 'No examples provided.' }] : [])
                )
            return interaction.reply({ embeds: [embed] })
        }
        else if (search) {
            const commands = interaction.client.commands.filter(command => command.data.name.toLowerCase().includes(search.toLowerCase()) || command.data.description.toLowerCase().includes(search.toLowerCase()))
            if (commands.size === 0) {
                return interaction.reply(`No commands found matching \`${search}\`.`)
            }
            const embed = new EmbedBuilder()
                .setTitle(`Commands matching \`${search}\``)
                .setDescription(commands.map(command => `\`${command.data.name}\``).join(', '))
            return interaction.reply({ embeds: [embed] })
        }
        else {
            const categories = new Map()
            interaction.client.commands.forEach(command => {
                if (!categories.has(command.category)) {
                    categories.set(command.category, [])
                }
                categories.get(command.category).push(command)
            })

            const embed = new EmbedBuilder()
                .setTitle('Available commands')

            categories.forEach((commands, category) => {
                embed.addFields({
                    name: category ? category.charAt(0).toUpperCase() + category.slice(1) : 'Uncategorized',
                    value: commands.map(command => `\`${command.data.name}\``).join(', ')
                })
            })
            console.log(category)
            return interaction.reply({ embeds: [embed] })
        }
    }
}