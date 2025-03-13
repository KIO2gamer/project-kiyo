const api = require('./api');

exports.getServers = async () => {
  const response = await api.get('/api/servers');
  return response.data.guilds;
};

exports.getServerById = async (serverId) => {
  const response = await api.get(`/api/servers/${serverId}`);
  return response.data.guild;
};

exports.getServerStats = async (serverId, timeframe = '7d') => {
  const response = await api.get(`/api/servers/${serverId}/stats?timeframe=${timeframe}`);
  return response.data.stats;
};
