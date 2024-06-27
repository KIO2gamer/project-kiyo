const {
    SlashCommandBuilder,
    EmbedBuilder,
    ButtonBuilder,
    ButtonStyle,
    ActionRowBuilder,
} = require("discord.js");
const fs = require("fs");
const path = require("path");

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
        await interaction.deferReply(); // Immediately acknowledge the interaction

        const category = interaction.options.getString("category");

        const getCategoryNameForMainMenu = (choice) => {
            const categories = {
                fun: "> **Fun**\n> Commands which can be used for fun activities.\n",
                moderation: "> **Moderation**\n> Commands for server moderation.\n",
                utility: "> **Utility**\n> Commands for various utilities.",
            };
            return categories[choice];
        };

        const getCategoryTitle = (choice) => {
            const titles = {
                fun: "🎉 Fun Commands",
                moderation: "🛡️ Moderation Commands",
                utility: "🛠️ Utility Commands",
            };
            return titles[choice];
        };

        const fetchCommandIds = async (folder) => {
            const files = fs
                .readdirSync(`commands/${folder}`)
                .filter((file) => file.endsWith(".js"));

            const commands = [];
            for (const file of files) {
                const command = require(`../${folder}/${file}`);
                const name = command.data.name;
                try {
                    const commandId = await interaction.guild.commands.fetch()
                        .then((cmds) => cmds.find((cmd) => cmd.name === name)?.id);

                    if (commandId) {
                        commands.push({ name, id: commandId, description: command.data.description });
                    }
                } catch (error) {
                    console.error(`Error fetching ID for ${name}: ${error.message}`);
                }
            }
            return commands;
        };

        const commandFolders = fs.readdirSync("commands");

        const [funCommands, modCommands, utilCommands] = await Promise.all([
            fetchCommandIds("fun"),
            fetchCommandIds("moderation"),
            fetchCommandIds("utility"),
        ]);

        const buildCommandFields = (commands) => commands.map(cmd => `</${cmd.name}:${cmd.id}>`).join(", ") || "No commands available";

        const cmdListEmbed = new EmbedBuilder()
            .setColor("#3498db")
            .setTitle("📜 Command List")
            .setDescription(
                "`/help [category] - View specific category`\n(NOTE: The non-blue command links have subcommands because Discord doesn't allow adding blue command links to them.)"
            )
            .setAuthor({
                name: "Kiyo Bot HelpDesk",
                iconURL: interaction.client.user.avatarURL(),
            })
            .setThumbnail(interaction.client.user.avatarURL())
            .addFields([
                { name: `**🎉 Fun**`, value: buildCommandFields(funCommands) },
                { name: `**🛡️ Moderation**`, value: buildCommandFields(modCommands) },
                { name: `**🛠️ Utility**`, value: buildCommandFields(utilCommands) },
            ])
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
            })
            .setTimestamp();

        if (!category) {
            const mainMenuEmbed = new EmbedBuilder()
                .setColor("#2ecc71")
                .setDescription("`/help [category] - View specific category`")
                .setAuthor({
                    name: "Kiyo Bot HelpDesk",
                    iconURL: interaction.client.user.avatarURL(),
                })
                .setThumbnail(interaction.client.user.avatarURL())
                .addFields([
                    {
                        name: `📂 Categories`,
                        value: commandFolders.map(getCategoryNameForMainMenu).join("\n"),
                    },
                ])
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            const cmdListButton = new ButtonBuilder()
                .setLabel("📜 Command List")
                .setStyle(ButtonStyle.Secondary)
                .setCustomId("cmdList");

            const mainMenuBtn = new ButtonBuilder()
                .setLabel("🏠 Home")
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
                        content: "You should run the command to use this interaction.",
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
            const commands = await fetchCommandIds(category);
            const embedDescription = commands.map(cmd => `</${cmd.name}:${cmd.id}> \n> ${cmd.description}`).join("\n\n") || "No commands available";

            const categoryEmbed = new EmbedBuilder()
                .setColor("#e74c3c")
                .setTitle(getCategoryTitle(category))
                .setDescription(embedDescription)
                .setFooter({
                    text: `Requested by ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            return await interaction.editReply({ embeds: [categoryEmbed] });
        } else {
            await interaction.editReply({
                content: "Invalid category.",
                ephemeral: true,
            });
        }
    },
};
