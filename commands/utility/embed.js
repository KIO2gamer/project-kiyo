// const {
//     SlashCommandBuilder,
//     EmbedBuilder,
//     PermissionFlagsBits,
// } = require("discord.js");

// module.exports = {
//     data: new SlashCommandBuilder()
//         .setName("embed")
//         .setDescription("Posts an embed.")
//         .addStringOption((option) =>
//             option
//                 .setName("text")
//                 .setDescription("sends a embed text")
//                 .setRequired(true)
//                 .addChoices(
//                     {
//                         name: "Welcome",
//                         value: "welcome",
//                     },
//                     {
//                         name: "Rank Roles",
//                         value: "role_ranks",
//                     },
//                     {
//                         name: "Booster Role",
//                         value: "role_booster",
//                     },
//                     {
//                         name: "Other Roles",
//                         value: "role_others",
//                     },
//                     {
//                         name: "All Roles Info",
//                         value: "role_all",
//                     },
//                     {
//                         name: "Forms",
//                         value: "forms",
//                     },
//                     {
//                         name: "Rules",
//                         value: "rules",
//                     },
//                     {
//                         name: "Own Roles",
//                         value: "own_roles",
//                     },
//                 ),
//         )
//         .setDefaultMemberPermissions(
//             PermissionFlagsBits.BanMembers || PermissionFlagsBits.KickMembers,
//         ),
//     category: "moderation",

//     async execute(interaction) {
//         const textChosen = interaction.options.getString("text");

//         // rank roles
//         const wood = interaction.guild.roles.cache.find(
//             (role) => role.name == "Wood (5+)",
//         );
//         const coal = interaction.guild.roles.cache.find(
//             (role) => role.name == "Coal (10+)",
//         );
//         const iron = interaction.guild.roles.cache.find(
//             (role) => role.name == "Iron (15+)",
//         );
//         const bronze = interaction.guild.roles.cache.find(
//             (role) => role.name == "Bronze (20+)",
//         );
//         const gold = interaction.guild.roles.cache.find(
//             (role) => role.name == "Gold (30+)",
//         );
//         const platinum = interaction.guild.roles.cache.find(
//             (role) => role.name == "Platinum (40+)",
//         );
//         const diamond = interaction.guild.roles.cache.find(
//             (role) => role.name == "Diamond (50+)",
//         );
//         const sapphire = interaction.guild.roles.cache.find(
//             (role) => role.name == "Sapphire (55+)",
//         );
//         const amethyst = interaction.guild.roles.cache.find(
//             (role) => role.name == "Amethyst (60+)",
//         );
//         const netherite = interaction.guild.roles.cache.find(
//             (role) => role.name == "Netherite (70+)",
//         );
//         const ruby = interaction.guild.roles.cache.find(
//             (role) => role.name == "Ruby (80+)",
//         );
//         const emerald = interaction.guild.roles.cache.find(
//             (role) => role.name == "Emerald (90+)",
//         );
//         const opal = interaction.guild.roles.cache.find(
//             (role) => role.name == "Opal (95+)",
//         );
//         const god_grinder = interaction.guild.roles.cache.find(
//             (role) => role.name == "God Grinder (100+)",
//         );

//         // other roles
//         const og_members = interaction.guild.roles.cache.find(
//             (role) => role.name == "OG members",
//         );
//         const Subscriber = interaction.guild.roles.cache.find(
//             (role) => role.name == "Subscriber",
//         );
//         const admin = interaction.guild.roles.cache.find(
//             (role) => role.name == "Admin",
//         );
//         const staffs = interaction.guild.roles.cache.find(
//             (role) => role.name == "Staffs",
//         );
//         const moderator = interaction.guild.roles.cache.find(
//             (role) => role.name == "Moderator",
//         );
//         const traineemod = interaction.guild.roles.cache.find(
//             (role) => role.name == "Trainee Moderator",
//         );
//         const owner = interaction.guild.roles.cache.find(
//             (role) => role.name == "Owner",
//         );
//         const coowner = interaction.guild.roles.cache.find(
//             (role) => role.name == "Co-Owner",
//         );
//         const chat_revive_ping = interaction.guild.roles.cache.find(
//             role => role.name == "Chat Revive Ping"
//         );

