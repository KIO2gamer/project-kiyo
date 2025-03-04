const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	description_full:
		'Shows an embed acknowledging and listing the contributors who helped create the bot, linking their Discord usernames to their IDs.',
	usage: '/credits',
	examples: ['/credits'],
	category: 'info',
	data: new SlashCommandBuilder()
		.setName('credits')
		.setDescription('Shows an embed of users who helped make this bot.'),

	async execute(interaction) {
		try {
			// Static list of contributors
			const contributors = [
				{ command: 'steel', name: 'steeles.0' },
				{ command: 'koifish', name: 'hallow_spice' },
				{ command: 'do_not_touch', name: 'umbree_on_toast' },
				{ command: 'rickroll', name: 'flashxdfx' },
				{ command: 'summon', name: 'eesmal' },
				{ command: 'snipe', name: 'na51f' },
				{ command: 'photo', name: 'spheroidon' },
				{ command: 'skibidi', name: 'zenoz231' },
				{ command: 'quokka', name: 'wickiwacka2' },
				{ command: 'uwu', name: 'rizzwan.' },
				{ command: 'boba', name: 'pepsi_pro' },
				{ command: 'lyricwhiz', name: 'vipraz' },
			];

			// Create the base embed
			const embed = new EmbedBuilder()
				.setTitle('✨ Credits ✨')
				.setColor('#0099ff')
				.setDescription(
					'A big thank you to all the amazing contributors who helped make this bot possible!',
				)
				.setTimestamp()
				.setFooter({ text: 'Thanks to all the contributors!' });

			// Fetch the guild's slash commands
			const guildCommands = await interaction.guild.commands.fetch();

			// Map contributors to embed fields, using a command link if available
			const fields = contributors.map((contributor) => {
				const command = guildCommands.find(
					(cmd) => cmd.name === contributor.command,
				);
				const commandLink = command
					? `</${contributor.command}:${command.id}>`
					: contributor.command;
				return {
					name: `**${contributor.name}**`,
					value: commandLink,
					inline: true,
				};
			});

			embed.addFields(fields);

			await interaction.reply({ embeds: [embed] });
		} catch (error) {
			console.error('Error executing credits command:', error);
			await interaction.reply({
				content:
					'There was an error fetching the credits. Please try again later.',
				ephemeral: true,
			});
		}
	},
};
