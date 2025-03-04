const mongoose = require('mongoose');
const CustomCommand = require('../../src/database/customCommands');

exports.handler = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const commands = await CustomCommand.find().lean();
        return {
            statusCode: 200,
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(commands)
        };
    } catch (error) {
        console.error('Error fetching commands:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: 'Failed to retrieve commands' })
        };
    }
};