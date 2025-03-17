const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ms = require('ms');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Select a member and timeout them.')
        .addUserOption(option =>
            option.setName('target').setDescription('The member to ban').setRequired(true)
        )
        .addStringOption(option =>
            option.setName('reason').setDescription('The reason for timeout')
        )
        .addStringOption(option =>
            option
                .setName('amount')
                .setDescription(
                    'The duration of the timeout (max 28 days) e.x. 1d | 2 weeks | 3hrs'
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers
        )
        .setDMPermission(false),
    category: 'moderation',
    async execute(interaction) {
        const targetUser = interaction.options.getMember('target');
        const reason = interaction.options.getString('reason') ?? 'No reason provided';
        const duration = interaction.options.getString('amount') ?? null;
        await interaction.deferReply();

        if (!targetUser) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('ERROR')
                        .setDescription('User not found')
                        .setColor('Red')
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.avatarURL()}`,
                        }),
                ],
            });
            return;
        }

        if (targetUser.id === interaction.guild.ownerId) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('ERROR')
                        .setDescription('You cannot timeout the owner of the server')
                        .setColor('Red')
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.avatarURL()}`,
                        }),
                ],
            });
            return;
        }

        const targetUserRolePosition = targetUser.roles.highest.position;
        const requestUserRolePosition = interaction.member.roles.highest.position;
        const botRolePosition = interaction.guild.members.me.roles.highest.position;

        if (targetUserRolePosition >= requestUserRolePosition) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('ERROR')
                        .setDescription(
                            'You cannot timeout someone with a higher or equal role than you'
                        )
                        .setColor('Red')
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.avatarURL()}`,
                        }),
                ],
            });
            return;
        }

        if (targetUserRolePosition >= botRolePosition) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('ERROR')
                        .setDescription(
                            'I cannot timeout someone with a higher or equal role than myself'
                        )
                        .setColor('Red')
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.avatarURL()}`,
                        }),
                ],
            });
            return;
        }

        try {
            await targetUser.timeout(ms(duration), reason);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('MUTED!!!')
                        .setDescription(
                            `<@${targetUser.id}> has been timeout for reason: \`${reason}\`\nDuration: \`${duration}\``
                        )
                        .setColor('Green')
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.avatarURL()}`,
                        }),
                ],
            });
        } catch (error) {
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle('ERROR')
                        .setDescription(
                            `An error occurred while trying to timeout the user\n\`${error}\``
                        )
                        .setColor('Red')
                        .setFooter({
                            text: `Done by: ${interaction.user.username}`,
                            iconURL: `${interaction.user.avatarURL()}`,
                        }),
                ],
            });
        }
    },
};
