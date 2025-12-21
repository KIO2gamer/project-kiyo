const { MessageFlags, PollLayoutType, SlashCommandBuilder } = require("discord.js");

const { handleError } = require("../../utils/errorHandler");

// Poll constraints from Discord API
const CONSTRAINTS = {
    MAX_POLL_DURATION_HOURS: 32 * 24, // 32 days in hours
    MIN_ANSWERS: 1, // Minimum 1 answer
    MAX_ANSWERS: 10, // Maximum 10 answers
    MAX_QUESTION_LENGTH: 300, // Maximum question length
    MAX_ANSWER_LENGTH: 55, // Maximum answer text length
};

module.exports = {
    description_full:
        "Creates a Discord poll with a question and multiple choice answers. Supports multi-select, custom duration (up to 32 days), and optional emoji for each answer. Maximum 10 answers allowed.",
    usage: '/create_poll question:"Your question" answers:"Answer1,Answer2,Answer3" [multi_select:true/false] [duration:24]',
    examples: [
        '/create_poll question:"What is your favorite color?" answers:"Red,Blue,Green" multi_select:false duration:24',
        '/create_poll question:"Which games do you play?" answers:"Minecraft,Fortnite,Valorant,Roblox" multi_select:true duration:168',
        '/create_poll question:"Movie night this Friday?" answers:"Yes,No,Maybe"',
    ],

    data: new SlashCommandBuilder()
        .setName("create_poll")
        .setDescription("Create an interactive poll with multiple choice answers")
        .addStringOption((option) =>
            option
                .setName("question")
                .setDescription("The poll question (max 300 characters)")
                .setRequired(true)
                .setMaxLength(CONSTRAINTS.MAX_QUESTION_LENGTH),
        )
        .addStringOption((option) =>
            option
                .setName("answers")
                .setDescription(
                    "Poll answers separated by commas (1-10 answers, max 55 chars each)",
                )
                .setRequired(true),
        )
        .addBooleanOption((option) =>
            option
                .setName("multi_select")
                .setDescription("Allow users to select multiple answers (default: false)")
                .setRequired(false),
        )
        .addIntegerOption((option) =>
            option
                .setName("duration")
                .setDescription("Poll duration in hours (1-768 hours / 32 days, default: 24)")
                .setRequired(false)
                .setMinValue(1)
                .setMaxValue(CONSTRAINTS.MAX_POLL_DURATION_HOURS),
        ),

    async execute(interaction) {
        try {
            const question = interaction.options.getString("question");
            const answersInput = interaction.options.getString("answers");
            const multiSelect = interaction.options.getBoolean("multi_select") ?? false;
            const durationHours = interaction.options.getInteger("duration") ?? 24;

            // Parse and validate answers
            const answers = answersInput
                .split(",")
                .map((answer) => answer.trim())
                .filter((answer) => answer.length > 0);

            // Validation: Check answer count
            if (answers.length < CONSTRAINTS.MIN_ANSWERS) {
                return interaction.reply({
                    content: `❌ Please provide at least ${CONSTRAINTS.MIN_ANSWERS} answer for the poll.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            if (answers.length > CONSTRAINTS.MAX_ANSWERS) {
                return interaction.reply({
                    content: `❌ Maximum ${CONSTRAINTS.MAX_ANSWERS} answers allowed. You provided ${answers.length} answers.`,
                    flags: MessageFlags.Ephemeral,
                });
            }

            // Validation: Check answer length
            const tooLongAnswers = answers.filter(
                (answer) => answer.length > CONSTRAINTS.MAX_ANSWER_LENGTH,
            );
            if (tooLongAnswers.length > 0) {
                return interaction.reply({
                    content:
                        `❌ Answer text too long (max ${CONSTRAINTS.MAX_ANSWER_LENGTH} characters):\n` +
                        tooLongAnswers
                            .map((a) => `• "${a.substring(0, 50)}..." (${a.length} chars)`)
                            .join("\n"),
                    flags: MessageFlags.Ephemeral,
                });
            }

            // Create poll data structure according to Discord.js API
            const pollData = {
                question: { text: question },
                answers: answers.map((answer) => ({
                    text: answer,
                })),
                allowMultiselect: multiSelect,
                duration: durationHours,
                layoutType: PollLayoutType.Default,
            };

            // Send poll
            await interaction.reply({
                content: `📊 **Poll Created!**\n> **Duration:** ${durationHours} hour${durationHours !== 1 ? "s" : ""}\n> **Multi-select:** ${multiSelect ? "Enabled" : "Disabled"}`,
                poll: pollData,
            });
        } catch (error) {
            await handleError(
                interaction,
                error,
                "POLL_CREATION",
                "Failed to create poll. Please check your inputs and try again.",
            );
        }
    },
};
