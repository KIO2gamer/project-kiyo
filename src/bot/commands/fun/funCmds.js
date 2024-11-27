const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fetch = require('node-fetch');
require('dotenv').config();

module.exports = {
	description_full:
		'Various fun commands combined into one with subcommands.',
	usage: '/fun <subcommand>',
	examples: [
		'/fun boba',
		'/fun rickroll',
		'/fun chairhit',
		'/fun skibidi',
		'/fun koifish',
		'/fun summon',
		'/fun quokka',
		'/fun steel',
		'/fun snipe',
		'/fun yeet',
		'/fun kill',
		'/fun uwu',
		'/fun do_not_touch',
	],
	category: 'fun',
	data: new SlashCommandBuilder()
		.setName('fun')
		.setDescription('Various fun commands combined into one.')
		.addSubcommand((subcommand) =>
			subcommand
				.setName('boba')
				.setDescription('Send a pic of boba because it is the best.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('rickroll')
				.setDescription('Never gonna give you up!'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('chairhit')
				.setDescription('Hit someone with a chair!'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('skibidi')
				.setDescription('Send a skibidi meme.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('koifish')
				.setDescription('Send a koifish meme.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('summon')
				.setDescription('Summon something interesting.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('quokka')
				.setDescription('Send a pic of a quokka because it is cute.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('steel')
				.setDescription('Send a steel meme.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('snipe')
				.setDescription('Snipe a deleted message.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('yeet')
				.setDescription('Yeet someone!'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('kill')
				.setDescription('Kill someone!'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('uwu')
				.setDescription('Send an uwu message.'),
		)
		.addSubcommand((subcommand) =>
			subcommand
				.setName('do_not_touch')
				.setDescription('DO NOT EVER TOUCH THIS COMMAND.'),
		),

	async execute(interaction) {
		const subcommand = interaction.options.getSubcommand();

		switch (subcommand) {
			case 'boba':
				await handleGifCommand(interaction, 'boba', 'Enjoy your Boba!');
				break;
			case 'rickroll':
				await handleGifCommand(interaction, 'rickroll', '***You\'ve been rickrolled!***');
				break;
			case 'chairhit':
				await handleGifCommand(interaction, 'chairhit', 'Chair Hit!');
				break;
			case 'skibidi':
				await handleGifCommand(interaction, 'skibidi', 'Skibidi (dont hate me on why i made this cmd, someone forced me to :sob: )');
				break;
			case 'koifish':
				await handleGifCommand(interaction, 'koifish meme', 'Koifish Meme');
				break;
			case 'summon':
				await handleSummon(interaction);
				break;
			case 'quokka':
				await handleGifCommand(interaction, 'quokka', 'You have been blessed by the powers of a quokka!');
				break;
			case 'steel':
				await handleGifCommand(interaction, 'steel metal pipe', 'you just got steeled');
				break;
			case 'snipe':
				await handleGifCommand(interaction, 'snipe', 'sniped 360 no scope');
				break;
			case 'yeet':
				await handleGifCommand(interaction, 'yeet', 'Yeet!');
				break;
			case 'kill':
				await handleKill(interaction);
				break;
			case 'uwu':
				await handleGifCommand(interaction, 'uwu', '***Notice me, senpai!***');
				break;
			case 'do_not_touch':
				await handleDoNotTouch(interaction);
				break;
			default:
				await interaction.editReply('Unknown subcommand.');
				break;
		}
	},
};

async function handleGifCommand(interaction, query, title) {
	try {
		const response = await fetch(
			`https://tenor.googleapis.com/v2/search?q=${query}&key=${process.env.TENOR_API_KEY}&limit=10`,
		);
		const data = await response.json();

		if (data.results && data.results.length > 0) {
			const randomIndex = Math.floor(Math.random() * data.results.length);
			const gifUrl = data.results[randomIndex].media_formats.gif.url;

			const embed = new EmbedBuilder()
				.setTitle(title)
				.setImage(gifUrl);

			await interaction.editReply({ embeds: [embed] });
		} else {
			await interaction.editReply(`Sorry, I could not find a ${query} GIF.`);
		}
	} catch (error) {
		console.error(`Error fetching ${query} GIF:`, error);
		await interaction.editReply(`There was an error trying to fetch a ${query} GIF.`);
	}
}

async function handleSummon(interaction) {
	const userOption = interaction.options.getUser('user');
	const userId = userOption.id;

	if (!userOption) {
		return interaction.editReply(
			'You need to mention a user to summon!',
		);
	}

	const embed = new EmbedBuilder()
		.setTitle('Summon Successful')
		.setDescription(`Summoned <@${userId}> from the undead.`)
		.setColor('#00ff00')
		.setFooter({
			text: `Executed by ${interaction.user.tag}`,
			iconURL: interaction.user.displayAvatarURL(),
		})
		.setImage('https://tenor.com/view/cat-spiritus-summon-vintage-fountain-pen-gif-22872604')
		.setTimestamp();

	try {
		await interaction.channel.send({ embeds: [embed] });
	} catch (error) {
		console.error('Error executing summon command:', error);
		interaction.editReply(
			'There was an error while executing this command.',
		);
	}
}

async function handleKill(interaction) {
	const assassinMessages = [
		'An assassin has been dispatched to your location... just kidding!',
		'The hitman is on his way... to give you a high five!',
		'Watch out! A ninja is coming... to steal your snacks!',
		'A secret agent is en route... to prank with a water balloon!',
		'Beware! A spy is nearby... to tell you a funny joke!',
		'i got yr home address\nalso get rekt bozo coz im sending a hitman to yeet ya',
	];

	const randomMessage =
		assassinMessages[
		Math.floor(Math.random() * assassinMessages.length)
		];

	const embed = new EmbedBuilder()
		.setColor('#FF0000')
		.setTitle('🔪 Assassin Alert!')
		.setDescription(randomMessage)
		.setFooter({
			text: `Requested by ${interaction.user.tag}`,
			iconURL: interaction.user.displayAvatarURL({
				dynamic: true,
			}),
		})
		.setTimestamp();

	await interaction.editReply({ embeds: [embed] });
}

async function handleDoNotTouch(interaction) {
	const row = new ActionRowBuilder().addComponents(
		new ButtonBuilder()
			.setCustomId('abort')
			.setLabel('Abort Override')
			.setStyle(ButtonStyle.Primary),
		new ButtonBuilder()
			.setCustomId('confirm')
			.setLabel('Confirm Override')
			.setStyle(ButtonStyle.Danger),
	);

	await interaction.editReply({
		content:
			'ALERT: Unauthorized system override detected. Your device and account have been flagged for immediate termination. Proceed with caution. /j',
		components: [row],
	});

	const filter = (i) =>
		i.customId === 'abort' || i.customId === 'confirm';
	const collector = interaction.channel.createMessageComponentCollector({
		filter,
		time: 15000,
	});

	collector.on('collect', async (i) => {
		if (i.customId === 'abort') {
			await i.update({
				content:
					'Override aborted. Security protocols re-engaged. Your system remains intact, but further attempts may result in permanent lockout.',
				components: [],
			});
		} else {
			await i.update({
				content:
					'WARNING: System override confirmed. Initiating complete data wipe and hardware deactivation. This process cannot be reversed. /j',
				components: [],
			});
		}
	});

	collector.on('end', (collected) => {
		if (!collected.size) {
			interaction.editReply({
				content:
					'ALERT: Override timeout detected. Initiating emergency shutdown. All systems will be locked for security audit. /j',
				components: [],
			});
		}
	});
}