const mongoose = require('mongoose');
const DashboardConfig = require('../../src/database/dashboardConfig');

// MongoDB connection
const mongoUri = process.env.MONGODB_URI;
let isConnected = false;

async function connectToDatabase() {
    if (!isConnected) {
        try {
            await mongoose.connect(mongoUri, { bufferCommands: false });
            isConnected = true;
            console.log('✅ MongoDB connection established successfully');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            throw error;
        }
    }
}

exports.handler = async function(event) {
    // Set CORS headers for all responses
    const headers = {
        'Access-Control-Allow-Origin': process.env.DASHBOARD_BASE_URL || '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
    };

    // Handle OPTIONS request (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
        return {
            statusCode: 204,
            headers
        };
    }

    // Parse path parameters
    const path = event.path.split('/').filter(Boolean);
    const endpoint = path[1]; // First segment after /api/
    const parameter = path[2]; // Parameter like dashboard ID

    try {
        await connectToDatabase();

        // GET /api/dashboard/:dashboardId
        if (event.httpMethod === 'GET' && endpoint === 'dashboard' && parameter) {
            // Validate authentication
            const token = event.headers.authorization?.split(' ')[1];
            if (!token) {
                return {
                    statusCode: 401,
                    headers,
                    body: JSON.stringify({ error: 'Authentication required' })
                };
            }

            // Get dashboard config and validate token
            const dashboardConfig = await DashboardConfig.findOne({ dashboardId: parameter });
            if (!dashboardConfig) {
                return {
                    statusCode: 404,
                    headers,
                    body: JSON.stringify({ error: 'Dashboard not found' })
                };
            }

            if (dashboardConfig.accessToken !== token) {
                return {
                    statusCode: 403,
                    headers,
                    body: JSON.stringify({ error: 'Invalid access token' })
                };
            }

            // Update last accessed time
            dashboardConfig.lastAccessed = new Date();
            await dashboardConfig.save();

            // Return dashboard data (could fetch more data from other collections here)
            return {
                statusCode: 200,
                headers,
                body: JSON.stringify({
                    guildId: dashboardConfig.guildId,
                    dashboardId: dashboardConfig.dashboardId,
                    settings: dashboardConfig.settings,
                    createdAt: dashboardConfig.createdAt
                })
            };
        }

        // Default response for unknown endpoints
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Endpoint not found' })
        };
    } catch (error) {
        console.error('Dashboard API error:', error);
        return {
            statusCode: 500,
            headers,
            body: JSON.stringify({ error: 'Server error', message: error.message })
        };
    }
};