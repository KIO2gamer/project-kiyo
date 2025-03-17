const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

// Command definitions object - each contains its own definition and execute function
const commands = {
    chairhit: {
        data: new SlashCommandBuilder().setName('chairhit').setDescription('yeet the chair fr'),
        category: 'fun',
        async execute(interaction) {
            await interaction.reply('https://tenor.com/view/chair-hit-throw-rigby-gif-17178150');
        },
    },

    kill: {
        data: new SlashCommandBuilder()
            .setName('kill')
            .setDescription("Sends an assassin to the user's home address."),
        category: 'fun',
        async execute(interaction) {
            await interaction.reply(
                `i got yr home address\nalso get rekt bozo coz im sending a hitman to yeet ya`
            );
        },
    },

    koifish: {
        data: new SlashCommandBuilder().setName('koifish').setDescription('fish'),
        category: 'fun',
        async execute(interaction) {
            await interaction.reply(
                'https://tenor.com/view/feesh-yeet-feesh-yeet-fish-yeet-fish-throw-gif-21734241'
            );
        },
    },

    rickroll: {
        data: new SlashCommandBuilder().setName('rickroll').setDescription('Sends a rickroll gif'),
        category: 'fun',
        async execute(interaction) {
            await interaction.reply(
                'https://tenor.com/view/rickroll-roll-rick-never-gonna-give-you-up-never-gonna-gif-22954713'
            );
        },
    },

    donottouch: {
        data: new SlashCommandBuilder()
            .setName('donottouch')
            .setDescription('JUST DO NOT EVER RUN THIS. YOUR PC WILL BLOW UP.'),
        category: 'fun',
        async execute(interaction) {
            await interaction.reply(
                `Oh? so you found the secret? well well well, its time for your pc to blow up.\nand also your discord acc is being reported for finding it illegally ||joke btw||\n||or maybe fr?||`
            );
        },
    },

    snipe: {
        data: new SlashCommandBuilder()
            .setName('snipe')
            .setDescription('Snipes the user')
            .addUserOption(option =>
                option.setName('user').setDescription('The user to snipe').setRequired(true)
            ),
        category: 'fun',
        async execute(interaction) {
            const userOption = interaction.options.getUser('user');
            const userId = userOption.id;
            const embed = new EmbedBuilder()
                .setTitle('Sniped Successful')
                .setDescription(`Your target (<@${userId}>) has been sniped.`)
                .setColor('#00ff00')
                .setFooter({
                    text: `Executed by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL(),
                });
            (await interaction.channel.send({
                content: `https://tenor.com/view/family-guy-peter-griffin-gun-point-sniper-rifle-gif-16445332`,
            })) && interaction.channel.send({ embeds: [embed] });
        },
    },

    steel: {
        data: new SlashCommandBuilder().setName('steel').setDescription('steel'),
        category: 'fun',
        async execute(interaction) {
            await interaction.reply('Guess wat? you just got steeled.\n*metal pipe drop sound*');
        },
    },

    summon: {
        data: new SlashCommandBuilder()
            .setName('summon')
            .setDescription('Summons the user from the undead')
            .addUserOption(option =>
                option.setName('user').setDescription('The user to summon').setRequired(true)
            ),
        category: 'fun',
        async execute(interaction) {
            const userOption = interaction.options.getUser('user');
            const userId = userOption.id;
            const embed = new EmbedBuilder()
                .setTitle('Summon Successful')
                .setDescription(`Summoned <@${userId}>`)
                .setColor('#00ff00');
            (await interaction.channel.send({
                content: `https://tenor.com/view/cat-spiritus-summon-vintage-fountain-pen-gif-22872604`,
            })) && interaction.channel.send({ embeds: [embed] });
        },
    },
};

// Export all commands as separate modules to maintain compatibility with command loader
module.exports = Object.values(commands);
