const { Events, EmbedBuilder } = require('discord.js');

module.exports = {
	name: Events.GuildMemberAdd,
	once: false,
	async execute(member) {
		const welcomeChannelId = '1254681196017877135'; // Replace with your welcome channel ID
		const welcomeChannel = member.guild.channels.cache.get(welcomeChannelId);
		if (!welcomeChannel) return;

		const welcomeEmbed = new EmbedBuilder()
			.setColor('#00FF00')
			.setTitle('Welcome to the Server!')
			.setDescription(
				`🎉 Welcome to the server, ${member.user.tag}! We're glad to have you here. Feel free to introduce yourself and ask any questions you may have. Don't forget to check out the rules and have fun!`
			)
			.setThumbnail(member.user.displayAvatarURL())
			.setTimestamp();

		welcomeChannel.send({ embeds: [welcomeEmbed] });
	},
};
