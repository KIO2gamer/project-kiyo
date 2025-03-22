const mongoose = require("mongoose");

const custom_commands_schema = new mongoose.Schema({
    name: String,
    message: String,
    alias_name: String,
});

module.exports = mongoose.model("custom_commands", custom_commands_schema);
