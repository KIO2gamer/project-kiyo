const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('embed')
		.setDescription('Posts a pre-formatted embed message.')
		.addStringOption(option =>
			option
				.setName('type')
				.setDescription('Select the type of embed to post')
				.setRequired(true)
				.addChoices(
					{ name: 'Welcome', value: 'welcome' },
					{ name: 'Level Roles', value: 'level_roles' },
					{ name: 'Server Booster Perks', value: 'booster_perks' },
					{ name: 'Other Roles', value: 'other_roles' },
					{ name: 'All Role Information', value: 'all_roles' },
					{ name: 'Forms', value: 'forms' },
					{ name: 'Server Rules', value: 'rules' },
					{ name: 'Self-Assignable Roles', value: 'self_roles' }
				)
		)
		.setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
	 

	async execute(interaction) {
		const embedType = interaction.options.getString('type');

		const roles = this.getRoles(interaction); // Use helper method to get roles

		const embeds = this.getEmbeds(roles);

		try {
			if (embeds[embedType]) {
				const embed = embeds[embedType];

				if (Array.isArray(embed)) {
					for (const e of embed) {
						await interaction.channel.send({ embeds: [e] });
					}
				} else {
					await interaction.channel.send({ embeds: [embed] });
				}

				console.log(`Embed posted by ${interaction.user.tag}: ${embedType}`);
			} else if (embedType === 'all_roles') {
				await interaction.channel.send({
					embeds: [embeds.level_roles, embeds.booster_perks, embeds.other_roles],
				});
				console.log(`All role embeds posted by ${interaction.user.tag}`);
			} else {
				return interaction.reply({
					content: 'Invalid embed type chosen!',
					ephemeral: true,
				});
			}
		} catch (error) {
			console.error(
				`Error posting embed of type ${embedType} by ${interaction.user.tag}:`,
				error
			);
			await interaction.reply({
				content: `An error occurred: ${error.message}`,
				ephemeral: true,
			});
		}
	},

	getRoles(interaction) {
		const findRoleByName = roleName =>
			interaction.guild.roles.cache.find(role => role.name === roleName);

		return {
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
			godGrinder: findRoleByName('God Grinder (100+)'),
			ogMembers: findRoleByName('OG members'),
			subscriber: findRoleByName('Subscriber'),
			admin: findRoleByName('Admin'),
			moderator: findRoleByName('Moderator'),
			traineeMod: findRoleByName('Trainee Moderator'),
			owner: findRoleByName('Owner'),
			coowner: findRoleByName('Co-Owner'),
			chatRevivePing: findRoleByName('Chat Revive Ping'),
			booster: findRoleByName('Booster'),
		};
	},

	getEmbeds(roles) {
		return {
			welcome: new EmbedBuilder()
				.setTitle('Welcome to [Your Server Name]! 👋')
				.setDescription(
					`Welcome to our community! We're glad you're here. 
                    
                    **Here are some key things to check out:**
                    
                    - **<#channel-id>:** Read our server rules to ensure a positive experience for everyone.
                    - **<#channel-id>:** Get support or ask any questions you have.
                    - **<#channel-id>:** Find people to play games with!
                    - **[Server Invite Link]**: Share the server with your friends!`
				)
				.setColor('#7289DA')
				.setThumbnail('https://i.imgur.com/your-welcome-image.png')
				.setFooter({ text: 'We hope you enjoy your time here!' }),

			level_roles: new EmbedBuilder()
				.setTitle('🔰 Level Roles 🔰')
				.setDescription(
					`Talking in the server will allow you to gain xp. The more you earn xp, the higher level you unlock and the better perks you will get. Every minute, you earn **35-70 XP** by chatting in the server.`
				)
				.addFields(
					{
						name: `No Rank Perks`,
						value: `- ${roles.wood}\n- ${roles.coal}\n- ${roles.iron}\n- ${roles.amethyst}\n- ${roles.ruby}\n- ${roles.opal}\n- ${roles.godGrinder}`,
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

			booster_perks: new EmbedBuilder()
				.setTitle('Thank You, Server Boosters! ❤️')
				.setDescription(
					`Boosting our server helps us grow and provides you with amazing perks!
                    
                    **Perks:**
                    - Special ${roles.booster || 'Booster'} role\n- Access to exclusive channels: <#channel-id>, <#channel-id>\n- Ability to change your nickname\n- Use external emojis in the server`
				)
				.setColor('#F47FFF')
				.setThumbnail('https://i.imgur.com/your-booster-perks-image.png'),

			other_roles: new EmbedBuilder()
				.setTitle('Other Server Roles')
				.setDescription('These roles are assigned based on specific criteria or by staff.')
				.addFields(
					{
						name: 'Staff Roles',
						value: `
                            **${roles.admin || 'Admin'}** - Manages server settings and enforces rules.
                            **${roles.moderator || 'Moderator'}** - Assists with moderation and community management.
                            **${roles.traineeMod || 'Trainee Moderator'}** -  New moderators learning the ropes. 
                        `,
						inline: true,
					},
					{
						name: 'Special Roles',
						value: `
                            **${roles.ogMembers || 'OG Members'}** -  Early supporters of the server.
                            **${roles.subscriber || 'Subscriber'}** - Subscribers to our [YouTube/Titch/etc.].
                        `,
						inline: true,
					}
				)
				.setColor('#0099ff')
				.setThumbnail('https://i.imgur.com/your-other-roles-image.png'),

			forms: new EmbedBuilder()
				.setTitle('📋 Important Forms 📋')
				.setDescription('Access important forms for applications and appeals.')
				.addFields(
					{
						name: 'Moderator Application',
						value: '> Apply to join our moderation team! [Link to Application](https://your-form-link-here)',
					},
					{
						name: 'Ban/Mute Appeal',
						value: '> Appeal a ban or mute if you believe it was unjust. [Link to Appeal Form](https://your-form-link-here)',
					}
				)
				.setColor('#00FFFF') // Cyan
				.setThumbnail('https://i.imgur.com/your-forms-image.png'),

			rules: [
				new EmbedBuilder()
					.setTitle('Server Rules 📜')
					.setDescription(
						`Welcome to our community! To ensure a positive and enjoyable environment for everyone, please familiarize yourself with the following rules.`
					)
					.setColor('#FF0000'), // Red

				new EmbedBuilder()
					.setTitle('Rule 1: No Spamming')
					.setDescription(
						`**1.1 Excessive Messages:** Avoid sending a large number of messages in quick succession.
                        **1.2 Repetitive Content:** Refrain from repeatedly posting the same message, emojis, or similar content.
                        **1.3 Irrelevant Content:** Keep your messages relevant to the channel's topic. Avoid derailing conversations.
                        **1.4 Mention Spam:** Do not excessively tag (@mention) users or roles without a valid reason. 
                        **1.5 Voice Channel Disruption:** Refrain from making unnecessary noise or using soundboards that disrupt conversations in voice channels.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 2: Be Respectful')
					.setDescription(
						`**2.1 Harassment and Bullying:** Treat everyone with courtesy and respect. Harassment, bullying, and personal attacks will not be tolerated.
                        **2.2 Discrimination:** Discrimination based on race, religion, gender, sexual orientation, or any other protected characteristic is strictly prohibited. 
                        **2.3 Offensive Language:** Avoid using slurs, hate speech, or other language that could be considered offensive or hurtful.
                        **2.4 Personal Information:** Do not share anyone's personal information without their explicit consent.
                        **2.5 Threatening Behavior:** Threats of violence or harm are strictly forbidden and will be reported to Discord.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 3: No NSFW Content')
					.setDescription(
						`**3.1 Explicit Content:**  This server is intended for a general audience. Do not post NSFW (Not Safe for Work) content, including sexually suggestive material, gore, or violence.
                        **3.2 NSFW Language:**  Keep your language appropriate for all ages. Avoid using explicit or suggestive terms.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 4: English Only')
					.setDescription(
						`**4.1 Primary Language:** To ensure effective communication and moderation, English is the primary language of this server.
                        **4.2 Language-Specific Channels:** If you wish to communicate in another language, request a dedicated channel from the staff.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 5: No Politics or Religious Discussions')
					.setDescription(
						`**5.1 Sensitive Topics:** Discussions about politics and religion can be divisive. To maintain a harmonious environment, please refrain from engaging in these topics.
                        **5.2 Respectful Disagreement:** If these topics arise, please be respectful of differing viewpoints and avoid engaging in heated arguments.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 6: Appropriate Language')
					.setDescription(
						`**6.1 Profanity:**  While some mild profanity might be acceptable, avoid excessive swearing or using offensive language.
                        **6.2 Hate Speech:**  Hate speech, derogatory terms, and slurs targeting any group or individual are strictly forbidden.
                        **6.3 Language Filters:**  Do not attempt to bypass any language filters or use creative spellings to circumvent the rules.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 7: Pingable Usernames')
					.setDescription(
						`**7.1 Easily Mentionable:** Choose a username that can be easily pinged by other members. 
                        **7.2 Avoid Disruptive Characters:**  Avoid using special characters, symbols, or excessive capitalization that make it difficult to mention your username.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 8: Use Channels Correctly')
					.setDescription(
						`**8.1 Channel Purpose:** Each channel has a specific purpose. Please post content relevant to the channel's topic.
                        **8.2 Off-Topic Discussions:** For general or off-topic conversations, use designated channels such as <#your-general-chat-channel-id>.
                        **8.3 Channel Disruption:** Avoid disrupting ongoing conversations with unrelated topics.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 9: No Ghost Pinging')
					.setDescription(
						`**9.1 Disruptive Behavior:** Ghost pinging (mentioning someone and then deleting the message) is disruptive and can be frustrating for other members. Avoid this behavior.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 10: No Advertising')
					.setDescription(
						`**10.1 Unauthorized Advertising:** Advertising other servers, websites, social media accounts, or personal projects is not permitted without explicit permission from the staff.
                        **10.2 Direct Message Advertising:** Avoid sending unsolicited advertisements or promotional messages to other members.`
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle("Rule 11: Follow Discord's Community Guidelines")
					.setDescription(
						`**11.1 Discord's Rules:** In addition to our server rules, you must adhere to [Discord's Community Guidelines](https://discord.com/guidelines). 
                        **11.2 Discord Consequences:** Violation of Discord's guidelines may result in actions against your account by Discord.`
					)
					.setColor('#FF0000'),
			],

			self_roles: new EmbedBuilder()
				.setTitle('Customize Your Experience! 🎨')
				.setDescription(
					`Assign yourself roles to personalize your experience and connect with others who share your interests! 
                    
                    **How to get roles:**
                    - Go to the <#channel-id-for-self-roles> channel.
                    - React to the messages corresponding to the roles you want.`
				)
				.setColor('#800080') // Purple
				.setThumbnail('https://i.imgur.com/your-self-roles-image.png'),
		};
	},
};
