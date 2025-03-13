const api = require('./api');

exports.getAllCommands = async () => {
  const response = await api.get('/api/commands');
  return response.data.commands;
};

exports.getCommandsByCategory = async (category) => {
  const response = await api.get(`/api/commands/${category}`);
  return response.data.commands;
};