//         const welcomeEmbed = new EmbedBuilder()
//             .setTitle(`Welcome to The KIO2gamer Official Discord (TKOD) Server`)
//             .setDescription(
//                 `**Welcome new members to the amazing server of The KIO2gamer Official Discord (TKOD) Server. We are a friendly community and we will always try to help you. Below are some of the important things you need to explore first as a new member. We hope you enjoy your stay here!**
//                 <:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649>

//                 **Important Links to navigate through the server:**
//                 - [Server Rules](https://discord.com/channels/935017969271054346/938309117771149342)\n- Support Channels\n - [Public](https://discord.com/channels/935017969271054346/950302591504498718)\n - [Private](https://discord.com/channels/935017969271054346/1170620573613826068)\n- [Server Invite](https://discord.gg/3uDPm9NV4X)
//                 `,
//             )
//             .setColor("Purple");

//         const roleRanksEmbed = new EmbedBuilder()
//             .setTitle("**Level Roles**")
//             .setDescription(
//                 `Talking in the server will allow you to gain xp. The more you earn xp, the higher level you unlock and the better perks you will get. Every minute, you earn **35-70 XP** by chatting in the server.`,
//             )
//             .addFields(
//                 {
//                     name: `--------------------------------- No Rank Perks ---------------------------------`,
//                     value: `\n`,
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${wood}`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${coal}`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${iron}`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${amethyst}`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${ruby}`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${opal}`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${god_grinder}`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `\n`,
//                 },
//                 {
//                     name: `------------------------------ Available Rank Perks ------------------------------`,
//                     value: `\n`,
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${bronze} \n - Permission to change your username.`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${gold} \n - Get access to <#950318340889518150> and <#950318103739400202>`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${platinum} \n - Get image permissions in <#1239619089425764362>`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${diamond} \n - Get link permissions in <#1239619089425764362>`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${sapphire} \n - Get access to use other emojis in the server.`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${netherite} \n - Get a custom role in the server (Open a ticket in <#1170620573613826068>)`,
//                     inline: true
//                 },
//                 {
//                     name: `\n`,
//                     value: `- ${emerald} \n - Get a custom role icon in the server (Open a ticket in <#1170620573613826068>)`,
//                     inline: true
//                 },

//             )
//             .setColor("Purple");

//         const roleBoosterEmbed = new EmbedBuilder()
//             .setTitle(`Server Booster\'s Perks`)
//             .setDescription(
//                 `You will get <@&951975588724363275> role, access to <#950318340889518150>, <#950318103739400202>, ability to change your nickname and use other emojis in the server.`,
//             )
//             .setColor("Purple");

//         const roleOthersEmbed = new EmbedBuilder()
//             .setTitle("Miscellaneous Roles Information")
//             .setDescription(
//                 "Below are the roles which are given to specific members under specific conditions.",
//             )
//             .addFields(
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "\n",
//                     value: `We have three types of ${staffs} members in this server.`,
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: `\n`,
//                     value: `> ${admin} - These are the highest possible staff members in this server. They have the permissions to alter the server's settings. This role can only be given to those picked by the server owner.`,
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "\n",
//                     value: `> ${moderator} - These are the staff members who have a great experience in moderating the server, You can get it if you get promoted from ${traineemod}`,
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "\n",
//                     value: `> ${traineemod} - These are second type of staff members who just joined the team but needs more experience in the server. You can get it if you get accepted in the Moderator Applications.`,
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "\n",
//                     value: `${og_members} - These members are the ones who first joined this server when it was created. You can't get this role anymore.`,
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "\n",
//                     value: `${Subscriber} - These members have subscribed to [KIO2gamer](https://www.youtube.com/@kio2gamer). You can get this role in <#1180862022099947531>`,
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "\n",
//                     value: `${chat_revive_ping} - Pings you at random to keep server active.`,
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: `\n`,
//                     value: `${owner} is <@764513584125444146>
//                     ${coowner} is <@787259868049571842>
//                     We are the founders of this server.`,
//                 },
//             )
//             .setColor("Purple");

//         const modFormsEmbed = new EmbedBuilder()
//             .setTitle("To apply for moderator of this server")
//             .setDescription(
//                 "> Go to [Moderator Applications](https://forms.gle/GJMUUiSjLPuiLvmA9) and fill up the form.",
//             )
//             .setColor("Purple");

