const { EmbedBuilder, PermissionFlagsBits, SlashCommandBuilder } = require("discord.js");

const { handleError } = require("../../utils/errorHandler");
const {
    formatCategorizedPermissions,
    splitPermissionText,
} = require("../../utils/permissionFormatter");

// Create command with subcommands
const command = new SlashCommandBuilder()
    .setName("role")
    .setDescription("Role management system")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
    // Info subcommand
    .addSubcommand((sub) =>
        sub
            .setName("info")
            .setDescription("Get detailed information about a role")
            .addRoleOption((opt) =>
                opt.setName("role").setDescription("The role to get info about").setRequired(true),
            ),
    )
    // Edit subcommand
    .addSubcommand((sub) =>
        sub
            .setName("edit")
            .setDescription("Edit a role's properties")
            .addRoleOption((opt) =>
                opt.setName("role").setDescription("The role to edit").setRequired(true),
            )
            .addStringOption((opt) => opt.setName("name").setDescription("New role name"))
            .addStringOption((opt) =>
                opt.setName("color").setDescription("New color (hex format: #RRGGBB)"),
            )
            .addBooleanOption((opt) =>
                opt.setName("hoist").setDescription("Display separately in member list"),
            )
            .addBooleanOption((opt) =>
                opt.setName("mentionable").setDescription("Allow mentioning this role"),
            ),
    )
    // Assign subcommand
    .addSubcommand((sub) =>
        sub
            .setName("assign")
            .setDescription("Give a role to a user")
            .addUserOption((opt) =>
                opt
                    .setName("user")
                    .setDescription("The user to assign the role to")
                    .setRequired(true),
            )
            .addRoleOption((opt) =>
                opt.setName("role").setDescription("The role to assign").setRequired(true),
            ),
    )
    // Remove subcommand
    .addSubcommand((sub) =>
        sub
            .setName("remove")
            .setDescription("Remove a role from a user")
            .addUserOption((opt) =>
                opt
                    .setName("user")
                    .setDescription("The user to remove the role from")
                    .setRequired(true),
            )
            .addRoleOption((opt) =>
                opt.setName("role").setDescription("The role to remove").setRequired(true),
            ),
    )
    // List subcommand
    .addSubcommand((sub) => sub.setName("list").setDescription("Show all roles in the server"))
    // Create subcommand
    .addSubcommand((sub) =>
        sub
            .setName("create")
            .setDescription("Create a new role")
            .addStringOption((opt) =>
                opt.setName("name").setDescription("Role name").setRequired(true),
            )
            .addStringOption((opt) =>
                opt.setName("color").setDescription("Role color (hex format: #RRGGBB)"),
            )
            .addBooleanOption((opt) => opt.setName("hoist").setDescription("Display separately"))
            .addBooleanOption((opt) =>
                opt.setName("mentionable").setDescription("Allow mentioning"),
            )
            .addStringOption((opt) =>
                opt.setName("permissions").setDescription("Comma-separated permissions"),
            ),
    )
    // Delete subcommand
    .addSubcommand((sub) =>
        sub
            .setName("delete")
            .setDescription("Delete a role")
            .addRoleOption((opt) =>
                opt.setName("role").setDescription("The role to delete").setRequired(true),
            ),
    );

module.exports = {
    description_full: "Complete role management system",
    usage: "/role <subcommand> [options]",
    examples: [
        "/role info role:@Admin",
        "/role edit role:@Mod name:Moderator color:#FF0000",
        "/role assign user:@someone role:@VIP",
        "/role list",
        "/role create name:NewRole color:#00FF00",
    ],

    data: command,

    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case "info":
                    await handleRoleInfo(interaction);
                    break;
                case "edit":
                    await handleRoleEdit(interaction);
                    break;
                case "assign":
                    await handleRoleAssign(interaction);
                    break;
                case "remove":
                    await handleRoleRemove(interaction);
                    break;
                case "list":
                    await handleRoleList(interaction);
                    break;
                case "create":
                    await handleRoleCreate(interaction);
                    break;
                case "delete":
                    await handleRoleDelete(interaction);
                    break;
            }
        } catch (error) {
            await handleError(interaction, error, "ROLE_MANAGEMENT", "An error occurred");
        }
    },
};

