const Reminder = require('./../../database/reminderStorage');
const { Events } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  /**
   * Executes the reminder check process.
   *
   * Fetches all pending reminders from MongoDB and schedules them to be sent at the appropriate time.
   * If the reminder time has already passed while the bot was offline, sends the reminder immediately.
   * After sending a reminder, it deletes the reminder from the database.
   *
   * @param {Object} client - The Discord client instance.
   * @returns {Promise<void>} - A promise that resolves when the reminder check process is complete.
   */
  async execute(client) {
    // Fetch all pending reminders from MongoDB
    const pendingReminders = await Reminder.find({
      reminderTime: { $gt: new Date() },
    });

    pendingReminders.forEach(async (reminder) => {
      const timeLeft = new Date(reminder.reminderTime).getTime() - Date.now();

      // If the reminder time is still in the future, schedule it
      if (timeLeft > 0) {
        setTimeout(async () => {
          const channel = await client.channels.fetch(reminder.channelId);
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
