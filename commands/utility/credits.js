const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('credits')
    .setDescription('Shows a embed of users who helped make this bot.'),
    category: 'fun',
    async execute(interaction) {
        const embed = new EmbedBuilder()
            .setTitle('Credits')
            // .setDescription(`
            //     steeles.0 for - </steel:1204487408511483976>
            //     hallow_spice for - </koifish:1204462350913114159>
            //     umbree_on_toast for - </donottouch:1204459199686377562>
            //     flashxdfx for - </rickroll:1204438699258155049>
            //     eesmal for - </summon:1230217345985941574>
            //     na51f for - </snipe:1230417868013699072>
            // `)
            .setFields(
                { name: 'Slash Commands Contributors', value: '\n' },
                { name: 'steeles.0', value: '> </steel:1204487408511483976>' },
                { name: 'hallow_spice', value: '> </koifish:1204462350913114159>' },
                { name: 'umbree_on_toast', value: '> </donottouch:1204459199686377562>' },
                { name: 'flashxdfx', value: '> </rickroll:1204438699258155049>' },
                { name: 'eesmal', value: '> </summon:1230217345985941574>' },
                { name: 'na51f', value: '> </snipe:1230417868013699072>' }
            )
        await interaction.reply({ embeds: [embed] });
    }
}