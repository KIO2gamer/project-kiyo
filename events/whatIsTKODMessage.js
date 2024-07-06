const { Events } = require('discord.js');

module.exports = {
	name: Events.MessageCreate,
	once: false,
	async execute(message, client) {
        if (message.author.bot) return;
        if (message.content === 'TKOD' || 'tkod') {
            message.channel.send('**T** - The\n**K** - KIO2gamer\n**O** - Official\n**D** - Discord (Server)');
        }
	},
};
