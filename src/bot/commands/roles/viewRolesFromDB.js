const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");
const { handleError } = require("./../../utils/errorHandler.js");
const Role = require("././../../../database/roleStorage.js");

module.exports = {
    description_full:
        "Displays a list of roles that have been stored in the database.",
    usage: "/view_roles_from_data",
    examples: ["/view_roles_from_data"],
    category: "roles",
    data: new SlashCommandBuilder()
        .setName("view_roles_from_data")
        .setDescription("View the roles stored in the database."),
    async execute(interaction) {
        try {
            // Fetch all roles from the database
            const roles = await Role.find();

            if (roles.length === 0) {
                return interaction.editReply(
                    "There are no roles stored in the database."
                );
            }

            const embed = new EmbedBuilder()
                .setTitle("Stored Roles")
                .setColor("#00FFFF")
                .setDescription(
                    roles
                        .map(
                            (role, index) =>
                                `${index + 1}. **${role.roleName}** (ID: \`${
                                    role.roleID
                                }\`, Color: \`${role.roleColor}\`)`
                        )
                        .join("\n")
                );

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            handleError(interaction, error);
        }
    },
};
