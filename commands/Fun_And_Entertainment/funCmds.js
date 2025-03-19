const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
} = require("discord.js");
const { handleError } = require("../../utils/errorHandler");
const axios = require("axios");

const { MessageFlags } = require("discord.js");

module.exports = {
    description_full: "Various fun commands combined into one with subcommands.",
    usage: "/fun <subcommand> [user:@user]",
    examples: [
        "/fun boba",
        "/fun rickroll",
        "/fun chairhit",
        "/fun skibidi",
        "/fun koifish",
        "/fun summon @user",
        "/fun quokka",
        "/fun steel",
        "/fun snipe",
        "/fun yeet",
        "/fun kill @user",
        "/fun uwu",
        "/fun do_not_touch",
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
            subcommand.setName("chairhit").setDescription("Hit someone with a chair!"),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("skibidi").setDescription("Send a skibidi meme."),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("koifish").setDescription("Send a koifish meme."),
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
        .addSubcommand((subcommand) =>
            subcommand.setName("steel").setDescription("Send a steel meme."),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("snipe").setDescription("Snipe a deleted message."),
        )
        .addSubcommand((subcommand) => subcommand.setName("yeet").setDescription("Yeet someone!"))
        .addSubcommand((subcommand) =>
            subcommand
                .setName("kill")
                .setDescription("Kill a user (in a fun way)")
                .addUserOption((option) =>
                    option.setName("user").setDescription("The user to kill").setRequired(true),
                ),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("uwu").setDescription("Send an uwu message."),
        )
        .addSubcommand((subcommand) =>
            subcommand.setName("do_not_touch").setDescription("DO NOT EVER TOUCH THIS COMMAND."),
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
                case "chairhit":
                    await handleGifCommand(interaction, "chairhit", "Chair Hit!");
                    break;
                case "skibidi":
                    await handleGifCommand(
                        interaction,
                        "skibidi",
                        "Skibidi (dont hate me on why i made this cmd, someone forced me to :sob: )",
                    );
                    break;
                case "koifish":
                    await handleGifCommand(interaction, "koifish meme", "Koifish Meme");
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
                case "steel":
                    await handleGifCommand(interaction, "steel metal pipe", "you just got steeled");
                    break;
                case "snipe":
                    await handleGifCommand(interaction, "snipe", "sniped 360 no scope");
                    break;
                case "yeet":
                    await handleGifCommand(interaction, "yeet", "Yeet!");
                    break;
                case "kill":
                    await handleKill(interaction);
                    break;
                case "uwu":
                    await handleGifCommand(interaction, "uwu", "***Notice me, senpai!***");
                    break;
                case "do_not_touch":
                    await handleDoNotTouch(interaction);
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
        const response = await axios.get(`https://api.giphy.com/v1/gifs/random`, {
            params: {
                api_key: process.env.GIPHY_API_KEY,
                tag: searchTerm,
                rating: "g",
            },
        });
        return response.data.data.images.original.url;
    } catch (error) {
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
        const target = interaction.options.getUser("user");
        if (!target) {
            await handleError(
                interaction,
                new Error("No user specified"),
                "VALIDATION",
                "You need to specify a user to summon!",
            );
            return;
        }

        const embed = new EmbedBuilder()
            .setColor("#FF69B4")
            .setDescription(`${target} has been summoned by ${interaction.user}!`)
            .setImage("https://media.giphy.com/media/3o7btXkbsV26U95Uly/giphy.gif")
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        await handleError(interaction, error, "COMMAND_EXECUTION", "Failed to summon user.");
    }
}

async function handleKill(interaction) {
    try {
        const target = interaction.options.getUser("user");
        if (!target) {
            await handleError(
                interaction,
                new Error("No user specified"),
                "VALIDATION",
                "You need to specify a user to kill!",
            );
            return;
        }

        if (target.id === interaction.user.id) {
            await handleError(
                interaction,
                new Error("Self-targeting not allowed"),
                "VALIDATION",
                "You cannot kill yourself!",
            );
            return;
        }

        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setDescription(`${interaction.user} killed ${target}! RIP 💀`)
            .setImage("https://media.giphy.com/media/3o7btXkbsV26U95Uly/giphy.gif")
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    } catch (error) {
        await handleError(
            interaction,
            error,
            "COMMAND_EXECUTION",
            "Failed to execute kill command.",
        );
    }
}

async function handleDoNotTouch(interaction) {
    try {
        const embed = new EmbedBuilder()
            .setColor("#FF0000")
            .setTitle("⚠️ WARNING ⚠️")
            .setDescription("I told you not to touch this command...")
            .setImage("https://media.giphy.com/media/3o7btXkbsV26U95Uly/giphy.gif")
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });

        // Add a delayed follow-up message for dramatic effect
        setTimeout(async () => {
            try {
                await interaction.followUp("*Something bad might happen...*");
            } catch (error) {
                // Ignore follow-up errors
            }
        }, 3000);
    } catch (error) {
        await handleError(
            interaction,
            error,
            "COMMAND_EXECUTION",
            "You should not have touched this command...",
        );
    }
}
