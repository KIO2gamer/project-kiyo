const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    description_full:
        'This command allows users with "Manage Messages" permissions to post pre-formatted embed messages for various purposes like welcoming new members, displaying level roles, server rules, or other important information.',
    usage: '/embed <type>',
    examples: ['/embed welcome', '/embed rules', '/embed all_roles'],
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

        const roles = this.getRoles(interaction);
        const embeds = this.getEmbeds(roles);

        try {
            if (embeds[embedType]) {
                const embed = embeds[embedType];

                if (Array.isArray(embed)) {
                    await interaction.channel.send({ embeds: embed });
                } else {
                    await interaction.channel.send({ embeds: [embed] });
                }
            } else if (embedType === 'all_roles') {
                await interaction.channel.send({
                    embeds: [embeds.level_roles, embeds.booster_perks, embeds.other_roles],
                });
            } else {
                return interaction.reply({
                    content: 'Invalid embed type chosen!',
                    ephemeral: true,
                });
            }
        } catch (error) {
            await interaction.reply({
                content: `An error occurred: ${error.message}`,
                ephemeral: true,
            });
        }
    },

    getRoles(interaction) {
        const findRoleByName = roleName => interaction.guild.roles.cache.find(role => role.name === roleName);

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
                    `Welcome to our community! We're glad you're here. \n\n**Here are some key things to check out:**\n\n>- **<#channel-id>:** Read our server rules to ensure a positive experience for everyone.\n>- **<#channel-id>:** Get support or ask any questions you have.\n>- **<#channel-id>:** Find people to play games with!\n>- **[Server Invite Link]**: Share the server with your friends!\n\n **Introduce yourself in <#channel-id>!** 😄`
                )
                .setColor('#7289DA')
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Party_Poppers.svg/1200px-Party_Poppers.svg.png') // Welcome image
                .setFooter({ text: 'We hope you enjoy your time here!' }),

            level_roles: new EmbedBuilder()
                .setTitle('🔰 Level Roles 🔰')
                .setDescription(
                    `Talking in the server will allow you to gain xp. The more you earn xp, the higher level you unlock, and the better perks you will get. Every minute, you earn **35-70 XP** by chatting in the server.`
                )
                .addFields(
                    {
                        name: `**${roles.bronze || 'Bronze (20+)'}**`,
                        value: `- Permission to change your username.`,
                        inline: true,
                    },
                    {
                        name: `**${roles.gold || 'Gold (30+)'}**`,
                        value: `- Get access to <#950318340889518150> and <#950318103739400202>`,
                        inline: true,
                    },
                    {
                        name: `**${roles.platinum || 'Platinum (40+)'}**`,
                        value: `- Get image permissions in <#1239619089425764362>`,
                        inline: true,
                    },
                    {
                        name: `**${roles.diamond || 'Diamond (50+)'}**`,
                        value: `- Get link permissions in <#1239619089425764362>`,
                        inline: true,
                    },
                    {
                        name: `**${roles.sapphire || 'Sapphire (55+)'}**`,
                        value: `- Get access to use other emojis in the server.`,
                        inline: true,
                    },
                    {
                        name: `**${roles.netherite || 'Netherite (70+)'}**`,
                        value: `- Get a custom role in the server (Open a ticket in <#1170620573613826068>)`,
                        inline: true,
                    },
                    {
                        name: `**${roles.emerald || 'Emerald (90+)'}**`,
                        value: `- Get a custom role icon in the server (Open a ticket in <#1170620573613826068>)`,
                        inline: true,
                    },
                    {
                        name: `No Additional Perks`,
                        value: `- ${roles.wood}\n- ${roles.coal}\n- ${roles.iron}\n- ${roles.amethyst}\n- ${roles.ruby}\n- ${roles.opal}\n- ${roles.godGrinder}`,
                        inline: true,
                    }
                )
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/4/4b/Star_icon_plain_purple.svg/1024px-Star_icon_plain_purple.svg.png') // Level roles image
                .setColor('Purple')
                .setFooter({
                    text: 'Keep chatting to level up!',
                }),

            booster_perks: new EmbedBuilder()
                .setTitle('Thank You, Server Boosters! ❤️')
                .setDescription(
                    `Boosting our server helps us grow and provides you with amazing perks! \n\n **Perks:**\n\n - Special ${
                        roles.booster || 'Booster'
                    } role\n- Access to exclusive channels: <#channel-id>, <#channel-id>\n- Ability to change your nickname\n- Use external emojis in the server`
                )
                .setColor('#F47FFF')
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/e/ee/Internet_Relationship.svg/1200px-Internet_Relationship.svg.png'), // Booster perks image
            
            other_roles: new EmbedBuilder()
                .setTitle('Other Server Roles')
                .setDescription('These roles are assigned based on specific criteria or by staff.')
                .addFields(
                    {
                        name: '🎉 Staff Roles 🎉',
                        value: `
                            **${roles.admin || 'Admin'}** - Manages server settings and enforces rules.
                            **${roles.moderator || 'Moderator'}** - Assists with moderation and community management.
                            **${
								roles.traineeMod || 'Trainee Moderator'
							}** -  New moderators learning the ropes. 
                        `,
                        inline: true,
                    },
                    {
                        name: '✨ Special Roles ✨',
                        value: `
                            **${roles.ogMembers || 'OG Members'}** -  Early supporters of the server.
                            **${roles.subscriber || 'Subscriber'}** - Subscribers to our [YouTube/Titch/etc.]. 
                        `,
                        inline: true,
                    }
                )
                .setColor('#0099ff')
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/b/b6/Community_-_The_Noun_Project.svg/800px-Community_-_The_Noun_Project.svg.png'), // Other Roles image

            forms: new EmbedBuilder()
                .setTitle('📋 Important Forms 📋')
                .setDescription('Access important forms for applications and appeals.')
                .setColor('#00FFFF')
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/a/ac/White_check_mark_in_dark_green_circle.svg/512px-White_check_mark_in_dark_green_circle.svg.png') // Forms image
                .addFields(
                    {
                        name: 'Moderator Application',
                        value: 'Apply to join our moderation team!',
                        inline: true,
                    },
                    {
                        name: ' ',
                        value: '➡️ [Apply Here](https://forms.gle/SRTkYJqYM3xCjoLF7)',
                        inline: true,
                    },
					{
						name: '\n',
						value: `\n`,
						inline: true
					},
                    {
                        name: 'Ban/Mute Appeal',
                        value: 'Appeal a ban or mute if you believe it was unjust.',
                        inline: true,
                    },
                    {
                        name: ' ',
                        value: '➡️ [Appeal Here](https://forms.gle/9xtrkcTzEeTu6pmeA)',
                        inline: true,
                    },
					{
						name: '\n',
						value: `\n`,
						inline: true
					},
                ),

            rules: [
                new EmbedBuilder()
					.setTitle('Rule 1: No Spamming 🚫')
					.setDescription('Avoid excessive messaging and posting irrelevant content.')
					.addFields(
						{
							name: '> 1.1 Excessive Messages',
							value: 'Avoid sending a large number of messages in quick succession.',
						},
						{
							name: '> 1.2 Repetitive Content',
							value: 'Refrain from repeatedly posting the same message, emojis, or similar content.',
						},
						{
							name: '> 1.3 Irrelevant Content',
							value: "Keep your messages relevant to the channel's topic. Avoid derailing conversations.",
						},
						{
							name: '> 1.4 Mention Spam',
							value: 'Do not excessively tag (@mention) users or roles without a valid reason.',
						},
						{
							name: '> 1.5 Voice Channel Disruption',
							value: 'Refrain from making unnecessary noise or using soundboards that disrupt conversations in voice channels.',
						},
						{
							name: '> 1.6 Avoid Ghost Pinging',
							value: 'Ghost pinging (mentioning someone and then deleting the message) is disruptive and can be frustrating for other members. Try to avoid this behavior.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 2: Be Respectful 😀')
					.setDescription(
						'Treat all members with respect and avoid any form of harassment or discrimination.'
					)
					.addFields(
						{
							name: '> 2.1 Harassment and Bullying',
							value: 'Treat everyone with courtesy and respect. Harassment, bullying, and personal attacks will not be tolerated.',
						},
						{
							name: '> 2.2 Discrimination',
							value: 'Discrimination based on race, religion, gender, sexual orientation, or any other protected characteristic is strictly prohibited.',
						},
						{
							name: '> 2.3 Offensive Language',
							value: 'Avoid using slurs, hate speech, or other language that could be considered offensive or hurtful.',
						},
						{
							name: '> 2.4 Personal Information',
							value: "Do not share anyone's personal information without their explicit consent.",
						},
						{
							name: '> 2.5 Threatening Behavior',
							value: 'Threats of violence or harm are strictly forbidden and will be reported to Discord.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 3: No NSFW Content 🔞')
					.setDescription(
						'This server is intended for a general audience. Keep content and language appropriate.'
					)
					.addFields(
						{
							name: '> 3.1 Explicit Content',
							value: 'Do not post NSFW (Not Safe for Work) content, including sexually suggestive material, gore, or violence.',
						},
						{
							name: '> 3.2 NSFW Language',
							value: 'Keep your language appropriate for all ages. Avoid using explicit or suggestive terms.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 4: English Only 🇬🇧')
					.setDescription(
						'English is the primary language of this server to ensure clear communication.'
					)
					.addFields(
						{
							name: '> 4.1 Primary Language',
							value: 'To ensure effective communication and moderation, English is the primary language of this server.',
						},
						{
							name: '> 4.2 Language-Specific Channels',
							value: 'If you wish to communicate in another language, request a dedicated channel from the staff.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 5: No Politics or Religious Discussions 🏛️')
					.setDescription(
						'Avoid discussing politics and religion to maintain a respectful and neutral environment.'
					)
					.addFields(
						{
							name: '> 5.1 Sensitive Topics',
							value: 'Discussions about politics and religion can be divisive. To maintain a harmonious environment, please refrain from engaging in these topics.',
						},
						{
							name: '> 5.2 Respectful Disagreement',
							value: 'If these topics arise, please be respectful of differing viewpoints and avoid engaging in heated arguments.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 6: Appropriate Language 🗣️')
					.setDescription(
						'Be mindful of your language and avoid excessive profanity or hate speech.'
					)
					.addFields(
						{
							name: '> 6.1 Profanity',
							value: 'While some mild profanity might be acceptable, avoid excessive swearing or using offensive language.',
						},
						{
							name: '> 6.2 Hate Speech',
							value: 'Hate speech, derogatory terms, and slurs targeting any group or individual are strictly forbidden.',
						},
						{
							name: '> 6.3 Language Filters',
							value: 'Do not attempt to bypass any language filters or use creative spellings to circumvent the rules.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 7: Pingable Usernames 🏷️')
					.setDescription('Choose a username that can be easily mentioned by others.')
					.addFields(
						{
							name: '> 7.1 Easily Mentionable',
							value: 'Choose a username that can be easily pinged by other members.',
						},
						{
							name: '> 7.2 Avoid Disruptive Characters',
							value: 'Avoid using special characters, symbols, or excessive capitalization that make it difficult to mention your username.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 8: Use Channels Correctly 💬')
					.setDescription(
						'Post content in the appropriate channels to keep the server organized.'
					)
					.addFields(
						{
							name: '> 8.1 Channel Purpose',
							value: "Each channel has a specific purpose. Please post content relevant to the channel's topic.",
						},
						{
							name: '> 8.2 Off-Topic Discussions',
							value: 'For general or off-topic conversations, use designated channels such as <#your-general-chat-channel-id>.',
						},
						{
							name: '> 8.3 Channel Disruption',
							value: 'Avoid disrupting ongoing conversations with unrelated topics.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle('Rule 9: No Advertising 📢')
					.setDescription('Advertising without staff permission is prohibited.')
					.addFields(
						{
							name: '> 9.1 Unauthorized Advertising',
							value: 'Advertising other servers, websites, social media accounts, or personal projects is not permitted without explicit permission from the staff.',
						},
						{
							name: '> 9.2 Direct Message Advertising',
							value: 'Avoid sending unsolicited advertisements or promotional messages to other members.',
						}
					)
					.setColor('#FF0000'),

				new EmbedBuilder()
					.setTitle("Rule 10: Follow Discord's Community Guidelines 🌐")
					.setDescription(
						"Adhere to Discord's Community Guidelines to ensure a safe and positive experience for everyone."
					)
					.addFields(
						{
							name: "> 10.1 Discord's Rules",
							value: "In addition to our server rules, you must adhere to [Discord's Community Guidelines](https://discord.com/guidelines).",
						},
						{
							name: '> 10.2 Discord Consequences',
							value: "Violation of Discord's guidelines may result in actions against your account by Discord.",
						}
					)
					.setColor('#FF0000'),
			],

            self_roles: new EmbedBuilder()
                .setTitle('Customize Your Experience! 🎨')
                .setDescription(
                    `Assign yourself roles to personalize your experience and connect with others who share your interests! \n\n **How to get roles:**\n\n - Go to the <#channel-id-for-self-roles> channel.\n- React to the messages corresponding to the roles you want. \n\n **Example:** React with 😄 to get the "Funny" role!`
                )
                .setColor('#800080')
                .setThumbnail('https://upload.wikimedia.org/wikipedia/commons/thumb/6/68/Outline_black_on_transparent_background.svg/800px-Outline_black_on_transparent_background.svg.png'), // Self-roles image
        };
    },
}; 