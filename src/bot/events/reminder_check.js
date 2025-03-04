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
		try {
			// Fetch all pending reminders from MongoDB
			const pendingReminders = await Reminder.find();

			for (const reminder of pendingReminders) {
				const timeLeft =
					new Date(reminder.reminderTime).getTime() - Date.now();

				// Function to send the reminder
				const sendReminder = async () => {
					try {
						const channel = await client.channels.fetch(
							reminder.channelId,
						);
						if (!channel) {
							// If the channel doesn't exist, delete the reminder
							await Reminder.findByIdAndDelete(reminder._id);
							return;
						}
						await channel.send(
							`⏰ <@${reminder.userId}> Reminder: ${reminder.reminderMessage}`,
						);
						// After sending the reminder, delete it from the database
						await Reminder.findByIdAndDelete(reminder._id);
					} catch (error) {
						handleError(`Error sending reminder: ${error.message}`);
						// Optionally, update the reminder status to 'failed'
						await Reminder.findByIdAndUpdate(reminder._id, {
							status: 'failed',
						});
					}
				};

				if (timeLeft > 0) {
					// Schedule the reminder
					setTimeout(sendReminder, timeLeft);
				} else {
					// If the time has passed while the bot was offline, send it immediately
					await sendReminder();
				}
			}
		} catch (error) {
			handleError(`Error in reminder check: ${error.message}`);
		}
	},
};