//         const banmuteFormsEmbed = new EmbedBuilder()
//             .setTitle("To appeal for your ban/mute punishments")
//             .setDescription(
//                 "> Go to [Ban / Mute Appeal Form](https://forms.gle/6M5wgndJj6r3W7KD8) and fill it up.",
//             )
//             .setColor("Purple");

//         const rulesEmbed = new EmbedBuilder()
//             .setTitle("Rules for The Official KIO2gamer Discord Server (TOKD)")
//             .setDescription(
//                 `<@&944618320232075284> must abide server's rules. Failing to do so can lead to warn, mute, kick, or even ban. Any attempts of bypassing, exploiting etc. towards the server will get you instantly banned and reported.`,
//             )
//             .addFields(
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 1 - No Spamming**",
//                     value: "> This includes obnoxious noises in voice, @mention spam, character spam, image spam, and interaction spam.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 2 - No unnecessary explicit content**",
//                     value: "> This includes NSFW, 18+, sexual and offensive content which makes the members uncomfortable to see.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 3 - No harassment**",
//                     value: "> This includes any form of harassment or encouraging of harassment.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 4 - No talking in other languages**",
//                     value: `> Please type only in intelligible English in our server as we are unable to moderate other languages consistently throughout the day.`,
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 5 - No politics or any religious discussion**",
//                     value: "> Please refrain from talking about the politics and any religious support in the chas it will become chaotic and nearly impossible to moderate.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 6 - No inappropriate language or bypassing them**",
//                     value: "> Even though we have set up AutoMod to delete any inappropriate language, You should not bypass them. Failing to do so might lead to a mute or in higher degrees, ban. This includes swearing, trash talking, etc. Refrain from directing it another member unsuspectingly.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 7 - Username should be pingable**",
//                     value: "> Please do not use special characters or unicodes in your username as you might be pinged for something.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 8 - Use the channels correctly**",
//                     value: "> Please use the channels in the correct places to avoid disturbance in the chat. For out of context discussions, please refer to the https://discord.com/channels/935017969271054346/1237018886843400243 channel.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 9 - No ghost pinging**",
//                     value: "> Please refrain from ghost pinging members as they are quite annoying and waste others valuable time.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: `**Rule 10 - No advertising**`,
//                     value: "> Please do not advertise anything in our server. This includes websites, social media, etc. Same applies to DM-advertising.",
//                 },
//                 {
//                     name: `\n`,
//                     value: "\n",
//                 },
//                 {
//                     name: "**Rule 11 - Follow Discord's community guidelines.**",
//                     value: "> <https://discord.com/guidelines>",
//                 },
//             )
//             .setColor("Purple");

//         const ownRolesEmbed_Subscriber = new EmbedBuilder()
//             .setTitle("Are you subscribed to KIO2gamer ?")
//             .setDescription(
//                 `If you are subscribed, click the green button to get access to <#1237247763910234132> and <#1237247979103064145>`,
//             )
//             .setColor("Purple");

//         const ownRolesEmbed_Location = new EmbedBuilder()
//             .setTitle("Where are you from?")
//             .setDescription(
//                 `Choosing this role can often help people know when you may be most active on this server.`,
//             )
//             .setColor("Purple");

//         const ownRolesEmbed_Gender = new EmbedBuilder()
//             .setTitle("What is your gender?")
//             .setDescription(
//                 `You may use Discord's new \`Pronouns Textbox\` or either take from one of these roles. It helps to identify who you truly are and use your pronouns carefully without triggering everyone. We treat every community the same respect in this server.`,
//             )
//             .setColor("Purple");

//         const ownRolesEmbed_Platform = new EmbedBuilder()
//             .setTitle("What is your platform?")
//             .setDescription(
//                 `Perfect roles for those who might be searching for someone who might have the same platform to play, watch and enjoy together.`,
//             )
//             .setColor("Purple");

//         const ownRolesEmbed_Hobby = new EmbedBuilder()
//             .setTitle("What is your hobby?")
//             .setDescription(
//                 `This role is perfect for those who are looking for someone who is into the same hobby as you.`,
//             )
//             .setColor("Purple");

//         try {

