const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

const { handleError } = require("../../utils/errorHandler");
const axios = require("axios");

module.exports = {
    description_full: "Various fun commands combined into one with subcommands.",
    usage: "/fun <subcommand> [user:@user]",
    examples: [
        "/fun boba",
        "/fun rickroll",
        "/fun summon @user",
        "/fun quokka",
        "/fun yeet",
        "/fun kill @user",
    ],

    data: new SlashCommandBuilder()
        .setName("fun")
        .setDescription("Various fun commands combined into one.")
        .addSubcommand((subcommand) =>
            subcommand.setName("boba").setDescription("Send a pic of boba because it is the best."),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("rickroll").setDescription("Never gonna give you up!"),
        )

        .addSubcommand((subcommand) =>
            subcommand
                .setName("summon")
                .setDescription("Summon a user")
                .addUserOption((option) =>
                    option.setName("user").setDescription("The user to summon").setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand
                .setName("quokka")
                .setDescription("Send a pic of a quokka because it is cute."),
        )

        .addSubcommand((subcommand) => subcommand.setName("yeet").setDescription("Yeet someone!"))
        .addSubcommand((subcommand) =>
            subcommand
                .setName("kill")
                .setDescription("Kill a user (in a fun way)")
                .addUserOption((option) =>
                    option.setName("user").setDescription("The user to kill").setRequired(true),
                ),
        ),

    async execute(interaction) {
        try {
            const subcommand = interaction.options.getSubcommand();

            switch (subcommand) {
            case "boba":
                await handleGifCommand(interaction, "boba", "Enjoy your Boba!");
                break;
            case "rickroll":
                await handleGifCommand(
                    interaction,
                    "rickroll",
                    "***You've been rickrolled!***",
                );
                break;

            case "summon":
                await handleSummon(interaction);
                break;
            case "quokka":
                await handleGifCommand(
                    interaction,
                    "quokka",
                    "You have been blessed by the powers of a quokka!",
                );
                break;

            case "yeet":
                await handleGifCommand(interaction, "yeet", "Yeet!");
                break;
            case "kill":
                await handleKill(interaction);
                break;

            default:
                await handleError(
                    interaction,
                    new Error(`Unknown subcommand: ${subcommand}`),
                    "VALIDATION",
                    "This subcommand does not exist.",
                );
                break;
            }
        } catch (error) {
            await handleError(
                interaction,
                error,
                "COMMAND_EXECUTION",
                "An error occurred while executing the fun command.",
            );
        }
    },
};

async function getRandomGif(searchTerm) {
    try {
        const response = await axios.get("https://api.giphy.com/v1/gifs/random", {
            params: {
                api_key: process.env.GIPHY_API_KEY,
                tag: searchTerm,
                rating: "g",
            },
        });
        return response.data.data.images.original.url;
    } catch {
        throw new Error("Failed to fetch GIF from GIPHY API");
    }
}

async function handleGifCommand(interaction, searchTerm, message) {
    try {
        await interaction.deferReply();
        const gifUrl = await getRandomGif(searchTerm);

        const embed = new EmbedBuilder()
            .setColor("#FF69B4")
            .setDescription(message)
            .setImage(gifUrl)
            .setTimestamp()
            .setFooter({
                text: `Requested by ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL(),
            });

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await handleError(
            interaction,
            error,
            "API",
            "Failed to fetch a GIF. Please try again later.",
        );
    }
}

async function handleSummon(interaction) {
    try {
        await interaction.deferReply();
        const target = interaction.options.getUser("user");
        const gifUrl = await getRandomGif("summon");

        const embed = new EmbedBuilder()
            .setColor("#FF69B4")
            .setDescription(`${target} has been summoned by ${interaction.user}!`)
            .setImage(gifUrl)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await handleError(interaction, error, "COMMAND_EXECUTION", "Failed to summon user.");
    }
}

async function handleKill(interaction) {
    try {
        await interaction.deferReply();
        const target = interaction.options.getUser("user");
        
        if (target.id === interaction.user.id) {
            await handleError(
                interaction,
                new Error("Self-targeting not allowed"),
                "VALIDATION",
                "You cannot kill yourself!",
            );
            return;
        }

        const gifUrl = await getRandomGif("kill");
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription(`${interaction.user} killed ${target}! RIP 💀`)
            .setImage(gifUrl)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await handleError(
            interaction,
            error,
            "COMMAND_EXECUTION",
            "Failed to execute kill command.",
        );
    }
}
