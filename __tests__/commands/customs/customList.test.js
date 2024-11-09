const customList = require('../../../commands/customs/customList');
const CustomCommand = require('../../../bot_utils/customCommands');
jest.mock('discord.js');

jest.mock('../../../bot_utils/customCommands', () => ({
    find: jest.fn(() => ({
        sort: jest.fn(),
    })),
}));

describe('customList Command', () => {
    let mockInteraction;

    beforeEach(() => {
        mockInteraction = {
            editReply: jest.fn().mockResolvedValue({
                createMessageComponentCollector: jest.fn().mockReturnValue({
                    on: jest.fn(),
                }),
            }),
            user: { id: 'testUserId' },
        };
        jest.clearAllMocks();
    });

    test('should display empty message when no commands exist', async () => {
        CustomCommand.find().sort.mockResolvedValue([]);

        await customList.execute(mockInteraction);

        const reply = mockInteraction.editReply.mock.calls[0][0];
        expect(reply.embeds[0].data).toMatchObject({
            title: expect.stringContaining('Custom Commands'),
            description: expect.stringContaining('No custom commands'),
        });
    });

    test('should display commands when they exist', async () => {
        const mockCommands = [
            { name: 'cmd1', message: 'msg1' },
            { name: 'cmd2', message: 'msg2', alias_name: 'alias2' },
        ];

        CustomCommand.find().sort.mockResolvedValue(mockCommands);

        await customList.execute(mockInteraction);

        const reply = mockInteraction.editReply.mock.calls[0][0];
        expect(reply.embeds[0].data).toBeDefined();
        expect(reply.components).toBeDefined();
        expect(reply.ephemeral).toBe(true);
    });
});
