const {
    SlashCommandBuilder,
    PermissionFlagsBits,
    MessageFlags,
    EmbedBuilder,
} = require("discord.js");
const { inspect } = require("util");

/**
 * **VERY IMPORTANT SECURITY WARNING:**
 * Using `eval` in a Discord bot is extremely dangerous! It allows anyone
 * with access to the command to execute arbitrary code on your server.
 * This can lead to severe security vulnerabilities, including data theft,
 * server compromise, and more.
 *
 * Only enable this command for testing in a controlled environment
 * and NEVER in a production bot.
 */

// Explicitly define allowed users and roles
const allowedRoles = ["938469752882479166"];
const allowedUsers = ["764513584125444146"]; // Bot owner ID

// Maximum output length to prevent message overflow
const MAX_OUTPUT_LENGTH = 1990; // Leaving space for markdown code block chars

module.exports = {
    description_full:
        "Evaluates provided JavaScript code. WARNING: This command is extremely dangerous and should only be used for debugging in a controlled environment. Never use it in a production bot.",
    usage: "/eval <code>",
    examples: ["/eval 2 + 2", "/eval interaction.guild.name"],

    data: new SlashCommandBuilder()
        .setName("eval")
        .setDescription("Evaluates JavaScript code.")
        .addStringOption((option) =>
            option.setName("code").setDescription("The code to evaluate").setRequired(true),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // Always defer reply to handle longer evaluations
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        // Strict permission check using environment variables
        const ownerId = process.env.OWNER_ID || allowedUsers[0];

        if (
            interaction.user.id !== ownerId &&
            !allowedUsers.includes(interaction.user.id) &&
            !(
                interaction.member?.roles?.cache.size > 0 &&
                interaction.member.roles.cache.some((role) => allowedRoles.includes(role.id))
            )
        ) {
            return interaction.editReply({
                content: "You do not have permission to use this command.",
            });
        }

        const code = interaction.options.getString("code");

        try {
            // Create a limited context with secure scoping
            // Don't use vm module as it doesn't provide true isolation
            const limited = {
                interaction,
                client: interaction.client,
                guild: interaction.guild,
                channel: interaction.channel,
                user: interaction.user,
            };

            // Use AsyncFunction instead of eval for better scoping
            const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

            // Set execution timeout
            const timeout = setTimeout(() => {
                throw new Error("Evaluation timed out (10000ms)");
            }, 10000);

            // Execute the code with limited context
            const asyncFunc = new AsyncFunction(...Object.keys(limited), `return ${code}`);
            const result = await asyncFunc(...Object.values(limited));
            clearTimeout(timeout);

            // Format the output
            let output;
            if (result === undefined) {
                output = "undefined";
            } else if (typeof result === "string") {
                output = result;
            } else {
                output = inspect(result, { depth: 2 });
            }

            // Truncate if too long
            if (output.length > MAX_OUTPUT_LENGTH) {
                output = output.substring(0, MAX_OUTPUT_LENGTH) + "... (truncated)";
            }

            // Create embed for nicer output
            const embed = new EmbedBuilder()
                .setTitle("Evaluation Result")
                .setColor("#00FF00")
                .addFields([
                    {
                        name: "Input",
                        value: `\`\`\`js\n${code.length > 1000 ? code.substring(0, 1000) + "..." : code}\n\`\`\``,
                    },
                    { name: "Output", value: `\`\`\`js\n${output}\n\`\`\`` },
                    { name: "Type", value: `\`\`\`typescript\n${typeof result}\n\`\`\`` },
                ])
                .setFooter({ text: `Executed by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
        } catch (error) {
            // Handle errors
            const errorEmbed = new EmbedBuilder()
                .setTitle("Evaluation Error")
                .setColor("#FF0000")
                .addFields([
                    {
                        name: "Input",
                        value: `\`\`\`js\n${code.length > 1000 ? code.substring(0, 1000) + "..." : code}\n\`\`\``,
                    },
                    {
                        name: "Error",
                        value: `\`\`\`js\n${error.stack ? error.stack.substring(0, 1000) : error.toString()}\n\`\`\``,
                    },
                ])
                .setFooter({ text: `Executed by ${interaction.user.tag}` })
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    },
};
