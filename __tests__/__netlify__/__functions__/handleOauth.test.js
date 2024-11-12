/* eslint-disable no-undef */
const mongoose = require('mongoose');
const { handler } = require('../../../netlify/functions/handleOauth');
const OAuthCode = require('./../../../bot_utils/OauthCode');

jest.mock('mongoose');
jest.mock('./../../../bot_utils/OauthCode');

describe('handleOauth', () => {
    beforeEach(() => {
        mongoose.connect.mockClear();
        OAuthCode.mockClear = jest.fn();
    });

    it('should return 400 if code or state is missing', async () => {
        const event = {
            queryStringParameters: {
                code: null,
                state: null,
            },
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(400);
        expect(response.body).toContain(
            'Missing authorization code or state parameter.'
        );
    });

    it('should return 404 if no YouTube connections are found', async () => {
        const event = {
            queryStringParameters: {
                code: 'valid_code',
                state: 'valid_state',
            },
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ access_token: 'valid_token' }),
            })
        );

        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({
                json: () => Promise.resolve([]),
            })
        );

        const response = await handler(event);

        expect(response.statusCode).toBe(404);
        expect(response.body).toContain(
            'No YouTube connections found for this Discord account.'
        );
    });

    it('should return 200 if YouTube connections are found and saved', async () => {
        const event = {
            queryStringParameters: {
                code: 'valid_code',
                state: 'valid_state',
            },
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ access_token: 'valid_token' }),
            })
        );

        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve([
                        { id: '1', name: 'YouTube Channel 1', type: 'youtube' },
                    ]),
            })
        );

        OAuthCode.prototype.save = jest.fn().mockResolvedValue({});

        const response = await handler(event);

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Authorization successful!');
        expect(response.body).toContain('Number of connections: 1');
    });

    it('should return 500 if an error occurs during processing', async () => {
        const event = {
            queryStringParameters: {
                code: 'valid_code',
                state: 'valid_state',
            },
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ access_token: 'valid_token' }),
            })
        );

        global.fetch.mockImplementationOnce(() =>
            Promise.reject(new Error('Fetch error'))
        );

        const response = await handler(event);

        expect(response.statusCode).toBe(500);
        expect(response.body).toContain(
            'An unexpected error occurred while processing your request.'
        );
    });

    it('should return 500 if database connection fails', async () => {
        mongoose.connect.mockImplementationOnce(() => {
            throw new Error('Database connection error');
        });

        const event = {
            queryStringParameters: {
                code: 'valid_code',
                state: 'valid_state',
            },
        };

        const response = await handler(event);

        expect(response.statusCode).toBe(500);
        expect(response.body).toContain(
            'An unexpected error occurred while processing your request.'
        );
    });

    it('should return 500 if saving OAuth record fails', async () => {
        const event = {
            queryStringParameters: {
                code: 'valid_code',
                state: 'valid_state',
            },
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ access_token: 'valid_token' }),
            })
        );

        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve([
                        { id: '1', name: 'YouTube Channel 1', type: 'youtube' },
                    ]),
            })
        );

        OAuthCode.prototype.save = jest
            .fn()
            .mockRejectedValue(new Error('Save error'));

        const response = await handler(event);

        expect(response.statusCode).toBe(500);
        expect(response.body).toContain(
            'An unexpected error occurred while processing your request.'
        );
    });

    it('should return 200 if YouTube connections are found and saved', async () => {
        const event = {
            queryStringParameters: {
                code: 'valid_code',
                state: 'valid_state',
            },
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ access_token: 'valid_token' }),
            })
        );

        global.fetch.mockImplementationOnce(() =>
            Promise.resolve({
                json: () =>
                    Promise.resolve([
                        { id: '1', name: 'YouTube Channel 1', type: 'youtube' },
                    ]),
            })
        );

        OAuthCode.prototype.save = jest.fn().mockResolvedValue({});

        const response = await handler(event);

        expect(response.statusCode).toBe(200);
        expect(response.body).toContain('Authorization successful!');
        expect(response.body).toContain('Number of connections: 1');
    });

    it('should return 500 if an error occurs during processing', async () => {
        const event = {
            queryStringParameters: {
                code: 'valid_code',
                state: 'valid_state',
            },
        };

        global.fetch = jest.fn(() =>
            Promise.resolve({
                json: () => Promise.resolve({ access_token: 'valid_token' }),
            })
        );

        global.fetch.mockImplementationOnce(() =>
            Promise.reject(new Error('Fetch error'))
        );

        const response = await handler(event);

        expect(response.statusCode).toBe(500);
        expect(response.body).toContain(
            'An unexpected error occurred while processing your request.'
        );
    });
});
