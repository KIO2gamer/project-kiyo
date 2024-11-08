const customAdd = require('../../../commands/customs/customAdd');
const CustomCommand = require('../../../bot_utils/customCommands');
jest.mock('discord.js');

jest.mock('../../../bot_utils/customCommands', () => {
    return jest.fn((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(undefined),
    }));
});

// In customAdd.test.js
describe('customAdd Command', () => {
  test('should handle error when saving fails', async () => {
    const mockInteraction = {
      editReply: jest.fn().mockResolvedValue({
        embeds: [{
          data: {
            title: 'An error occurred',
            description: 'Database error',
            color: expect.any(Number)
          }
        }]
      })
    };
    
    await execute(mockInteraction); // Your command's execute function
    expect(mockInteraction.editReply).toHaveBeenCalled();
    const reply = mockInteraction.editReply.mock.calls[0][0];
    expect(reply.embeds[0]).toMatchObject({
      data: {
        title: 'An error occurred',
        description: expect.any(String)
      }
    });
  });
});
