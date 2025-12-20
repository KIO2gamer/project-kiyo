const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
    description_full: "An exciting game of Rock, Paper, Scissors, Lizard, Spock against the bot!",
    usage: "/rpsls <choice>",
    examples: ["/rpsls rock", "/rpsls paper", "/rpsls scissors", "/rpsls lizard", "/rpsls spock"],

    data: new SlashCommandBuilder()
        .setName("rpsls")
        .setDescription("Play Rock, Paper, Scissors, Lizard, Spock!")
        .addStringOption((option) =>
            option
                .setName("choice")
                .setDescription("Choose your weapon!")
                .setRequired(true)
                .addChoices(
                    { name: "Rock 🪨", value: "rock" },
                    { name: "Paper 📄", value: "paper" },
                    { name: "Scissors ✂️", value: "scissors" },
                    { name: "Lizard 🦎", value: "lizard" },
                    { name: "Spock 🖖", value: "spock" },
                ),
        ),
    async execute(interaction) {
        const userChoice = interaction.options.getString("choice");
        const choices = ["rock", "paper", "scissors", "lizard", "spock"];
        const botChoice = choices[Math.floor(Math.random() * choices.length)];

        const emojis = {
            rock: "🪨",
            paper: "📄",
            scissors: "✂️",
            lizard: "🦎",
            spock: "🖖",
        };

        const winConditions = {
            rock: ["scissors", "lizard"],
            paper: ["rock", "spock"],
            scissors: ["paper", "lizard"],
            lizard: ["paper", "spock"],
            spock: ["rock", "scissors"],
        };

        const actionDescriptions = {
            rock: { scissors: "crushes", lizard: "crushes" },
            paper: { rock: "covers", spock: "disproves" },
            scissors: { paper: "cuts", lizard: "decapitates" },
            lizard: { paper: "eats", spock: "poisons" },
            spock: { rock: "vaporizes", scissors: "smashes" },
        };

        const COLORS = {
            win: 0x00c853,
            lose: 0xe53935,
            tie: 0xffa000,
        };

        let resultTitle = "";
        let resultColor = COLORS.tie;
        let action = "";

        if (userChoice === botChoice) {
            resultTitle = "🤝 It's a Tie!";
            action = "Great minds think alike!";
        } else if (winConditions[userChoice].includes(botChoice)) {
            resultTitle = "🎉 You Win!";
            resultColor = COLORS.win;
            action = `${emojis[userChoice]} ${actionDescriptions[userChoice][botChoice]} ${emojis[botChoice]}`;
        } else {
            resultTitle = "😢 You Lose!";
            resultColor = COLORS.lose;
            action = `${emojis[botChoice]} ${actionDescriptions[botChoice][userChoice]} ${emojis[userChoice]}`;
        }

        const embed = new EmbedBuilder()
            .setColor(resultColor)
            .setTitle(resultTitle)
            .addFields(
                {
                    name: "Your Choice",
                    value: `${emojis[userChoice]} **${userChoice.charAt(0).toUpperCase() + userChoice.slice(1)}**`,
                    inline: true,
                },
                {
                    name: "Bot's Choice",
                    value: `${emojis[botChoice]} **${botChoice.charAt(0).toUpperCase() + botChoice.slice(1)}**`,
                    inline: true,
                },
                { name: "\u200B", value: "\u200B", inline: false },
                { name: "Result", value: action, inline: false },
            )
            .setFooter({
                text: `Played by ${interaction.user.tag} | "Bazinga!" - Sheldon Cooper`,
                iconURL: interaction.user.displayAvatarURL(),
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