//             if (textChosen === "welcome") {
//                 return (
//                     interaction.channel.send({
//                         embeds: [welcomeEmbed],
//                     })
//                 );
//             } else if (textChosen === "rules") {
//                 return (
//                     interaction.channel.send({
//                         embeds: [rulesEmbed],
//                     })
//                 );
//             } else if (textChosen === "role_ranks") {
//                 return interaction.channel.send({
//                     embeds: [roleRanksEmbed],
//                 });
//             } else if (textChosen === "role_booster") {
//                 return interaction.channel.send({
//                     embeds: [roleBoosterEmbed],
//                 });
//             } else if (textChosen === "role_others") {
//                 return interaction.channel.send({
//                     embeds: [roleOthersEmbed],
//                 });
//             } else if (textChosen === "role_all") {
//                 return (
//                     interaction.channel.send({
//                         embeds: [roleRanksEmbed, roleBoosterEmbed, roleOthersEmbed],
//                     })
//                 );
//             } else if (textChosen === "forms") {
//                 return interaction.channel.send({
//                     embeds: [modFormsEmbed, banmuteFormsEmbed],
//                 });
//             } else if (textChosen === "own_roles") {
//                 return (
//                     interaction.channel.send({
//                         embeds: [ownRolesEmbed_Subscriber],
//                     }) &&
//                     interaction.channel.send({
//                         embeds: [ownRolesEmbed_Location],
//                     }) &&
//                     interaction.channel.send({
//                         embeds: [ownRolesEmbed_Gender],
//                     }) &&
//                     interaction.channel.send({
//                         embeds: [ownRolesEmbed_Hobby],
//                     }) &&
//                     interaction.channel.send({
//                         embeds: [ownRolesEmbed_Platform],
//                     })
//                 );
//             }
//         } catch (error) {
//             const errEmbed = new EmbedBuilder()
//             errEmbed.setColor("RED").setDescription(error);
//         }
//     },
// };

