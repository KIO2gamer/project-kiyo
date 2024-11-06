const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('set_cmd_perms')
        .setDescription('Set permissions for commands')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addStringOption((option) =>
            option
                .setName('command')
                .setDescription('The command to set permissions for')
                .setRequired(true)
        )
        .addBooleanOption((option) =>
            option
                .setName('allowed')
                .setDescription('Whether to allow or deny the permission')
                .setRequired(true)
        )
        .addRoleOption((option) =>
            option
                .setName('role')
                .setDescription('The role to set permissions for')
                .setRequired(false)
        )
        .addUserOption((option) =>
            option
                .setName('user')
                .setDescription('The user to set permissions for')
                .setRequired(false)
        ),
    description_full:
        'Set custom permissions for commands, allowing or denying access for specific roles or users',
    usage: '/set_cmd_perms <command> <allowed> [role] [user]',
    examples: [
        '/set_cmd_perms command:ping allowed:true role:@Moderator',
        '/set_cmd_perms command:kick allowed:false user:@JohnDoe',
        '/set_cmd_perms command:ban allowed:true role:@Admin',
    ],
    category: 'admin',

    async execute(interaction) {
        // Check if user is bot owner
        if (interaction.user.id !== process.env.OWNER_ID) {
            return await interaction.editReply({
                content: 'Only the bot owner can use this command!',
                ephemeral: true,
            });
        }

        const commandName = interaction.options.getString('command');
        const role = interaction.options.getRole('role');
        const user = interaction.options.getUser('user');
        const allowed = interaction.options.getBoolean('allowed');

        if (!role && !user) {
            return await interaction.editReply({
                content: 'You must specify either a role or user!',
                ephemeral: true,
            });
        }

        // Get the command
        const command = interaction.client.commands.get(commandName);
        if (!command) {
            return await interaction.editReply({
                content: 'That command does not exist!',
                ephemeral: true,
            });
        }

        // Set permissions
        if (role) {
            command.permissions = command.permissions || {};
            command.permissions.roles = command.permissions.roles || {};
            command.permissions.roles[role.id] = allowed;
        }

        if (user) {
            command.permissions = command.permissions || {};
            command.permissions.users = command.permissions.users || {};
            command.permissions.users[user.id] = allowed;
        }

        await interaction.editReply({
            content: `Successfully ${
                allowed ? 'allowed' : 'denied'
            } permissions for ${
                role ? `role ${role.name}` : `user ${user.tag}`
            } on command ${commandName}`,
            ephemeral: true,
        });
    },
};
