const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require("discord.js");
const fs = require("fs");

module.exports = {
    data: new SlashCommandBuilder()
        .setName("help")
        .setDescription("View the help menu")
        .addStringOption((option) =>
            option
                .setName("category")
                .setRequired(false)
                .setDescription("What command category do you want to view?")
                .addChoices(
                    { name: "Fun", value: "fun" },
                    { name: "Moderation", value: "moderation" },
                    { name: "Utility", value: "utility" },
                ),
        ),
    category: "Utility",
    async execute(interaction) {
        await interaction.deferReply();  // Immediately acknowledge the interaction

        const category = interaction.options.getString("category");

        function getCategoryNameForMainMenu(choice) {
            if (choice === "fun") {
                return `> **Fun**\n> Commands which can be used for funsies.\n`;
            }
            if (choice === "moderation") {
                return `> **Moderation**\n> Commands only for moderators.\n`;
            }
            if (choice === "utility") {
                return `> **Utility**\n> Commands which can be used for various utilities.`;
            }
        }

        function getCategoryTitle(choice) {
            if (choice === "fun") {
                return `Fun`;
            }
            if (choice === "moderation") {
                return `Moderation`;
            }
            if (choice === "utility") {
                return `Utility`;
            }
        }

        const funFields = [];
        const modFields = [];
        const utilFields = [];

        // Fetch command IDs asynchronously
        const commandFolders = fs.readdirSync("commands");
        for (const folder of commandFolders) {
            const files = fs
                .readdirSync(`commands/${folder}`)
                .filter((file) => file.endsWith(".js"));

            for (const file of files) {
                const command = require(`./../${folder}/${file}`);
                const name = `${command.data.name}`;
                try {
                    const commandId = await interaction.guild.commands
                        .fetch()
                        .then((commands) => commands.find((cmd) => cmd.name === name)?.id);

                    if (commandId) {
                        if (folder === "fun") {
                            funFields.push(`</${name}:${commandId}>`);
                        }
                        if (folder === "moderation") {
                            modFields.push(`</${name}:${commandId}>`);
                        }
                        if (folder === "utility") {
                            utilFields.push(`</${name}:${commandId}>`);
                        }
                    }
                } catch (error) {
                    console.error(`Error fetching ID for ${name}: ${error.message}`);
                }
            }
        }

        const cmdListEmbed = new EmbedBuilder()
            .setColor("White")
            .setTitle("Command List")
            .setDescription(
                `\`/help [category] - View specific category\`\n(NOTE: The non-blue command links have subcommands because discord doesn't allow adding blue command links to them.)`,
            )
            .setAuthor({
                name: "Kiyo Bot HelpDesk",
                iconURL: interaction.client.user.avatarURL(),
            })
            .addFields([
                { name: `**Fun**`, value: funFields.join(", ") || "No commands available" },
                { name: `**Moderation**`, value: modFields.join(", ") || "No commands available" },
                { name: `**Utility**`, value: utilFields.join(", ") || "No commands available" },
            ]);

        if (!category) {
            const mainMenuEmbed = new EmbedBuilder()
                .setColor("White")
                .setDescription("`/help [category] - View specific category`")
                .setAuthor({
                    name: "Kiyo Bot HelpDesk",
                    iconURL: interaction.client.user.avatarURL(),
                })
                .addFields([
                    {
                        name: `Categories`,
                        value: commandFolders.map(getCategoryNameForMainMenu).join("\n"),
                    },
                ]);

            const cmdListButton = new ButtonBuilder()
                .setLabel("Command List")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("cmdList");

            const mainMenuBtn = new ButtonBuilder()
                .setLabel("Home")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("home");

            const rowWithCmdBtn = new ActionRowBuilder().addComponents(cmdListButton);
            const rowWithHomeBtn = new ActionRowBuilder().addComponents(mainMenuBtn);

            const reply = await interaction.editReply({
                embeds: [mainMenuEmbed],
                components: [rowWithCmdBtn],
            });

            const collector = reply.createMessageComponentCollector({
                time: 60_000 * 5,
            });

            collector.on("collect", async (i) => {
                if (i.user.id === interaction.user.id) {
                    if (i.customId === "cmdList") {
                        await i.update({
                            embeds: [cmdListEmbed],
                            components: [rowWithHomeBtn],
                        });
                    }
                    if (i.customId === "home") {
                        await i.update({
                            embeds: [mainMenuEmbed],
                            components: [rowWithCmdBtn],
                        });
                    }
                } else {
                    await i.reply({
                        content: "You should run the command to use this interaction",
                        ephemeral: true,
                    });
                }
            });

            collector.on("end", async (collected, reason) => {
                if (reason === "time") {
                    await reply.edit({ components: [] });
                }
            });

            return;
        }

        if (commandFolders.includes(category)) {
            const embedDescription = [];

            const commandFiles = fs
                .readdirSync(`commands/${category}`)
                .filter((file) => file.endsWith(".js"));

            for (const file of commandFiles) {
                const command = require(`./../${category}/${file}`);
                const name = `${command.data.name}`;
                const description = `${command.data.description}`;

                try {
                    const commandId = await interaction.guild.commands
                        .fetch()
                        .then((commands) => commands.find((cmd) => cmd.name === name)?.id);

                    if (commandId) {
                        embedDescription.push(`</${name}:${commandId}> \n> ${description}`);
                    }
                } catch (error) {
                    console.error(`Error fetching ID for ${name}: ${error.message}`);
                }
            }

            const categoryEmbed = new EmbedBuilder()
                .setColor("White")
                .setTitle(`${getCategoryTitle(category)}`)
                .setDescription(embedDescription.join("\n\n") || "No commands available");

            return await interaction.editReply({ embeds: [categoryEmbed] });
        } else {
            await interaction.editReply({
                content: "Invalid category.",
                ephemeral: true,
            });
        }
    },
};
