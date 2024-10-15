const Reminder = require('./../bot_utils/reminderStorage');
const { Events } = require('discord.js');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        // Fetch all pending reminders from MongoDB
        const pendingReminders = await Reminder.find({
            reminderTime: { $gt: new Date() },
        });

        pendingReminders.forEach(async (reminder) => {
            const timeLeft =
                new Date(reminder.reminderTime).getTime() - Date.now();

            // If the reminder time is still in the future, schedule it
            if (timeLeft > 0) {
                setTimeout(async () => {
                    const channel = await client.channels.fetch(
                        reminder.channelId,
                    );
                    await channel.send(
                        `⏰ <@${reminder.userId}> Reminder: ${reminder.reminderMessage}`,
                    );

                    // After sending the reminder, delete it from the database
                    await Reminder.findByIdAndDelete(reminder._id);
                }, timeLeft);
            } else {
                // If the time has passed while the bot was offline, send it immediately
                const channel = await client.channels.fetch(reminder.channelId);
                await channel.send(
                    `⏰ <@${reminder.userId}> Reminder: ${reminder.reminderMessage}`,
                );

                // Delete the reminder from the database after sending
                await Reminder.findByIdAndDelete(reminder._id);
            }
        });
    },
};
