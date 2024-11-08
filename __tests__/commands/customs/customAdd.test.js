const customAdd = require('../../../commands/customs/customAdd');
const CustomCommand = require('../../../bot_utils/customCommands');
jest.mock('discord.js');

jest.mock('../../../bot_utils/customCommands', () => {
    return jest.fn((data) => ({
        ...data,
        save: jest.fn().mockResolvedValue(undefined),
    }));
});

describe('customAdd Command', () => {
    let mockInteraction;

    beforeEach(() => {
        mockInteraction = {
            options: {
                getString: jest.fn(),
            },
            editReply: jest.fn().mockResolvedValue({}),
        };
        jest.clearAllMocks();
    });

    test('should add a custom command successfully', async () => {
        const commandName = 'testCommand';
        const commandMessage = 'Test message';

        mockInteraction.options.getString
            .mockReturnValueOnce(commandName)
            .mockReturnValueOnce(commandMessage)
            .mockReturnValueOnce(undefined);

        await customAdd.execute(mockInteraction);

        expect(CustomCommand).toHaveBeenCalledWith({
            name: commandName,
            message: commandMessage,
            alias_name: undefined,
        });

        const reply = mockInteraction.editReply.mock.calls[0][0];
        expect(reply.embeds[0].data).toMatchObject({
            title: expect.stringContaining('Success'),
            description: expect.stringContaining(commandName),
        });
    });

    test('should handle error when saving fails', async () => {
        const error = new Error('Database error');
        mockInteraction.options.getString
            .mockReturnValueOnce('testCommand')
            .mockReturnValueOnce('Test message');

        CustomCommand.mockImplementationOnce(() => ({
            save: jest.fn().mockRejectedValue(error),
        }));

        await customAdd.execute(mockInteraction);

        const reply = mockInteraction.editReply.mock.calls[0][0];
        expect(reply.embeds[0].data).toMatchObject({
            title: 'An error occurred',
            description: expect.any(String),
        });
    });
});
