const fs = require('fs');

const logError = (error) => {
    // Log the error to a file
    const logMessage = `[${new Date().toISOString()}] ${error.message}\n${error.stack}\n\n`;
    fs.appendFileSync('error.log', logMessage, 'utf8');

    // Optionally, you could also log to the console
    console.error(logMessage);
};

const handleError = async (error, interaction) => {
    // Log the error
    logError(error);

    // Respond to the user
    if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: 'An unexpected error occurred. Please try again later.', ephemeral: true });
    } else {
        await interaction.reply({ content: 'An unexpected error occurred. Please try again later.', ephemeral: true });
    }
};

module.exports = {
    logError,
    handleError,
};
