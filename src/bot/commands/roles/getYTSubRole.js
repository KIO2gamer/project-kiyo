const { SlashCommandBuilder } = require('discord.js');
const OAuthCode = require('../../../database/OauthCode.js');
const RoleSchema = require('../../../database/roleStorage.js');
const { google } = require('googleapis');
const crypto = require('crypto');

const youtube = google.youtube({
	version: 'v3',
	auth: process.env.YOUTUBE_API_KEY,
});

const ALGORITHM = 'aes-256-cbc';

function encrypt(text, secretKey, iv) {
	const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(secretKey), iv);
	let encrypted = Buffer.concat([cipher.update(text), cipher.final()]);
	return `${iv.toString('hex')}:${encrypted.toString('hex')}:${secretKey.toString('hex')}`;
}

const { MessageFlags } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('get_yt_sub_role')
		.setDescription(
			'Assign a role based on your YouTube subscriber count.',
		),
	description_full:
		'Verify your YouTube channel using Discord OAuth2 and assign a role based on your subscriber count.',
	usage: '/get_yt_sub_role',
	examples: ['/get_yt_sub_role'],
	category: 'roles',

	async execute(interaction) {
		try {
			await interaction.deferReply({ flags: MessageFlags.Ephemeral });

			const state = JSON.stringify({
				interactionId: interaction.id,
				guildId: interaction.guild.id,
				channelId: interaction.channel.id,
			});

			const secretKey = crypto.randomBytes(32);
			const iv = crypto.randomBytes(16);
			const encryptedState = encrypt(state, secretKey, iv);
			const discordOAuthUrl = generateDiscordOAuthUrl(encryptedState);

			await interaction.editReply({
				embeds: [
					createEmbed(
						'🎥 YouTube Verification',
						'Authorize your YouTube account to get a role based on your subscriber count.',
						[
							{
								name: 'Steps',
								value: '1. Click the link below\n2. Authorize the app\n3. Wait for confirmation',
								inline: false,
							},
							{
								name: '🔗 Authorization Link',
								value: `[Click here](${discordOAuthUrl})`,
								inline: false,
							},
						],
						'Secure verification process.',
					),
				],
			});

			const oauthData = await getAuthorizationDataFromMongoDB(
				interaction.id,
			);
			if (!oauthData?.youtubeConnections?.length) {
				throw new Error('No YouTube connections found.');
			}

			const { youtubeChannelId, subscriberCount } =
				await getHighestSubscriberCount(oauthData.youtubeConnections);
			if (subscriberCount === null) {
				throw new Error('Failed to retrieve subscriber count.');
			}

			const roleName = await assignSubscriberRole(
				interaction.member,
				subscriberCount,
			);
			await interaction.editReply({
				embeds: [
					createEmbed(
						'🎉 Verification Complete!',
						'You have been successfully verified and assigned a role.',
						[
							{
								name: '🏆 Role Assigned',
								value: roleName,
								inline: false,
							},
							{
								name: '👥 Subscriber Count',
								value: subscriberCount.toLocaleString(),
								inline: false,
							},
							{
								name: '🔗 YouTube Channel',
								value: `[View Channel](https://www.youtube.com/channel/${youtubeChannelId})`,
								inline: false,
							},
						],
						'Thank you for verifying!',
					),
				],
			});
		} catch (error) {
			handleError(error);
			await interaction.editReply({
				embeds: [
					createEmbed(
						'❌ Error',
						error.message,
						[],
						'Please try again later.',
						0xff0000,
					),
				],
			});
		}
	},
};

function generateDiscordOAuthUrl(state) {
	return `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}&redirect_uri=${encodeURIComponent(process.env.DISCORD_REDIRECT_URI)}&response_type=code&scope=identify%20connections&state=${encodeURIComponent(state)}`;
}

function createEmbed(
	title,
	description,
	fields = [],
	footerText,
	color = 0x0099ff,
) {
	return {
		color,
		title,
		description,
		fields,
		footer: { text: footerText },
		timestamp: new Date(),
	};
}

async function getAuthorizationDataFromMongoDB(interactionId) {
	const timeout = 60000;
	const pollingInterval = 1000;
	let elapsed = 0;

	while (elapsed < timeout) {
		const oauthRecord = await OAuthCode.findOne({ interactionId });
		if (oauthRecord) return oauthRecord;
		await new Promise((res) => setTimeout(res, pollingInterval));
		elapsed += pollingInterval;
	}
	throw new Error('Authorization timeout.');
}

async function getHighestSubscriberCount(youtubeConnections) {
	let highest = { youtubeChannelId: null, subscriberCount: 0 };
	for (const connection of youtubeConnections) {
		const count = await getYouTubeSubscriberCount(connection.id);
		if (count > highest.subscriberCount) {
			highest = {
				youtubeChannelId: connection.id,
				subscriberCount: count,
			};
		}
	}
	return highest;
}

async function getYouTubeSubscriberCount(channelId) {
	const response = await youtube.channels.list({
		part: 'statistics',
		id: channelId,
	});
	return parseInt(
		response.data.items[0]?.statistics?.subscriberCount || 0,
		10,
	);
}

async function assignSubscriberRole(member, subscriberCount) {
	const ranges = [
		{ max: 100, name: 'Less than 100 Subs' },
		{ max: 500, name: '100 - 499 Subs' },
		{ max: 1000, name: '500 - 999 Subs' },
		{ max: 5000, name: '1K - 4.9K Subs' },
		{ max: 10000, name: '5K - 9.9K Subs' },
		{ max: 50000, name: '10K - 49.9K Subs' },
		{ max: 100000, name: '50K - 99.9K Subs' },
		{ max: 500000, name: '100K - 499.9K Subs' },
		{ max: 1000000, name: '500K - 999.9K Subs' },
		{ max: Infinity, name: '1M+ Subs' },
	];
	const roleName = ranges.find((range) => subscriberCount < range.max).name;
	const roleData = await RoleSchema.findOne({ roleName });
	if (!roleData) throw new Error(`Role "${roleName}" not found.`);
	await member.roles.add(roleData.roleID);
	return roleName;
}
