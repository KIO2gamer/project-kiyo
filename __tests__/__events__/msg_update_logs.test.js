/* eslint-disable no-undef */
const { fetchPartialMessages } = require('../../events/msg_update_logs');

describe('fetchPartialMessages', () => {
    test('should fetch partial messages', async () => {
        const oldMessage = {
            partial: true,
            fetch: jest.fn().mockResolvedValue(true),
        };
        const newMessage = {
            partial: true,
            fetch: jest.fn().mockResolvedValue(true),
        };

        const result = await fetchPartialMessages(oldMessage, newMessage);

        expect(oldMessage.fetch).toHaveBeenCalled();
        expect(newMessage.fetch).toHaveBeenCalled();
        expect(result).toBe(true);
    });

    test('should handle fetch errors', async () => {
        const oldMessage = {
            partial: true,
            fetch: jest.fn().mockRejectedValue(new Error('Fetch error')),
        };
        const newMessage = {
            partial: true,
            fetch: jest.fn().mockRejectedValue(new Error('Fetch error')),
        };

        const result = await fetchPartialMessages(oldMessage, newMessage);

        expect(oldMessage.fetch).toHaveBeenCalled();
        expect(newMessage.fetch).toHaveBeenCalled();
        expect(result).toBe(false);
    });

    test('should return true if messages are not partial', async () => {
        const oldMessage = { partial: false };
        const newMessage = { partial: false };

        const result = await fetchPartialMessages(oldMessage, newMessage);

        expect(result).toBe(true);
    });
});
