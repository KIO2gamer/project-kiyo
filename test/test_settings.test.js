const { Client, GatewayIntentBits } = require('discord.js');
const assert = require('assert');

describe('Discord Bot Workflow', function () {
    this.timeout(10000); // Set timeout to 10 seconds for the test suite

    let client;
    const TIMEOUT = process.env.WORKFLOW_TIMEOUT || 5;

    // Function to display a boxed, colorful message
    const printMessage = (message, type = 'info') => {
        const chalk = require('chalk');
        const boxen = require('boxen');
        const colors = {
            info: chalk.blueBright,
            success: chalk.greenBright,
            error: chalk.redBright,
            warning: chalk.yellowBright,
        };

        console.log(
            boxen(colors[type](message), {
                padding: 1,
                margin: 1,
                borderColor: 'yellow',
                borderStyle: 'round',
                align: 'center',
            }),
        );
    };

    before(async () => {
        client = new Client({
            intents: [GatewayIntentBits.Guilds],
        });

        client.once('ready', () => {
            printMessage('✅ Bot is online for workflow check!', 'success');
        });

        await client.login(process.env.DISCORD_TOKEN);
    });

    after((done) => {
        printMessage(
            `🕒 Exiting workflow bot after ${TIMEOUT} seconds`,
            'info',
        );
        setTimeout(() => {
            client.destroy();
            done();
        }, TIMEOUT * 1000);
    });

    it('should login successfully', (done) => {
        client.once('ready', () => {
            printMessage('🔐 Login successful!', 'success');
            assert(client.user !== null, 'Client user should not be null');
            done();
        });

        client.once('error', (error) => {
            printMessage(`❌ Login failed: ${error.message}`, 'error');
            done(error);
        });
    });

    it('should handle SIGINT gracefully', (done) => {
        process.once('SIGINT', () => {
            printMessage(
                '⚠️ Workflow bot interrupted (SIGINT). Shutting down...',
                'warning',
            );
            client.destroy();
            done();
        });

        process.kill(process.pid, 'SIGINT');
    });

    it('should handle SIGTERM gracefully', (done) => {
        process.once('SIGTERM', () => {
            printMessage(
                '⚠️ Workflow bot terminated (SIGTERM). Shutting down...',
                'warning',
            );
            client.destroy();
            done();
        });

        process.kill(process.pid, 'SIGTERM');
    });
});
