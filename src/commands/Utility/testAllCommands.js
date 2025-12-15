const {
    SlashCommandBuilder,
    MessageFlags,
    PermissionFlagsBits,
    EmbedBuilder,
} = require("discord.js");

const { logError } = require("../../utils/errorHandler");

// Simple sleep helper to space out executions and avoid rate limits
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Create a lightweight interaction proxy so we can call command execute functions
// without creating new Discord interactions. All responses are funneled back to the
// original interaction as ephemeral follow-ups.
function createInteractionProxy(baseInteraction) {
    const optionProxy = {
        data: [],
        // Provide subcommand helpers used by some commands
        getSubcommand: () => null,
        getSubcommandGroup: () => null,
        getString: () => null,
        getNumber: () => null,
        getInteger: () => null,
        getBoolean: () => null,
        getUser: () => null,
        getChannel: () => null,
        getRole: () => null,
        getMentionable: () => null,
        getAttachment: () => null,
    };

    const proxy = Object.create(baseInteraction);
    proxy.options = optionProxy;
    proxy.deferred = true; // base interaction is deferred before proxy is used
    proxy.replied = false;

    proxy.deferReply = async () => {
        // Already deferred at the top-level command; no-op here
        proxy.deferred = true;
        return null;
    };

    proxy.reply = async (data) => {
        proxy.replied = true;
        // Guard against empty messages to avoid DiscordAPIError 50006
        const payload = { ...data, flags: MessageFlags.Ephemeral };
        if (!payload.content && !payload.embeds && !payload.components) {
            payload.content = ""; // minimal content; some commands expect to reply regardless
        }
        return baseInteraction.followUp(payload);
    };

    proxy.editReply = async (data) => {
        const payload = { ...data, flags: MessageFlags.Ephemeral };
        if (!payload.content && !payload.embeds && !payload.components) {
            payload.content = "";
        }
        return baseInteraction.followUp(payload);
    };

    proxy.followUp = async (data) => {
        const payload = { ...data, flags: MessageFlags.Ephemeral };
        if (!payload.content && !payload.embeds && !payload.components) {
            payload.content = "";
        }
        return baseInteraction.followUp(payload);
    };

    // Some commands read latency using interaction.createdTimestamp
    if (!proxy.createdTimestamp) proxy.createdTimestamp = Date.now();

    return proxy;
}

module.exports = {
    description_full:
        "Runs all bot commands that require no input, one by one, with a delay between each to reduce API pressure. Useful for smoke-testing that commands still execute.",
    usage: "/test_all_commands",
    examples: ["/test_all_commands"],

    data: new SlashCommandBuilder()
        .setName("test_all_commands")
        .setDescription("Run every input-free command sequentially with delays to limit API usage")
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    async execute(interaction) {
        // Defer to allow multiple follow-ups during the batch run
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const allCommands = interaction.client?.commands;
        if (!allCommands?.size) {
            return interaction.editReply({
                content: "No commands are registered on this client.",
            });
        }

        // Only run commands that require no mandatory options to avoid failures
        const runnable = Array.from(allCommands.values()).filter((cmd) => {
            if (!cmd?.data?.name || typeof cmd.execute !== "function") return false;
            // Skip this command to avoid recursion
            if (cmd.data.name === "test_all_commands") return false;
            const options = cmd.data.options || [];
            return !options.some((opt) => opt.required);
        });

        // Filter out commands that are context-sensitive or require specific channels
        const skipNames = new Set([
            "embed", // uses subcommands
            "modifychannel", // requires modifications
            "welcomesettings", // subcommands
            "server", // subcommands
            "role", // subcommands
            "closeticket", // ticket channel only
            "deletelog", // requires numbers/range
            "guessthenumber", // may send empty message without state
            "fun", // aggregated subcommands
        ]);
        const filtered = runnable.filter((cmd) => !skipNames.has(cmd.data.name.toLowerCase()));

        if (runnable.length === 0) {
            return interaction.editReply({
                content: "No input-free commands found to run.",
            });
        }

        const delayMs = 2500; // 2.5s between commands to stay friendly to rate limits
        const results = [];
        const proxy = createInteractionProxy(interaction);

        for (const cmd of filtered) {
            await wait(delayMs);
            try {
                await cmd.execute(proxy);
                results.push({ name: cmd.data.name, status: "success" });
            } catch (error) {
                logError("test_all_commands failure", error, { category: "COMMAND_EXECUTION" });
                results.push({ name: cmd.data.name, status: "failed", error: error?.message });
            }
        }

        const successCount = results.filter((r) => r.status === "success").length;
        const failCount = results.length - successCount;

        const summaryEmbed = new EmbedBuilder()
            .setTitle("🧪 Command Batch Test")
            .setDescription(
                `Finished running ${results.length} commands with ${delayMs / 1000}s delay between each.\n` +
                    `✅ Success: ${successCount}\n❌ Failed: ${failCount}`,
            )
            .setColor(failCount === 0 ? 0x2ecc71 : 0xe74c3c)
            .addFields(
                results.slice(0, 25).map((r) => ({
                    name: r.status === "success" ? `✅ ${r.name}` : `❌ ${r.name}`,
                    value: r.error ? r.error.substring(0, 150) : "OK",
                    inline: true,
                })),
            )
            .setTimestamp();

        await interaction.editReply({ embeds: [summaryEmbed] });
    },
};
