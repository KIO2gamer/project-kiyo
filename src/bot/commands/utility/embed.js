const { SlashCommandBuilder, EmbedBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Creates a customizable embed message.")
    .addStringOption((option) =>
      option
        .setName("title")
        .setDescription("The title of the embed")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("description")
        .setDescription("The description of the embed")
        .setRequired(true),
    )
    .addStringOption((option) =>
      option
        .setName("color")
        .setDescription("The color of the embed in HEX (e.g., #FF5733)")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("footer")
        .setDescription("The footer text of the embed")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("thumbnail")
        .setDescription("The URL of the thumbnail image")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("author")
        .setDescription("The author of the embed")
        .setRequired(false),
    )
    .addStringOption((option) =>
      option
        .setName("image")
        .setDescription("The URL of the image")
        .setRequired(false),
    )
    .addBooleanOption((option) =>
      option
        .setName("timestamp")
        .setDescription("Whether to include a timestamp")
        .setRequired(false),
    ),
  async execute(interaction) {
    const title = interaction.options.getString("title");
    const description = interaction.options.getString("description");
    const color = interaction.options.getString("color") || "#0099ff";
    const footer = interaction.options.getString("footer");
    const thumbnail = interaction.options.getString("thumbnail");
    const author = interaction.options.getString("author");
    const image = interaction.options.getString("image");
    const timestamp = interaction.options.getBoolean("timestamp");

    const embed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(description)
      .setColor(color);

    if (footer) {
      embed.setFooter({ text: footer });
    }

    if (thumbnail) {
      embed.setThumbnail(thumbnail);
    }

    if (author) {
      embed.setAuthor({ name: author });
    }

    if (image) {
      embed.setImage(image);
    }

    if (timestamp) {
      embed.setTimestamp();
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
