const { Events } = require('discord.js');
const ReactionRole = require('./../../database/ReactionRole');

module.exports = {
	name: Events.MessageReactionAdd,
	once: false,
	async execute(reaction, user) {
		// Ignore bot reactions
		if (user.bot) return;

		// Handle partial reactions
		if (reaction.partial) {
			try {
				await reaction.fetch();
			} catch (error) {
				console.error('Error fetching reaction:', error);
				return;
			}
		}

		try {
			// Find the reaction role config for this message
			const reactionRole = await ReactionRole.findOne({
				messageId: reaction.message.id,
				guildId: reaction.message.guild.id,
			});

			if (!reactionRole) return;

			// Find the matching role for this emoji
			const emojiName = reaction.emoji.name;
			const roleConfig = reactionRole.roles.find(
				(r) => r.emoji === emojiName,
			);

			if (!roleConfig) return;

			// Get the guild member and add the role
			const guild = reaction.message.guild;
			const member = await guild.members.fetch(user.id);
			const role = await guild.roles.fetch(roleConfig.roleId);

			if (role) {
				await member.roles.add(role);
			}
		} catch (error) {
			console.error('Error handling reaction role add:', error);
		}
	},
};
