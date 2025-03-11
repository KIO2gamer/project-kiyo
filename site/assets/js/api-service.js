// Create a new file: site/assets/js/api-service.js
/**
 * API Service for Kiyo Dashboard
 * Centralizes all API calls to maintain consistency
 */

const API_BASE = '/.netlify/functions/dashboardApi';
const AUTH_ENDPOINT = '/.netlify/functions/dashboardAuth';

// Cache system
const cache = {
	user: null,
	servers: null,
	commands: null,
	// Cache timeout in milliseconds (5 minutes)
	timeout: 5 * 60 * 1000,
	timestamps: {}
};

/**
 * Fetch with authentication handling
 * @param {string} url URL to fetch
 * @param {Object} options Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithAuth(url, options = {}) {
	options.credentials = 'include';
	const response = await fetch(url, options);

	if (response.status === 401) {
		window.location.href = AUTH_ENDPOINT;
		throw new Error('Authentication required');
	}

	return response;
}

/**
 * Make a POST request to the API
 * @param {string} endpoint API endpoint
 * @param {Object} data Data to send
 * @returns {Promise<any>} Response data
 */
async function postToApi(endpoint, data) {
	const url = `${API_BASE}/${endpoint}`;
	const options = {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify(data)
	};

	const response = await fetchWithAuth(url, options);
	if (!response.ok) {
		const errorData = await response.json().catch(() => ({}));
		throw new Error(errorData.message || `API Error: ${response.status}`);
	}

	return response.json();
}

/**
 * Get user profile with caching
 * @param {boolean} forceRefresh Force refresh from API
 * @returns {Promise<Object>} User data
 */
async function getUserProfile(forceRefresh = false) {
	const cacheKey = 'user';

	if (!forceRefresh &&
		cache[cacheKey] &&
		(Date.now() - (cache.timestamps[cacheKey] || 0)) < cache.timeout) {
		return cache[cacheKey];
	}

	try {
		const response = await fetchWithAuth(`${API_BASE}/profile`);
		if (!response.ok) throw new Error(`API Error: ${response.status}`);

		const data = await response.json();
		cache[cacheKey] = data;
		cache.timestamps[cacheKey] = Date.now();

		return data;
	} catch (error) {
		console.error('Error fetching user profile:', error);
		throw error;
	}
}

/**
 * Get managed servers with pagination
 * @param {number} page Page number
 * @param {number} limit Items per page
 * @returns {Promise<Object>} Servers data with pagination info
 */
async function getManagedServers(page = 1, limit = 12) {
	const cacheKey = 'servers';

	// Only use cache for first page
	if (page === 1 &&
		cache[cacheKey] &&
		(Date.now() - (cache.timestamps[cacheKey] || 0)) < cache.timeout) {
		return cache[cacheKey];
	}

	try {
		const response = await fetchWithAuth(`${API_BASE}/guilds?page=${page}&limit=${limit}`);
		if (!response.ok) throw new Error(`API Error: ${response.status}`);

		const data = await response.json();

		// Cache only first page
		if (page === 1) {
			cache[cacheKey] = data;
			cache.timestamps[cacheKey] = Date.now();
		}

		return data;
	} catch (error) {
		console.error('Error fetching servers:', error);
		throw error;
	}
}

/**
 * Get commands list
 * @param {boolean} forceRefresh Force refresh from API
 * @returns {Promise<Object>} Commands data
 */
async function getCommands(forceRefresh = false) {
	const cacheKey = 'commands';

	if (!forceRefresh &&
		cache[cacheKey] &&
		(Date.now() - (cache.timestamps[cacheKey] || 0)) < cache.timeout) {
		return cache[cacheKey];
	}

	try {
		const response = await fetchWithAuth(`${API_BASE}/commands`);
		if (!response.ok) throw new Error(`API Error: ${response.status}`);

		const data = await response.json();
		cache[cacheKey] = data;
		cache.timestamps[cacheKey] = Date.now();

		return data;
	} catch (error) {
		console.error('Error fetching commands:', error);
		throw error;
	}
}

/**
 * Get server-specific commands config
 * @param {string} serverId Server ID
 * @returns {Promise<Object>} Server commands data
 */
async function getServerCommands(serverId) {
	try {
		const response = await fetchWithAuth(`${API_BASE}/guilds/${serverId}/commands`);
		if (!response.ok) throw new Error(`API Error: ${response.status}`);

		return response.json();
	} catch (error) {
		console.error(`Error fetching commands for server ${serverId}:`, error);
		throw error;
	}
}

/**
 * Update server command status
 * @param {string} serverId Server ID
 * @param {string} commandId Command ID
 * @param {boolean} enabled Whether command is enabled
 * @returns {Promise<Object>} Updated status
 */
async function updateServerCommand(serverId, commandId, enabled) {
	return postToApi(`guilds/${serverId}/commands/${commandId}`, { enabled });
}

/**
 * Update server welcome config
 * @param {string} serverId Server ID
 * @param {Object} config Welcome configuration
 * @returns {Promise<Object>} Updated config
 */
async function updateWelcomeConfig(serverId, config) {
	return postToApi(`guilds/${serverId}/welcome`, config);
}

/**
 * Get bot statistics
 * @returns {Promise<Object>} Bot stats
 */
async function getBotStats() {
	try {
		const response = await fetchWithAuth(`${API_BASE}/stats`);
		if (!response.ok) throw new Error(`API Error: ${response.status}`);

		return response.json();
	} catch (error) {
		console.error('Error fetching bot stats:', error);
		throw error;
	}
}

/**
 * Clear all cached data
 */
function clearCache() {
	Object.keys(cache).forEach(key => {
		if (key !== 'timeout' && key !== 'timestamps') {
			cache[key] = null;
		}
	});
	cache.timestamps = {};
}

// Export the methods
window.ApiService = {
	getUserProfile,
	getManagedServers,
	getCommands,
	getServerCommands,
	updateServerCommand,
	updateWelcomeConfig,
	getBotStats,
	fetchWithAuth,
	postToApi,
	clearCache
};