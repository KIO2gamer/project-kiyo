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

// Add more API methods for servers, commands, etc.

// Export the methods
window.ApiService = {
	getUserProfile,
	// Add more methods
};