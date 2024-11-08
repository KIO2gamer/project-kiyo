jest.mock('discord.js');

jest.mock('../../../bot_utils/customCommands', () => ({
    find: jest.fn(() => ({
        sort: jest.fn(),
    })),
}));

// In customList.test.js
describe('customList Command', () => {
  test('should display empty message when no commands exist', async () => {
    // Mock the database or data source to return empty array
    const mockData = [];
    // Mock your database access method
    jest.spyOn(customListModule, 'getCustomCommands').mockResolvedValue(mockData);
    
    const mockInteraction = {
      editReply: jest.fn().mockResolvedValue({
        embeds: [{
          data: {
            title: 'Custom Commands',
            description: 'No custom commands found.',
            color: expect.any(Number)
          }
        }]
      })
    };
    
    await execute(mockInteraction);
    expect(mockInteraction.editReply).toHaveBeenCalled();
    const reply = mockInteraction.editReply.mock.calls[0][0];
    expect(reply.embeds[0]).toMatchObject({
      data: {
        title: 'Custom Commands',
        description: 'No custom commands found.'
      }
    });
  });
});