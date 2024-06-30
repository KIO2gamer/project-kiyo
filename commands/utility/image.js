// const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require("discord.js");

// module.exports = {
//     data: new SlashCommandBuilder()
//        .setName("image")
//        .setDescription("Posts an image.")
//        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers)
//        .addStringOption((option) =>
//             option
//                .setName("options")
//                .setDescription("Sends a image from the options")
//                .setRequired(true)
//                .addChoices(
//                     {
//                         name: "Welcome",
//                         value: "welcome",
//                     },
//                     {
//                         name: "Self Roles",
//                         value: "self_roles",
//                     },
//                     {
//                         name: "Rules",
//                         value: "rules",
//                     },
//                     {
//                         name: "Roles",
//                         value: "roles",
//                     },
//                     {
//                         name: "Forms",
//                         value: "forms",
//                     },
//                 )
//             ),
//     category: "Moderation",
//     async execute(interaction) {
//         const options = interaction.options.getString("options");

//         const errEmbed = new EmbedBuilder()
//         .setTitle("Error")

//         try {
//             if (options === "welcome") {
//                 await interaction.channel.send({ files: ['./assets/headers/welcome-header.png'] });
//             } else if (options === "self_roles") {
//                 await interaction.channel.send({ files: ['./assets/headers/self-roles-header.png'] });
//             } else if (options === "rules") {
//                 await interaction.channel.send({ files: ['./assets/headers/rule-header.png'] });
//             } else if (options === "roles") {
//                 await interaction.channel.send({ files: ['./assets/headers/role-header.png'] });
//             } else if (options === "forms") {
//                 await interaction.channel.send({ files: ['./assets/headers/forms-header.png'] });
//             }
//             else {
//                 await interaction.reply("There is no such option available");
//             }

//         } catch (error) {
//             errEmbed.setColor("RED").setDescription(error);
//         }
//     }
// }

const { SlashCommandBuilder, PermissionFlagsBits } = require("discord.js");

module.exports = {
	data: new SlashCommandBuilder()
		.setName("image")
		.setDescription("Posts an image.")
		.setDefaultMemberPermissions(
			PermissionFlagsBits.BanMembers | PermissionFlagsBits.KickMembers,
		)
		.addStringOption((option) =>
			option
				.setName("options")
				.setDescription("Select an image to send")
				.setRequired(true)
				.addChoices(
					{ name: "Welcome", value: "welcome" },
					{ name: "Self Roles", value: "self_roles" },
					{ name: "Rules", value: "rules" },
					{ name: "Roles", value: "roles" },
					{ name: "Forms", value: "forms" },
				),
		)
		.addStringOption((option) =>
			option
				.setName("caption")
				.setDescription("Add a caption to the image")
				.setRequired(false),
		),
	category: "utility",
	async execute(interaction) {
		const options = interaction.options.getString("options");
		const caption = interaction.options.getString("caption") || null;

		const imagePaths = {
			welcome: "./assets/headers/welcome-header.png",
			self_roles: "./assets/headers/self-roles-header.png",
			rules: "./assets/headers/rule-header.png",
			roles: "./assets/headers/role-header.png",
			forms: "./assets/headers/forms-header.png",
		};

		try {
			if (options in imagePaths) {
				await interaction.channel.send({
					content: caption,
					files: [imagePaths[options]],
				});
				console.log(
					`Image posted by ${interaction.user.tag}: ${options}`,
				);
				await interaction.reply({
					content: `Image successfully posted: ${options}`,
					ephemeral: true,
				});
			} else {
				await interaction.reply({
					content: "There is no such option available",
					ephemeral: true,
				});
			}
		} catch (error) {
			console.error("Error posting image:", error);
			await interaction.reply({
				content: `An error occurred: ${error.message}`,
				ephemeral: true,
			});
		}
	},
};