const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('embed')
		.setDescription('Posts an embed.')
		.addStringOption(option =>
			option
				.setName('text')
				.setDescription('Select the type of embed to send')
				.setRequired(true)
				.addChoices(
					{ name: 'Welcome', value: 'welcome' },
					{ name: 'Rank Roles', value: 'role_ranks' },
					{ name: 'Booster Role', value: 'role_booster' },
					{ name: 'Other Roles', value: 'role_others' },
					{ name: 'All Roles Info', value: 'role_all' },
					{ name: 'Forms', value: 'forms' },
					{ name: 'Rules', value: 'rules' },
					{ name: 'Own Roles', value: 'own_roles' }
				)
		)
		.setDefaultMemberPermissions(
			PermissionFlagsBits.BanMembers || PermissionFlagsBits.KickMembers
		),
	category: 'utility',

	async execute(interaction) {
		const textChosen = interaction.options.getString('text');

		// Utility function to find roles by name
		const findRoleByName = roleName =>
			interaction.guild.roles.cache.find(role => role.name === roleName);

		// Roles
		const roles = {
			wood: findRoleByName('Wood (5+)'),
			coal: findRoleByName('Coal (10+)'),
			iron: findRoleByName('Iron (15+)'),
			bronze: findRoleByName('Bronze (20+)'),
			gold: findRoleByName('Gold (30+)'),
			platinum: findRoleByName('Platinum (40+)'),
			diamond: findRoleByName('Diamond (50+)'),
			sapphire: findRoleByName('Sapphire (55+)'),
			amethyst: findRoleByName('Amethyst (60+)'),
			netherite: findRoleByName('Netherite (70+)'),
			ruby: findRoleByName('Ruby (80+)'),
			emerald: findRoleByName('Emerald (90+)'),
			opal: findRoleByName('Opal (95+)'),
			god_grinder: findRoleByName('God Grinder (100+)'),
			og_members: findRoleByName('OG members'),
			subscriber: findRoleByName('Subscriber'),
			admin: findRoleByName('Admin'),
			moderator: findRoleByName('Moderator'),
			traineemod: findRoleByName('Trainee Moderator'),
			owner: findRoleByName('Owner'),
			coowner: findRoleByName('Co-Owner'),
			chat_revive_ping: findRoleByName('Chat Revive Ping'),
		};

		// Embeds
		const embeds = {
			welcome: new EmbedBuilder()
				.setTitle('🌟 Welcome to The KIO2gamer Official Discord (TKOD) Server! 🌟')
				.setDescription(
					`**Welcome new members to the amazing server of The KIO2gamer Official Discord (TKOD) Server. We are a friendly community and we will always try to help you. Below are some of the important things you need to explore first as a new member. We hope you enjoy your stay here!**
                    <:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649>
                    
                    **Important Links to navigate through the server:**
                    - [Server Rules](https://discord.com/channels/935017969271054346/938309117771149342)\n- Support Channels\n - [Public](https://discord.com/channels/935017969271054346/950302591504498718)\n - [Private](https://discord.com/channels/935017969271054346/1170620573613826068)\n- [Server Invite](https://discord.gg/3uDPm9NV4X)`
				)
				.setThumbnail('https://example.com/welcome.png')
				.setColor('Purple')
				.setFooter({
					text: 'Enjoy your stay!',
					iconURL: 'https://example.com/icon.png',
				}),

			role_ranks: new EmbedBuilder()
				.setTitle('🔰 Level Roles 🔰')
				.setDescription(
					`Talking in the server will allow you to gain xp. The more you earn xp, the higher level you unlock and the better perks you will get. Every minute, you earn **35-70 XP** by chatting in the server.`
				)
				.addFields(
					{
						name: `No Rank Perks`,
						value: `- ${roles.wood}\n- ${roles.coal}\n- ${roles.iron}\n- ${roles.amethyst}\n- ${roles.ruby}\n- ${roles.opal}\n- ${roles.god_grinder}`,
						inline: true,
					},
					{
						name: `Available Rank Perks`,
						value: `- ${roles.bronze} \n - Permission to change your username.\n- ${roles.gold} \n - Get access to <#950318340889518150> and <#950318103739400202>\n- ${roles.platinum} \n - Get image permissions in <#1239619089425764362>\n- ${roles.diamond} \n - Get link permissions in <#1239619089425764362>\n- ${roles.sapphire} \n - Get access to use other emojis in the server.\n- ${roles.netherite} \n - Get a custom role in the server (Open a ticket in <#1170620573613826068>)\n- ${roles.emerald} \n - Get a custom role icon in the server (Open a ticket in <#1170620573613826068>)`,
						inline: true,
					}
				)
				.setThumbnail('https://example.com/rank.png')
				.setColor('Purple')
				.setFooter({
					text: 'Keep chatting to level up!',
					iconURL: 'https://example.com/icon.png',
				}),

			role_booster: new EmbedBuilder()
				.setTitle("🚀 Server Booster's Perks 🚀")
				.setDescription(
					`You will get <@&951975588724363275> role, access to <#950318340889518150>, <#950318103739400202>, ability to change your nickname and use other emojis in the server.`
				)
				.setThumbnail('https://example.com/booster.png')
				.setColor('Purple')
				.setFooter({
					text: 'Thank you for boosting!',
					iconURL: 'https://example.com/icon.png',
				}),

			role_others: new EmbedBuilder()
				.setTitle('🎭 Miscellaneous Roles Information 🎭')
				.setDescription(
					'Below are the roles which are given to specific members under specific conditions.'
				)
				.addFields(
					{
						name: `Owners`,
						value: `${roles.owner} is <@764513584125444146>\n${roles.coowner} is <@787259868049571842>\nWe are the founders of this server.`,
						inline: true,
					},
					{
						name: `Admin`,
						value: `${roles.admin} - These are the highest possible staff members in this server. They have the permissions to alter the server's settings. This role can only be given to those picked by the server owner.`,
						inline: true,
					},
					{
						name: `Moderator`,
						value: `${roles.moderator} - These are the staff members who have a great experience in moderating the server, You can get it if you get promoted from ${roles.traineemod}`,
						inline: true,
					},
					{
						name: `Trainee Moderator`,
						value: `${roles.traineemod} - These are second type of staff members who just joined the team but needs more experience in the server. You can get it if you get accepted in the Moderator Applications.`,
						inline: true,
					},
					{
						name: `OG Members`,
						value: `${roles.og_members} - These members are the ones who first joined this server when it was created. You can't get this role anymore.`,
						inline: true,
					},
					{
						name: `Subscriber`,
						value: `${roles.subscriber} - These members have subscribed to [KIO2gamer](https://www.youtube.com/@kio2gamer). You can get this role in <#1180862022099947531>`,
						inline: true,
					}
				)
				.setThumbnail('https://example.com/misc.png')
				.setColor('Purple')
				.setFooter({
					text: 'Role info',
					iconURL: 'https://example.com/icon.png',
				}),

			forms: new EmbedBuilder()
				.setTitle('📋 Forms 📋')
				.setDescription('Below are some forms for various applications.')
				.addFields(
					{
						name: 'Moderator Application',
						value: '> Go to [Moderator Applications](https://forms.gle/GJMUUiSjLPuiLvmA9) and fill up the form.',
					},
					{
						name: 'Ban/Mute Appeal',
						value: '> Go to [Ban / Mute Appeal Form](https://forms.gle/6M5wgndJj6r3W7KD8) and fill it up.',
					}
				)
				.setThumbnail('https://example.com/forms.png')
				.setColor('Purple')
				.setFooter({
					text: 'Submit your forms!',
					iconURL: 'https://example.com/icon.png',
				}),

			rules: new EmbedBuilder()
				.setTitle('📜 Rules for The Official KIO2gamer Discord Server (TOKD) 📜')
				.setDescription(
					`<@&944618320232075284> must abide by the server's rules. Failing to do so can lead to warn, mute, kick, or even ban. Any attempts of bypassing, exploiting etc. towards the server will get you instantly banned and reported.`
				)
				.addFields(
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 1 - No Spamming**',
					  value: 'Spamming disrupts the flow of conversation and can be very annoying. This includes, but is not limited to:\n' +
							 '- Excessive @mentions\n' +
							 '- Repeated characters or words\n' +
							 '- Continuous posting of images, links, or messages\n' +
							 '- Making obnoxious noises in voice channels\n\n' +
							 '**Violators will be warned or muted.**\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 2 - Respectful Content Only**',
					  value: 'We strive to create a welcoming and safe environment for everyone. Do not post:\n\n' +
							 '- NSFW (Not Safe For Work) content\n' +
							 '- Sexually explicit or suggestive material\n' +
							 '- Offensive content that targets or belittles any group or individual\n' +
							 '- Any content that could make other members uncomfortable\n\n' +
							 '**Such posts will be removed, and the user may be banned.**\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 3 - No Harassment**',
					  value: 'Everyone deserves to feel safe here. Harassment includes:\n\n' +
							 '- Bullying or targeting individuals\n' +
							 '- Intimidating or threatening behavior\n' +
							 '- Encouraging others to harass someone\n' +
							 '- Stalking or personal attacks\n\n' +
							 '**Any form of harassment will result in an immediate ban.**\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 4 - English Only**',
					  value: 'To ensure clear communication and effective moderation, please use English in all public channels. Non-English conversations can hinder our ability to moderate effectively. If you need a channel for another language, please request it from the staff.\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 5 - No Politics or Religious Discussions**',
					  value: 'Discussions about politics and religion can easily become heated and divisive. To maintain harmony, please refrain from:\n\n' +
							 '- Political debates\n' +
							 '- Religious arguments or proselytizing\n' +
							 '- Supporting or denouncing political or religious figures\n\n' +
							 '**Such discussions will be redirected or removed to keep the peace.**\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 6 - Appropriate Language**',
					  value: 'We want to maintain a respectful environment. Do not use:\n\n' +
							 '- Inappropriate or offensive language\n' +
							 '- Slurs, hate speech, or derogatory terms\n' +
							 '- Attempts to bypass language filters\n' +
							 '- Insults or trash talk directed at others\n\n' +
							 '**Violations can lead to warnings, mutes, or bans.**\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 7 - Pingable Usernames**',
					  value: 'For effective communication, make sure your username:\n\n' +
							 '- Can be easily mentioned (pinged)\n' +
							 '- Avoids special characters or symbols that complicate pinging\n' +
							 '- Is not offensive or inappropriate\n\n' +
							 '**Users with unpingable usernames will be asked to change them.**\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 8 - Use Channels Correctly**',
					  value: 'Help keep our server organized by using the right channels for the right topics:\n\n' +
							 '- Post content relevant to the channel\'s purpose\n' +
							 '- For off-topic or random discussions, use designated channels like <#1237018886843400243>\n' +
							 '- Avoid derailing ongoing conversations with unrelated topics\n\n' +
							 '**Misuse of channels may result in content being moved or deleted.**\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 9 - No Ghost Pinging**',
					  value: 'Ghost pinging (mentioning someone and then deleting the message) is disruptive and frustrating. It wastes members\' time and is considered rude. Repeated ghost pingers will be warned or muted.\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: '**Rule 10 - No Advertising**',
					  value: 'Advertising is not allowed unless explicitly permitted by the staff. This includes:\n\n' +
							 '- Websites or social media accounts\n' +
							 '- Other Discord servers\n' +
							 '- Personal projects or businesses\n' +
							 '- Advertising via direct messages\n\n' +
							 '**Violations will result in post deletion and possible bans.**\n\n',
					},
					{
						name: `\n`,
						value: `\n`,
					},
					{
					  name: "**Rule 11 - Follow Discord's Community Guidelines**",
					  value: 'Always adhere to Discord\'s official guidelines, which can be found here: [Discord Guidelines](https://discord.com/guidelines). Failure to comply with these guidelines may result in actions being taken against your account by Discord and our moderation team.\n\n',
					}
				)
				.setThumbnail('https://example.com/rules.png')
				.setColor('Purple')
				.setFooter({
					text: 'Follow the rules!',
					iconURL: 'https://example.com/icon.png',
				}),

			own_roles: [
				new EmbedBuilder()
					.setTitle('📣 Are you subscribed to KIO2gamer? 📣')
					.setDescription(
						'If you are subscribed, click the green button to get access to <#1237247763910234132> and <#1237247979103064145>'
					)
					.setColor('Purple')
					.setThumbnail('https://example.com/subscriber.png')
					.setFooter({
						text: 'Thanks for subscribing!',
						iconURL: 'https://example.com/icon.png',
					}),

				new EmbedBuilder()
					.setTitle('🌍 Where are you from? 🌍')
					.setDescription(
						'Choosing this role can often help people know when you may be most active on this server.'
					)
					.setColor('Purple')
					.setThumbnail('https://example.com/location.png')
					.setFooter({
						text: 'Set your location!',
						iconURL: 'https://example.com/icon.png',
					}),

				new EmbedBuilder()
					.setTitle('🚻 What is your gender? 🚻')
					.setDescription(
						"You may use Discord's new `Pronouns Textbox` or either take from one of these roles. It helps to identify who you truly are and use your pronouns carefully without triggering everyone. We treat every community the same respect in this server."
					)
					.setColor('Purple')
					.setThumbnail('https://example.com/gender.png')
					.setFooter({
						text: 'Set your gender!',
						iconURL: 'https://example.com/icon.png',
					}),

				new EmbedBuilder()
					.setTitle('💻 What is your platform? 💻')
					.setDescription(
						'Perfect roles for those who might be searching for someone who might have the same platform to play, watch and enjoy together.'
					)
					.setColor('Purple')
					.setThumbnail('https://example.com/platform.png')
					.setFooter({
						text: 'Set your platform!',
						iconURL: 'https://example.com/icon.png',
					}),

				new EmbedBuilder()
					.setTitle('🎨 What is your hobby? 🎨')
					.setDescription(
						'This role is perfect for those who are looking for someone who is into the same hobby as you.'
					)
					.setColor('Purple')
					.setThumbnail('https://example.com/hobby.png')
					.setFooter({
						text: 'Set your hobby!',
						iconURL: 'https://example.com/icon.png',
					}),
			],
		};

		try {
			if (textChosen in embeds) {
				const embed = embeds[textChosen];
				if (Array.isArray(embed)) {
					for (const e of embed) {
						await interaction.channel.send({ embeds: [e] });
					}
				} else {
					await interaction.channel.send({ embeds: [embed] });
				}
			} else if (textChosen === 'role_all') {
				await interaction.channel.send({
					embeds: [embeds.role_ranks, embeds.role_booster, embeds.role_others],
				});
			} else {
				return interaction.reply('Invalid embed type chosen!');
			}

			// Log the embed posting activity
			console.log(`Embed posted by ${interaction.user.tag}: ${textChosen}`);
		} catch (error) {
			console.error('Error posting embed:', error);
			await interaction.reply({
				content: `An error occurred: ${error.message}`,
				ephemeral: true,
			});
		}
	},
};
