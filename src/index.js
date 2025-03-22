const { initializeBot } = require("./bot/startup");

// Start the bot
(async () => {
    await initializeBot();
})();
