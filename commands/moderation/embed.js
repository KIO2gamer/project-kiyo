const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Posts an embed.')
        .addStringOption(option =>
            option
                .setName('text')
                .setDescription('sends a embed text')
                .setRequired(true)
                .addChoices(
                    {
                        name: 'Welcome',
                        value: 'welcome',
                    },
                    {
                        name: 'Rank Roles',
                        value: 'role_ranks',
                    },
                    {
                        name: 'Booster Role',
                        value: 'role_booster',
                    },
                    {
                        name: 'Other Roles',
                        value: 'role_others',
                    },
                    {
                        name: 'All Roles Info',
                        value: 'role_all',
                    },
                    {
                        name: 'Forms',
                        value: 'forms',
                    },
                    {
                        name: 'Rules',
                        value: 'rules',
                    },
                    {
                        name: 'Own Roles',
                        value: 'own_roles',
                    }
                )
        )
        .setDefaultMemberPermissions(
            PermissionFlagsBits.BanMembers || PermissionFlagsBits.KickMembers
        ),
    category: 'moderation',

    async execute(interaction) {
        const textChosen = interaction.options.getString('text');

        // rank roles
        const wood = interaction.guild.roles.cache.find(role => role.name === 'Wood (5+)');
        const coal = interaction.guild.roles.cache.find(role => role.name === 'Coal (10+)');
        const iron = interaction.guild.roles.cache.find(role => role.name === 'Iron (15+)');
        const bronze = interaction.guild.roles.cache.find(role => role.name === 'Bronze (20+)');
        const gold = interaction.guild.roles.cache.find(role => role.name === 'Gold (30+)');
        const platinum = interaction.guild.roles.cache.find(role => role.name === 'Platinum (40+)');
        const diamond = interaction.guild.roles.cache.find(role => role.name === 'Diamond (50+)');
        const sapphire = interaction.guild.roles.cache.find(role => role.name === 'Sapphire (55+)');
        const amethyst = interaction.guild.roles.cache.find(role => role.name === 'Amethyst (60+)');
        const netherite = interaction.guild.roles.cache.find(
            role => role.name === 'Netherite (70+)'
        );
        const ruby = interaction.guild.roles.cache.find(role => role.name === 'Ruby (80+)');
        const emerald = interaction.guild.roles.cache.find(role => role.name === 'Emerald (90+)');
        const opal = interaction.guild.roles.cache.find(role => role.name === 'Opal (95+)');
        const god_grinder = interaction.guild.roles.cache.find(
            role => role.name === 'God Grinder (100+)'
        );

        // other roles
        const og_members = interaction.guild.roles.cache.find(role => role.name === 'OG members');
        const Subscriber = interaction.guild.roles.cache.find(role => role.name === 'Subscriber');
        const admin = interaction.guild.roles.cache.find(role => role.name === 'Admin');
        const staffs = interaction.guild.roles.cache.find(role => role.name === 'Staffs');
        const moderator = interaction.guild.roles.cache.find(role => role.name === 'Moderator');
        const traineemod = interaction.guild.roles.cache.find(
            role => role.name === 'Trainee Moderator'
        );
        const owner = interaction.guild.roles.cache.find(role => role.name === 'Owner');
        const coowner = interaction.guild.roles.cache.find(role => role.name === 'Co-Owner');
        const chat_revive_ping = interaction.guild.roles.cache.find(
            role => role.name === 'Chat Revive Ping'
        );

        const welcomeEmbed = new EmbedBuilder()
            .setTitle(`Welcome to The KIO2gamer Official Discord (TKOD) Server`)
            .setDescription(
                `**Welcome new members to the amazing server of The KIO2gamer Official Discord (TKOD) Server. We are a friendly community and we will always try to help you. Below are some of the important things you need to explore first as a new member. We hope you enjoy your stay here!**
                <:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649><:line:1221277678393622649>
                
                **Important Links to navigate through the server:**
                - [Server Rules](https://discord.com/channels/935017969271054346/938309117771149342)\n- Support Channels\n - [Public](https://discord.com/channels/935017969271054346/950302591504498718)\n - [Private](https://discord.com/channels/935017969271054346/1170620573613826068)\n- [Server Invite](https://discord.gg/3uDPm9NV4X)
                `
            )
            .setColor('Purple');

        const roleRanksEmbed = new EmbedBuilder()
            .setTitle('**Level Roles**')
            .setDescription(
                `Talking in the server will allow you to gain xp. The more you earn xp, the higher level you unlock and the better perks you will get. Every minute, you earn **35-70 XP** by chatting in the server.`
            )
            .addFields(
                {
                    name: `--------------------------------- No Rank Perks ---------------------------------`,
                    value: `\n`,
                },
                {
                    name: `\n`,
                    value: `- ${wood}`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${coal}`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${iron}`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${amethyst}`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${ruby}`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${opal}`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${god_grinder}`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `\n`,
                },
                {
                    name: `------------------------------ Available Rank Perks ------------------------------`,
                    value: `\n`,
                },
                {
                    name: `\n`,
                    value: `- ${bronze} \n - Permission to change your username.`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${gold} \n - Get access to <#950318340889518150> and <#950318103739400202>`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${platinum} \n - Get image permissions in <#1239619089425764362>`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${diamond} \n - Get link permissions in <#1239619089425764362>`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${sapphire} \n - Get access to use other emojis in the server.`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${netherite} \n - Get a custom role in the server (Open a ticket in <#1170620573613826068>)`,
                    inline: true,
                },
                {
                    name: `\n`,
                    value: `- ${emerald} \n - Get a custom role icon in the server (Open a ticket in <#1170620573613826068>)`,
                    inline: true,
                }
            )
            .setColor('Purple');

        const roleBoosterEmbed = new EmbedBuilder()
            .setTitle(`Server Booster's Perks`)
            .setDescription(
                `You will get <@&951975588724363275> role, access to <#950318340889518150>, <#950318103739400202>, ability to change your nickname and use other emojis in the server.`
            )
            .setColor('Purple');

        const roleOthersEmbed = new EmbedBuilder()
            .setTitle('Miscellaneous Roles Information')
            .setDescription(
                'Below are the roles which are given to specific members under specific conditions.'
            )
            .addFields(
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '\n',
                    value: `We have three types of ${staffs} members in this server.`,
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: `\n`,
                    value: `> ${admin} - These are the highest possible staff members in this server. They have the permissions to alter the server's settings. This role can only be given to those picked by the server owner.`,
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '\n',
                    value: `> ${moderator} - These are the staff members who have a great experience in moderating the server, You can get it if you get promoted from ${traineemod}`,
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '\n',
                    value: `> ${traineemod} - These are second type of staff members who just joined the team but needs more experience in the server. You can get it if you get accepted in the Moderator Applications.`,
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '\n',
                    value: `${og_members} - These members are the ones who first joined this server when it was created. You can't get this role anymore.`,
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '\n',
                    value: `${Subscriber} - These members have subscribed to [KIO2gamer](https://www.youtube.com/@kio2gamer). You can get this role in <#1180862022099947531>`,
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '\n',
                    value: `${chat_revive_ping} - Pings you at random to keep server active.`,
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: `\n`,
                    value: `${owner} is <@764513584125444146>
                    ${coowner} is <@787259868049571842>
                    We are the founders of this server.`,
                }
            )
            .setColor('Purple');

        const modFormsEmbed = new EmbedBuilder()
            .setTitle('To apply for moderator of this server')
            .setDescription(
                '> Go to [Moderator Applications](https://forms.gle/GJMUUiSjLPuiLvmA9) and fill up the form.'
            )
            .setColor('Purple');

        const banmuteFormsEmbed = new EmbedBuilder()
            .setTitle('To appeal for your ban/mute punishments')
            .setDescription(
                '> Go to [Ban / Mute Appeal Form](https://forms.gle/6M5wgndJj6r3W7KD8) and fill it up.'
            )
            .setColor('Purple');

        const rulesEmbed = new EmbedBuilder()
            .setTitle('Rules for The Official KIO2gamer Discord Server (TOKD)')
            .setDescription(
                `<@&944618320232075284> must abide server's rules. Failing to do so can lead to warn, mute, kick, or even ban. Any attempts of bypassing, exploiting etc. towards the server will get you instantly banned and reported.`
            )
            .addFields(
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 1 - No Spamming**',
                    value: '> This includes obnoxious noises in voice, @mention spam, character spam, image spam, and interaction spam.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 2 - No unnecessary explicit content**',
                    value: '> This includes NSFW, 18+, sexual and offensive content which makes the members uncomfortable to see.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 3 - No harassment**',
                    value: '> This includes any form of harassment or encouraging of harassment.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 4 - No talking in other languages**',
                    value: `> Please type only in intelligible English in our server as we are unable to moderate other languages consistently throughout the day.`,
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 5 - No politics or any religious discussion**',
                    value: '> Please refrain from talking about the politics and any religious support in the chas it will become chaotic and nearly impossible to moderate.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 6 - No inappropriate language or bypassing them**',
                    value: '> Even though we have set up AutoMod to delete any inappropriate language, You should not bypass them. Failing to do so might lead to a mute or in higher degrees, ban. This includes swearing, trash talking, etc. Refrain from directing it another member unsuspectingly.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 7 - Username should be pingable**',
                    value: '> Please do not use special characters or unicodes in your username as you might be pinged for something.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 8 - Use the channels correctly**',
                    value: '> Please use the channels in the correct places to avoid disturbance in the chat. For out of context discussions, please refer to the https://discord.com/channels/935017969271054346/1237018886843400243 channel.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: '**Rule 9 - No ghost pinging**',
                    value: '> Please refrain from ghost pinging members as they are quite annoying and waste others valuable time.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: `**Rule 10 - No advertising**`,
                    value: '> Please do not advertise anything in our server. This includes websites, social media, etc. Same applies to DM-advertising.',
                },
                {
                    name: `\n`,
                    value: '\n',
                },
                {
                    name: "**Rule 11 - Follow Discord's community guidelines.**",
                    value: '> <https://discord.com/guidelines>',
                }
            )
            .setColor('Purple');

        const ownRolesEmbed_Subscriber = new EmbedBuilder()
            .setTitle('Are you subscribed to KIO2gamer ?')
            .setDescription(
                `If you are subscribed, click the green button to get access to <#1237247763910234132> and <#1237247979103064145>`
            )
            .setColor('Purple');

        const ownRolesEmbed_Location = new EmbedBuilder()
            .setTitle('Where are you from?')
            .setDescription(
                `Choosing this role can often help people know when you may be most active on this server.`
            )
            .setColor('Purple');

        const ownRolesEmbed_Gender = new EmbedBuilder()
            .setTitle('What is your gender?')
            .setDescription(
                `You may use Discord's new \`Pronouns Textbox\` or either take from one of these roles. It helps to identify who you truly are and use your pronouns carefully without triggering everyone. We treat every community the same respect in this server.`
            )
            .setColor('Purple');

        const ownRolesEmbed_Platform = new EmbedBuilder()
            .setTitle('What is your platform?')
            .setDescription(
                `Perfect roles for those who might be searching for someone who might have the same platform to play, watch and enjoy together.`
            )
            .setColor('Purple');

        const ownRolesEmbed_Hobby = new EmbedBuilder()
            .setTitle('What is your hobby?')
            .setDescription(
                `This role is perfect for those who are looking for someone who is into the same hobby as you.`
            )
            .setColor('Purple');

        try {
            if (textChosen === 'welcome') {
                return interaction.channel.send({
                    embeds: [welcomeEmbed],
                });
            } else if (textChosen === 'rules') {
                return interaction.channel.send({
                    embeds: [rulesEmbed],
                });
            } else if (textChosen === 'role_ranks') {
                return interaction.channel.send({
                    embeds: [roleRanksEmbed],
                });
            } else if (textChosen === 'role_booster') {
                return interaction.channel.send({
                    embeds: [roleBoosterEmbed],
                });
            } else if (textChosen === 'role_others') {
                return interaction.channel.send({
                    embeds: [roleOthersEmbed],
                });
            } else if (textChosen === 'role_all') {
                return interaction.channel.send({
                    embeds: [roleRanksEmbed, roleBoosterEmbed, roleOthersEmbed],
                });
            } else if (textChosen === 'forms') {
                return interaction.channel.send({
                    embeds: [modFormsEmbed, banmuteFormsEmbed],
                });
            } else if (textChosen === 'own_roles') {
                return (
                    interaction.channel.send({
                        embeds: [ownRolesEmbed_Subscriber],
                    }) &&
                    interaction.channel.send({
                        embeds: [ownRolesEmbed_Location],
                    }) &&
                    interaction.channel.send({
                        embeds: [ownRolesEmbed_Gender],
                    }) &&
                    interaction.channel.send({
                        embeds: [ownRolesEmbed_Hobby],
                    }) &&
                    interaction.channel.send({
                        embeds: [ownRolesEmbed_Platform],
                    })
                );
            }
        } catch (error) {
            const errEmbed = new EmbedBuilder();
            errEmbed.setColor('RED').setDescription(error);
        }
    },
};
