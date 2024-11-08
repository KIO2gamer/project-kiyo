const { handleError } = require('../../bot_utils/errorHandler');
jest.mock('discord.js');

// In errorHandler.test.js
describe('Error Handler', () => {
  test('should handle standard errors', async () => {
    const mockInteraction = {
      editReply: jest.fn().mockResolvedValue({
        embeds: [{
          data: {
            title: 'An error occurred',
            description: 'Test error',
            color: expect.any(Number)
          }
        }]
      })
    };
    
    await handleError(mockInteraction, new Error('Test error'));
    expect(mockInteraction.editReply).toHaveBeenCalled();
    const reply = mockInteraction.editReply.mock.calls[0][0];
    expect(reply.embeds[0]).toMatchObject({
      data: {
        title: 'An error occurred',
        description: expect.any(String),
        color: expect.any(Number)
      }
    });
  });
});
