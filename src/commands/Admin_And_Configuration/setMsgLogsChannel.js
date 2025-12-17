const {
    ChannelType,
    EmbedBuilder,
    MessageFlags,
    PermissionFlagsBits,
    SlashCommandBuilder,
} = require("discord.js");

const MsgLogsConfig = require("./../../database/msgLogsConfig");
const { handleError } = require("../../utils/errorHandler");

module.exports = {
    description_full:
        'Sets the channel where message logs will be sent. Requires the "Administrator" permission.',
    usage: "/set_msg_logs_channel <channel:channel>",
    examples: ["/set_msg_logs_channel channel:#message-logs"],
    data: new SlashCommandBuilder()
        .setName("set_msg_logs_channel")
        .setDescription("Sets the channel where message logs would be sent into.")
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addChannelOption((option) =>
            option
                .setName("channel")
                .setDescription("The channel to show message logs to.")
                .setRequired(true)
                .addChannelTypes(ChannelType.GuildText),
        ),

    async execute(interaction) {
        try {
            await interaction.deferReply({ flags: MessageFlags.Ephemeral });
            const channel = interaction.options.getChannel("channel");

            // Validate channel
            if (!channel) {
                await handleError(
                    interaction,
                    new Error("No channel provided"),
                    "VALIDATION",
                    "Please provide a valid text channel.",
                );
                return;
            }

            // Check if channel is in the same guild
            if (channel.guildId !== interaction.guildId) {
                await handleError(
                    interaction,
                    new Error("Invalid channel guild"),
                    "VALIDATION",
                    "The channel must be in this server.",
                );
                return;
            }

            // Check bot permissions in the channel
            const botMember = interaction.guild.members.me;
            const requiredPermissions = [
                PermissionFlagsBits.ViewChannel,
                PermissionFlagsBits.SendMessages,
                PermissionFlagsBits.EmbedLinks,
                PermissionFlagsBits.ReadMessageHistory,
            ];

            const missingPermissions = requiredPermissions.filter(
                (perm) => !channel.permissionsFor(botMember).has(perm),
            );

            if (missingPermissions.length > 0) {
                const permissionNames = missingPermissions.map((perm) =>
                    Object.keys(PermissionFlagsBits)
                        .find((key) => PermissionFlagsBits[key] === perm)
                        .replace(/_/g, " ")
                        .toLowerCase(),
                );

                await handleError(
                    interaction,
                    new Error("Missing channel permissions"),
                    "PERMISSION",
                    `I need the following permissions in ${channel}: ${permissionNames.join(", ")}`,
                );
                return;
            }

            try {
                // Find and update the document, or create a new one if it doesn't exist
                await MsgLogsConfig.findOneAndUpdate(
                    { guildId: interaction.guild.id },
                    { channelId: channel.id },
                    { upsert: true, new: true },
                );

                const embed = new EmbedBuilder()
                    .setTitle("Message Logs Channel Set")
                    .setDescription(`Message logs will now be sent to ${channel}`)
                    .addFields(
                        { name: "Channel", value: channel.name, inline: true },
                        { name: "Channel ID", value: channel.id, inline: true },
                    )
                    .setColor("Green")
                    .setFooter({
                        text: `Set by ${interaction.user.tag}`,
                        iconURL: interaction.user.displayAvatarURL(),
                    })
                    .setTimestamp();

                await interaction.editReply({
                    embeds: [embed],
                    flags: MessageFlags.Ephemeral,
                });

                // Send test message to verify permissions
                const testEmbed = new EmbedBuilder()
                    .setTitle("Message Logs Setup")
                    .setDescription(
                        "This channel has been set up for message logs.\n" +
                            "You will see message edit and delete logs here.",
                    )
                    .setColor("Blue")
                    .addFields({
                        name: "Test Log",
                        value: "This is a test message to verify permissions.",
                    })
                    .setTimestamp();

                await channel.send({ embeds: [testEmbed] });
            } catch (error) {
                if (error.code === 11000) {
                    await handleError(
                        interaction,
                        error,
                        "DATABASE",
                        "Failed to update the message logs channel configuration.",
                    );
                } else {
                    throw error;
                }
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while setting up the message logs channel.",
            );
        }
    },
};
