const client = require('../src/bot/client');

exports.getAllCommands = (req, res) => {
  try {
    const commands = Array.from(client.commands.values()).map(cmd => ({
      name: cmd.name || cmd.data?.name,
      description: cmd.description || cmd.data?.description,
      category: cmd.category,
      usage: cmd.usage,
      examples: cmd.examples
    }));
    
    res.json({ commands });
  } catch (error) {
    console.error('Error fetching commands:', error);
    res.status(500).json({ error: 'Failed to fetch commands' });
  }
};

exports.getCommandsByCategory = (req, res) => {
  try {
    const { category } = req.params;
    const commands = Array.from(client.commands.values())
      .filter(cmd => cmd.category === category)
      .map(cmd => ({
        name: cmd.name || cmd.data?.name,
        description: cmd.description || cmd.data?.description,
        usage: cmd.usage,
        examples: cmd.examples
      }));
    
    res.json({ commands });
  } catch (error) {
    console.error(`Error fetching ${req.params.category} commands:`, error);
    res.status(500).json({ error: 'Failed to fetch commands by category' });
  }
};

exports.executeCommand = async (req, res) => {
  // This would require careful implementation to execute commands programmatically
  // For now, return a not implemented response
  res.status(501).json({ error: 'Command execution via API not implemented' });
};
