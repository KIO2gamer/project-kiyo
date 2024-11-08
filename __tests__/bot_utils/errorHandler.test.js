const { handleError } = require('../../bot_utils/errorHandler');
jest.mock('discord.js');

describe('Error Handler', () => {
    let mockInteraction;

    beforeEach(() => {
        mockInteraction = {
            editReply: jest.fn().mockResolvedValue({}),
        };
        console.error = jest.fn();
    });

    test('should handle standard errors', async () => {
        const error = new Error('Test error');
        await handleError(mockInteraction, error);

        const reply = mockInteraction.editReply.mock.calls[0][0];
        expect(reply.embeds[0].data).toMatchObject({
            title: 'An error occurred',
            description: expect.any(String),
            color: expect.any(Number),
        });
        expect(reply.ephemeral).toBe(true);
    });

    test('should handle custom error messages', async () => {
        const customError = {
            message: 'Custom error message',
            code: 'CUSTOM_ERROR',
        };
        await handleError(mockInteraction, customError);

        const reply = mockInteraction.editReply.mock.calls[0][0];
        expect(reply.embeds[0].data).toMatchObject({
            title: 'An error occurred',
            description: expect.any(String),
            color: expect.any(Number),
        });
        expect(reply.ephemeral).toBe(true);
    });
});
