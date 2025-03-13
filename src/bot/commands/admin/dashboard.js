const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const { handleError } = require('../../utils/errorHandler');
const dashboardConfig = require('../../../database/dashboardConfig');
const crypto = require('crypto');

module.exports = {
    description_full: 'Set up or manage a web dashboard for your Discord server using MERN stack integration.',
    usage: '/dashboard <action>',
    examples: ['/dashboard setup', '/dashboard info', '/dashboard reset'],
    category: 'utility',
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Manage the MERN stack web dashboard for this server')
        .addSubcommand(subcommand =>
            subcommand
                .setName('setup')
                .setDescription('Set up a new web dashboard for this server')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('info')
                .setDescription('View information about your server\'s dashboard')
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Reset dashboard configuration and access tokens')
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        await interaction.deferReply();
        const subcommand = interaction.options.getSubcommand();

        try {
            switch (subcommand) {
                case 'setup':
                    await setupDashboard(interaction);
                    break;
                case 'info':
                    await getDashboardInfo(interaction);
                    break;
                case 'reset':
                    await resetDashboard(interaction);
                    break;
            }
        } catch (error) {
            await handleError(
                interaction, 
                error, 
                'COMMAND_EXECUTION', 
                'An error occurred while managing the dashboard.'
            );
        }
    }
};

async function setupDashboard(interaction) {
    // Check if dashboard already exists
    let config = await dashboardConfig.findOne({ guildId: interaction.guild.id });
    
    if (config) {
        const embed = new EmbedBuilder()
            .setTitle('Dashboard Already Exists')
            .setDescription('This server already has a dashboard configured.')
            .setColor('#FFA500')
            .addFields(
                { name: '🔗 Dashboard URL', value: `${process.env.DASHBOARD_BASE_URL}/server/${config.dashboardId}` }
            )
            .setFooter({ text: 'Use /dashboard reset to reconfigure the dashboard' });
            
        return await interaction.editReply({ embeds: [embed] });
    }
    
    // Generate unique dashboard ID and access token
    const dashboardId = crypto.randomBytes(16).toString('hex');
    const accessToken = crypto.randomBytes(32).toString('hex');
    
    // Save to database
    config = new dashboardConfig({
        guildId: interaction.guild.id,
        dashboardId: dashboardId,
        accessToken: accessToken,
        createdAt: new Date(),
        createdBy: interaction.user.id
    });
    
    await config.save();
    
    // Create dashboard URL
    const dashboardUrl = `${process.env.DASHBOARD_BASE_URL}/server/${dashboardId}`;
    
    const embed = new EmbedBuilder()
        .setTitle('🌐 Dashboard Created Successfully')
        .setDescription('Your server dashboard has been set up with the MERN stack integration!')
        .setColor('#00FF00')
        .addFields(
            { name: '🔗 Dashboard URL', value: dashboardUrl },
            { name: '🔑 Access Token', value: `\`${accessToken}\`` },
            { name: '⚠️ Security Warning', value: 'Keep your access token secret! Anyone with this token can access your server\'s dashboard.' }
        )
        .setFooter({ text: 'Dashboard powered by MongoDB, Express, React, and Node.js' });
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Open Dashboard')
                .setStyle(ButtonStyle.Link)
                .setURL(dashboardUrl)
        );
        
    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function getDashboardInfo(interaction) {
    const config = await dashboardConfig.findOne({ guildId: interaction.guild.id });
    
    if (!config) {
        const embed = new EmbedBuilder()
            .setTitle('No Dashboard Found')
            .setDescription('This server doesn\'t have a dashboard configured yet.')
            .setColor('#FF0000')
            .addFields(
                { name: '💡 Setup', value: 'Use `/dashboard setup` to create a new dashboard' }
            );
            
        return await interaction.editReply({ embeds: [embed] });
    }
    
    const createdTime = Math.floor(new Date(config.createdAt).getTime() / 1000);
    const creator = await interaction.client.users.fetch(config.createdBy).catch(() => null);
    
    const embed = new EmbedBuilder()
        .setTitle('🌐 Dashboard Information')
        .setColor('#0099FF')
        .addFields(
            { name: '🔗 Dashboard URL', value: `${process.env.DASHBOARD_BASE_URL}/server/${config.dashboardId}` },
            { name: '📊 Statistics Available', value: 'Member counts, command usage, server activity' },
            { name: '⚙️ Features', value: 'Command management, role configuration, welcome messages' },
            { name: '🧰 Technologies', value: '**M**ongoDB - Database\n**E**xpress - API Server\n**R**eact - Frontend\n**N**ode.js - Backend Runtime' },
            { name: '🕰️ Created', value: `<t:${createdTime}:F> (<t:${createdTime}:R>)` },
            { name: '👤 Created By', value: creator ? creator.tag : 'Unknown User' }
        )
        .setFooter({ text: 'Dashboard powered by MERN stack' });
    
    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setLabel('Open Dashboard')
                .setStyle(ButtonStyle.Link)
                .setURL(`${process.env.DASHBOARD_BASE_URL}/server/${config.dashboardId}`)
        );
        
    await interaction.editReply({ embeds: [embed], components: [row] });
}

async function resetDashboard(interaction) {
    const config = await dashboardConfig.findOne({ guildId: interaction.guild.id });
    
    if (!config) {
        const embed = new EmbedBuilder()
            .setTitle('No Dashboard Found')
            .setDescription('This server doesn\'t have a dashboard configured yet.')
            .setColor('#FF0000');
            
        return await interaction.editReply({ embeds: [embed] });
    }
    
    await dashboardConfig.findOneAndDelete({ guildId: interaction.guild.id });
    
    const embed = new EmbedBuilder()
        .setTitle('Dashboard Reset')
        .setDescription('Your dashboard configuration has been reset successfully.')
        .setColor('#FFA500')
        .addFields(
            { name: '🔄 Next Steps', value: 'Use `/dashboard setup` to create a new dashboard' }
        );
        
    await interaction.editReply({ embeds: [embed] });
}