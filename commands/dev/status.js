const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('status')
        .setDescription('Check the status of a server or service')
        .addStringOption((option) =>
            option
                .setName('url')
                .setDescription('URL to check')
                .setRequired(true),
        ),
    async execute(interaction) {
        const url = interaction.options.getString('url');

        try {
            const response = await fetch(url);
            if (response.ok) {
                const statusCode = response.status;
                const contentType = response.headers.get('content-type');
                const serverInfo = response.headers.get('server');

                let replyMessage = `The service at <${url}> is online!\n`;
                replyMessage += `Status Code: ${statusCode}\n`;
                replyMessage += `Content Type: ${contentType || 'Not specified'}\n`;
                replyMessage += `Server: ${serverInfo || 'Not specified'}`;

                await interaction.reply(replyMessage);
            } else {
                await interaction.reply(
                    `The service at ${url} is offline (status code: ${response.status}).`,
                );
            }
        } catch (error) {
            await interaction.reply(`Error checking ${url}: ${error.message}`);
        }
    },
};
