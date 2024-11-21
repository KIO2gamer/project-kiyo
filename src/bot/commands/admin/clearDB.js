const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const mongoose = require('mongoose');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('clear_db')
		.setDescription('⚠️ DANGER: Wipes all database contents. Admin only.')
		.setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
	description_full:
		'Completely wipes all collections and data from the connected MongoDB database. This action is irreversible and should be used with extreme caution. Only server administrators can use this command.',
	usage: '/clear_db',
	examples: ['/clear_db'],
	category: 'admin',

	/**
	 * Executes the clear database command.
	 *
	 * @param {Object} interaction - The interaction object from Discord.
	 * @param {Object} interaction.member - The member object of the user who initiated the interaction.
	 * @param {Object} interaction.member.permissions - The permissions object of the member.
	 * @param {Object} interaction.user - The user object of the member who initiated the interaction.
	 * @param {Object} interaction.channel - The channel object where the interaction was initiated.
	 * @param {Function} interaction.editReply - Function to edit the initial reply of the interaction.
	 * @param {Function} interaction.followUp - Function to send a follow-up message to the interaction.
	 *
	 * @returns {Promise<void>} - A promise that resolves when the command execution is complete.
	 *
	 * @description
	 * This command checks if the user has the Administrator permission. If not, it sends an error message.
	 * If the user has the required permission, it sends a warning message and waits for the user to type `CONFIRM`.
	 * If the user confirms, it deletes all collections in the MongoDB database.
	 * If an error occurs during the process, it sends an appropriate error message.
	 */
	async execute(interaction) {
		// Check if user has the highest admin role
		if (
			!interaction.member.permissions.has(
				PermissionFlagsBits.Administrator,
			)
		) {
			return interaction.editReply({
				content: '❌ You do not have permission to use this command.',
				ephemeral: true,
			});
		}

		// Initial warning message
		await interaction.editReply({
			content:
				'⚠️ **DANGER**: This will permanently delete ALL data in the database. Are you absolutely sure?\nType `CONFIRM` to proceed.',
			ephemeral: true,
		});

		try {
			// Create message collector for confirmation
			const filter = m => m.author.id === interaction.user.id;
			const collector = interaction.channel.createMessageCollector({
				filter,
				time: 30000,
				max: 1,
			});

			collector.on('collect', async message => {
				if (message.content === 'CONFIRM') {
					try {
						// Get all collections
						const collections =
							await mongoose.connection.db.collections();

						// Drop each collection
						for (let collection of collections) {
							await collection.drop();
						}

						await message.editReply(
							'✅ Database has been completely wiped.',
						);
					} catch (error) {
						console.error('Database clear error:', error);
						await message.editReply(
							'❌ An error occurred while clearing the database.',
						);
					}
				} else {
					await message.editReply('❌ Database wipe cancelled.');
				}
				message.delete().catch(() => {});
			});

			collector.on('end', collected => {
				if (collected.size === 0) {
					interaction.followUp({
						content:
							'❌ Command timed out. Database wipe cancelled.',
						ephemeral: true,
					});
				}
			});
		} catch (error) {
			console.error('Command error:', error);
			await interaction.followUp({
				content: '❌ An error occurred while executing the command.',
				ephemeral: true,
			});
		}
	},
};