// Role info handler
async function handleRoleInfo(interaction) {
    const role = interaction.options.getRole("role");
    if (!role) return interaction.reply("Role not found");

    // Get member info
    const members = role.members.map((m) => ({ tag: m.user.tag, isBot: m.user.bot }));
    const memberStats = {
        total: members.length,
        bots: members.filter((m) => m.isBot).length,
        humans: members.filter((m) => !m.isBot).length,
    };

    // Create embed
    const embed = new EmbedBuilder()
        .setTitle(`Role: ${role.name}`)
        .setColor(role.color || "#000000")
        .addFields(
            {
                name: "General",
                value: [
                    `**ID:** ${role.id}`,
                    `**Name:** ${role.name}`,
                    `**Color:** ${role.hexColor}`,
                    `**Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>`,
                    `**Members:** ${memberStats.total} (${memberStats.humans} humans, ${memberStats.bots} bots)`,
                ].join("\n"),
            },
            {
                name: "Settings",
                value: [
                    `**Position:** ${role.position}`,
                    `**Mentionable:** ${role.mentionable ? "Yes" : "No"}`,
                    `**Displayed Separately:** ${role.hoist ? "Yes" : "No"}`,
                    `**Managed:** ${role.managed ? "Yes (Integration)" : "No"}`,
                ].join("\n"),
            },
        );

    // Add permissions
    const permText = formatCategorizedPermissions(role.permissions);
    const permParts = splitPermissionText(permText);
    embed.addFields({ name: "Permissions", value: permParts[0] || "None" });

    await interaction.reply({ embeds: [embed] });
}

// Role edit handler
async function handleRoleEdit(interaction) {
    const role = interaction.options.getRole("role");
    const name = interaction.options.getString("name");
    const color = interaction.options.getString("color");
    const hoist = interaction.options.getBoolean("hoist");
    const mentionable = interaction.options.getBoolean("mentionable");

    // Check permission hierarchy
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
        return interaction.reply("I cannot edit roles higher than my own role");
    }

    // Edit role
    await role.edit({
        name: name || role.name,
        color: color || role.color,
        hoist: hoist !== null ? hoist : role.hoist,
        mentionable: mentionable !== null ? mentionable : role.mentionable,
    });

    await interaction.reply(`Role ${role} updated successfully!`);
}

// Role assign handler
async function handleRoleAssign(interaction) {
    const user = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");
    const member = await interaction.guild.members.fetch(user.id);

    // Check permissions
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
        return interaction.reply("I cannot assign roles higher than my own role");
    }

    if (member.roles.cache.has(role.id)) {
        return interaction.reply(`${user} already has the ${role} role`);
    }

    await member.roles.add(role);
    await interaction.reply(`Added ${role} role to ${user}`);
}

// Role remove handler
async function handleRoleRemove(interaction) {
    const user = interaction.options.getUser("user");
    const role = interaction.options.getRole("role");
    const member = await interaction.guild.members.fetch(user.id);

    // Check permissions
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
        return interaction.reply("I cannot remove roles higher than my own role");
    }

    if (!member.roles.cache.has(role.id)) {
        return interaction.reply(`${user} doesn't have the ${role} role`);
    }

    await member.roles.remove(role);
    await interaction.reply(`Removed ${role} role from ${user}`);
}

// Role list handler
async function handleRoleList(interaction) {
    const roles = interaction.guild.roles.cache.sort((a, b) => b.position - a.position);

    // Group roles
    const managedRoles = roles.filter((r) => r.managed);
    const hoistedRoles = roles.filter((r) => r.hoist && !r.managed);
    const regularRoles = roles.filter((r) => !r.hoist && !r.managed);

    const embed = new EmbedBuilder()
        .setTitle(`Server Roles (${roles.size})`)
        .setColor("Orange")
        .addFields(
            {
                name: `Managed (${managedRoles.size})`,
                value: managedRoles.map((r) => `${r}: ${r.members.size}`).join("\n") || "None",
            },
            {
                name: `Displayed Separately (${hoistedRoles.size})`,
                value: hoistedRoles.map((r) => `${r}: ${r.members.size}`).join("\n") || "None",
            },
            {
                name: `Regular (${regularRoles.size})`,
                value: regularRoles.map((r) => `${r}: ${r.members.size}`).join("\n") || "None",
            },
        )
        .setTimestamp();

    await interaction.reply({ embeds: [embed] });
}

// Role create handler
async function handleRoleCreate(interaction) {
    const name = interaction.options.getString("name");
    const color = interaction.options.getString("color");
    const hoist = interaction.options.getBoolean("hoist");
    const mentionable = interaction.options.getBoolean("mentionable");
    const permsString = interaction.options.getString("permissions");

    // Create permissions
    let permissions = 0n;
    if (permsString) {
        try {
            const perms = permsString.split(",").map((p) => p.trim().toUpperCase());
            permissions = perms.reduce((acc, p) => acc | PermissionFlagsBits[p], 0n);
        } catch {
            return interaction.reply("Invalid permissions format");
        }
    }

    // Create role
    const role = await interaction.guild.roles.create({
        name,
        color: color || null,
        hoist: hoist || false,
        mentionable: mentionable || false,
        permissions,
        reason: `Created by ${interaction.user.tag}`,
    });

    await interaction.reply(`Created role ${role}`);
}

// Role delete handler
async function handleRoleDelete(interaction) {
    const role = interaction.options.getRole("role");

    // Check permissions
    if (interaction.guild.members.me.roles.highest.position <= role.position) {
        return interaction.reply("I cannot delete roles higher than my own role");
    }

    await role.delete(`Deleted by ${interaction.user.tag}`);
    await interaction.reply(`Deleted role: ${role.name}`);
}
