const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
    data: new SlashCommandBuilder()
       .setName("image")
       .setDescription("Posts an image.")
       .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
       .addStringOption((option) =>
            option
               .setName("options")
               .setDescription("Sends a image from the options")
               .setRequired(true)
               .addChoices(
                    {
                        name: "Welcome",
                        value: "welcome",
                    },
                    {
                        name: "Self Roles",
                        value: "self_roles",
                    },
                    {
                        name: "Rules",
                        value: "rules",
                    },
                    {
                        name: "Roles",
                        value: "roles",
                    },
                    {
                        name: "Forms",
                        value: "forms",
                    },
                )
            ),
    category: "Moderation",
    async execute(interaction) {
        const options = interaction.options.getString("options");

        const errEmbed = new EmbedBuilder()
        .setTitle("Error")

        try {
            if (options === "welcome") {
                await interaction.channel.send({ files: ['./assets/headers/welcome-header.png'] });
            } else if (options === "self_roles") {
                await interaction.channel.send({ files: ['./assets/headers/self-roles-header.png'] });
            } else if (options === "rules") {
                await interaction.channel.send({ files: ['./assets/headers/rule-header.png'] });
            } else if (options === "roles") {
                await interaction.channel.send({ files: ['./assets/headers/role-header.png'] });
            } else if (options === "forms") {
                await interaction.channel.send({ files: ['./assets/headers/forms-header.png'] });
            }
            else {
                await interaction.reply("There is no such option available");
            }
            
        } catch (error) {
            errEmbed.setColor("RED").setDescription(error);
        }
    }
}