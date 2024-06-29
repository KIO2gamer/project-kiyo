const { Client, GatewayIntentBits, SlashCommandBuilder, PermissionFlagsBits, MessageActionRow, MessageButton } = require('discord.js');
const path = require('path');
const fs = require('fs');

const ITEMS_PER_PAGE = 5; // Number of commands per page

const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.DirectMessageReactions,
      GatewayIntentBits.MessageContent,
    ],
  });

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('Reloads a command.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
        .addStringOption(option =>
            option.setName('command')
                .setDescription('The command to reload.')
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('all')
                .setDescription('Reload all commands.')
                .setRequired(false)),
                category: 'utility',
    async execute(interaction) {
        const commandName = interaction.options.getString('command', false)?.toLowerCase();
        const reloadAll = interaction.options.getBoolean('all', false);

        if (reloadAll) {
            try {
                const commandFiles = getAllCommandFiles();

                for (const file of commandFiles) {
                    const commandPath = path.resolve(__dirname, `../${getCommandCategory(file)}/${file}.js`);
                    reloadCommand(interaction.client, commandPath, file);
                }

                await interaction.reply({ content: 'All commands have been reloaded successfully!', ephemeral: true });
            } catch (error) {
                console.error('Error reloading all commands:', error);
                await interaction.reply({ content: `There was an error while reloading all commands:\n\`${error.message}\``, ephemeral: true });
            }
        } else if (commandName) {
            const commandPath = path.resolve(__dirname, `../${getCommandCategory(commandName)}/${commandName}.js`);

            try {
                reloadCommand(interaction.client, commandPath, commandName);
                await interaction.reply({ content: `Command \`${commandName}\` was reloaded successfully!`, ephemeral: true });
            } catch (error) {
                console.error(`Error reloading command ${commandName}:`, error);
                await interaction.reply({ content: `There was an error while reloading the command \`${commandName}\`:\n\`${error.message}\``, ephemeral: true });
            }
        } else {
            // Pagination code
            await paginate(interaction);
        }
    },
};

// Helper function to get all command files
function getAllCommandFiles() {
    const commandsDir = path.resolve(__dirname, '..');
    const commandFiles = fs.readdirSync(commandsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .flatMap(dirent => {
            const categoryDir = path.join(commandsDir, dirent.name);
            return fs.readdirSync(categoryDir)
                .filter(file => file.endsWith('.js'))
                .map(file => path.basename(file, '.js'));
        });
    return commandFiles;
}

// Helper function to get the category of a command
function getCommandCategory(commandName) {
    const commandsDir = path.resolve(__dirname, '..');
    const categories = fs.readdirSync(commandsDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory());
    
    for (const category of categories) {
        const categoryDir = path.join(commandsDir, category.name);
        if (fs.existsSync(path.join(categoryDir, `${commandName}.js`))) {
            return category.name;
        }
    }
    return null;
}

// Helper function to reload a command
function reloadCommand(client, commandPath, commandName) {
    // Log the path being reloaded
    console.log(`Reloading command at path: ${commandPath}`);

    // Check if the file exists
    if (!fs.existsSync(commandPath)) {
        throw new Error(`The command file \`${commandPath}\` does not exist!`);
    }

    // Remove the cached command module
    delete require.cache[require.resolve(commandPath)];

    // Require the new command module
    const newCommand = require(commandPath);

    // Delete the old command from the client's commands collection
    client.commands.delete(commandName);

    // Set the new command in the client's commands collection
    client.commands.set(newCommand.data.name, newCommand);
}

// Pagination code
async function paginate(interaction, page = 1) {
    const commandFiles = getAllCommandFiles();
    const totalPages = Math.ceil(commandFiles.length / ITEMS_PER_PAGE);

    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = page * ITEMS_PER_PAGE;
    const commandsOnPage = commandFiles.slice(start, end);

    const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('prev_page')
                .setLabel('Previous')
                .setStyle('PRIMARY')
                .setDisabled(page === 1),
            new MessageButton()
                .setCustomId('next_page')
                .setLabel('Next')
                .setStyle('PRIMARY')
                .setDisabled(page === totalPages)
        );

    await interaction.reply({ content: `Commands:\n${commandsOnPage.join('\n')}`, components: [row], ephemeral: true });

    const filter = i => ['prev_page', 'next_page'].includes(i.customId) && i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

    collector.on('collect', async i => {
        if (i.customId === 'prev_page') {
            page--;
        } else if (i.customId === 'next_page') {
            page++;
        }
        await paginate(i, page);
        await i.deferUpdate();
    });
}

// Event listener for interactions
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'prev_page' || interaction.customId === 'next_page') {
        await paginate(interaction);
    }
});
