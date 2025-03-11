/**
 * API Service for Kiyo Discord Bot Dashboard
 * Centralizes API calls with enhanced error handling and caching
 */

class ApiService {
	constructor() {
		this.baseUrl = '/.netlify/functions/dashboardApi';
		this.authEndpoint = '/.netlify/functions/dashboardAuth';

		// Cache configuration
		this.cache = {
			enabled: true,
			ttl: 5 * 60 * 1000, // 5 minutes default TTL
			data: {},
			timestamps: {}
		};

		// Default request options
		this.defaultOptions = {
			credentials: 'include',
			headers: {
				'Content-Type': 'application/json'
			}
		};

		// Bind methods
		this.get = this.get.bind(this);
		this.post = this.post.bind(this);
		this.put = this.put.bind(this);
		this.delete = this.delete.bind(this);
		this.clearCache = this.clearCache.bind(this);
	}

	/**
	 * Performs a GET request
	 * @param {string} endpoint - API endpoint
	 * @param {Object} options - Request options
	 * @param {boolean} useCache - Whether to use cache
	 * @returns {Promise<Object>} - Response data
	 */
	async get(endpoint, options = {}, useCache = true) {
		const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

		// Check cache if enabled and requested
		if (this.cache.enabled && useCache) {
			const cachedData = this.getCachedData(url);
			if (cachedData) return cachedData;
		}

		// Perform request
		const requestOptions = {
			...this.defaultOptions,
			...options,
			method: 'GET'
		};

		try {
			const response = await this.sendRequest(url, requestOptions);
			const data = await response.json();

			// Cache successful responses
			if (this.cache.enabled && useCache && response.ok) {
				this.setCacheData(url, data);
			}

			return data;
		} catch (error) {
			this.handleError(error, endpoint);
		}
	}

	/**
	 * Performs a POST request
	 * @param {string} endpoint - API endpoint
	 * @param {Object} data - Request body data
	 * @param {Object} options - Request options
	 * @returns {Promise<Object>} - Response data
	 */
	async post(endpoint, data, options = {}) {
		const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

		const requestOptions = {
			...this.defaultOptions,
			...options,
			method: 'POST',
			body: JSON.stringify(data)
		};

		try {
			const response = await this.sendRequest(url, requestOptions);
			return await response.json();
		} catch (error) {
			this.handleError(error, endpoint);
		}
	}

	/**
	 * Performs a PUT request
	 * @param {string} endpoint - API endpoint
	 * @param {Object} data - Request body data
	 * @param {Object} options - Request options
	 * @returns {Promise<Object>} - Response data
	 */
	async put(endpoint, data, options = {}) {
		const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

		const requestOptions = {
			...this.defaultOptions,
			...options,
			method: 'PUT',
			body: JSON.stringify(data)
		};

		try {
			const response = await this.sendRequest(url, requestOptions);
			return await response.json();
		} catch (error) {
			this.handleError(error, endpoint);
		}
	}

	/**
	 * Performs a DELETE request
	 * @param {string} endpoint - API endpoint
	 * @param {Object} options - Request options
	 * @returns {Promise<Object>} - Response data
	 */
	async delete(endpoint, options = {}) {
		const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;

		const requestOptions = {
			...this.defaultOptions,
			...options,
			method: 'DELETE'
		};

		try {
			const response = await this.sendRequest(url, requestOptions);
			return await response.json();
		} catch (error) {
			this.handleError(error, endpoint);
		}
	}

	/**
	 * Sends a request with proper error handling
	 * @param {string} url - Request URL
	 * @param {Object} options - Request options
	 * @returns {Promise<Response>} - Fetch response
	 */
	async sendRequest(url, options) {
		try {
			// Set a timeout for the fetch request
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout

			const modifiedOptions = {
				...options,
				signal: controller.signal
			};

			const response = await fetch(url, modifiedOptions);

			// Clear the timeout
			clearTimeout(timeoutId);

			// Handle unauthorized responses
			if (response.status === 401) {
				this.redirectToLogin();
				throw new Error('Unauthorized - Please log in');
			}

			// Handle not found responses
			if (response.status === 404) {
				throw new Error(`Resource not found: ${url.split('/').pop()}`);
			}

			// Handle other error responses
			if (!response.ok) {
				let errorMessage = `Request failed with status ${response.status}`;

				// Try to extract error message from response
				try {
					const errorData = await response.clone().json();
					if (errorData && errorData.error) {
						errorMessage = errorData.error;
					}
				} catch (e) {
					// Ignore JSON parse errors
				}

				throw new Error(errorMessage);
			}

			return response;
		} catch (error) {
			if (error.name === 'AbortError') {
				throw new Error('Request timed out. Please try again later.');
			}

			if (error.message === 'Unauthorized - Please log in') {
				throw error; // Already handled
			}

			if (error.name === 'TypeError') {
				throw new Error('Network error - Please check your connection');
			}

			throw error;
		}
	}

	/**
	 * Gets cached data if valid
	 * @param {string} key - Cache key
	 * @returns {Object|null} - Cached data or null
	 */
	getCachedData(key) {
		if (!this.cache.data[key]) return null;

		const timestamp = this.cache.timestamps[key] || 0;
		const now = Date.now();

		// Check if cache is still valid
		if (now - timestamp > this.cache.ttl) {
			delete this.cache.data[key];
			delete this.cache.timestamps[key];
			return null;
		}

		return this.cache.data[key];
	}

	/**
	 * Saves data to cache
	 * @param {string} key - Cache key
	 * @param {Object} data - Data to cache
	 */
	setCacheData(key, data) {
		this.cache.data[key] = data;
		this.cache.timestamps[key] = Date.now();
	}

	/**
	 * Clears cache for specific endpoint or all cache
	 * @param {string|null} endpoint - Optional endpoint to clear
	 */
	clearCache(endpoint = null) {
		if (endpoint) {
			const url = `${this.baseUrl}/${endpoint.replace(/^\//, '')}`;
			delete this.cache.data[url];
			delete this.cache.timestamps[url];
		} else {
			this.cache.data = {};
			this.cache.timestamps = {};
		}
	}

	/**
	 * Handles API errors
	 * @param {Error} error - Error object
	 * @param {string} endpoint - API endpoint
	 */
	handleError(error, endpoint) {
		console.error(`API Error (${endpoint}):`, error);

		// Show toast notification if available
		if (window.showToast) {
			window.showToast('error', error.message || 'An unexpected error occurred');
		}

		throw error;
	}

	/**
	 * Redirects to login page
	 */
	redirectToLogin() {
		window.location.href = this.authEndpoint;
	}

	/**
	 * Gets the current user profile
	 * @param {boolean} useCache - Whether to use cache
	 * @returns {Promise<Object>} User profile data
	 */
	async getProfile(useCache = true) {
		return await this.get('profile', {}, useCache);
	}

	/**
	 * Gets user's managed servers
	 * @param {number} page - Page number
	 * @param {number} limit - Servers per page
	 * @param {boolean} useCache - Whether to use cache
	 * @returns {Promise<Object>} Server list with pagination
	 */
	async getManagedServers(page = 1, limit = 12, useCache = true) {
		return await this.get(`guilds?page=${page}&limit=${limit}`, {}, page === 1 && useCache);
	}

	/**
	 * Gets server settings
	 * @param {string} guildId - Discord server ID
	 * @param {boolean} useCache - Whether to use cache
	 * @returns {Promise<Object>} Server settings
	 */
	async getServerSettings(guildId, useCache = true) {
		try {
			const result = await this.get(`guilds/${guildId}/settings`, {}, useCache);
			return result;
		} catch (error) {
			// Enhanced error handling with more specific messages
			if (error.message.includes('404')) {
				throw new Error('Server settings not found. The bot might not be in this server yet.');
			} else if (error.message.includes('403')) {
				throw new Error('You do not have permission to access these settings.');
			}

			// Re-throw the original error
			throw error;
		}
	}

	/**
	 * Updates server settings
	 * @param {string} guildId - Discord server ID
	 * @param {Object} settings - New settings
	 * @returns {Promise<Object>} Updated settings
	 */
	async updateServerSettings(guildId, settings) {
		const result = await this.post(`guilds/${guildId}/settings`, settings);

		// Clear cache for this server if successful
		this.clearCache(`guilds/${guildId}/settings`);

		return result;
	}

	/**
	 * Logs out the current user
	 * @returns {Promise<void>}
	 */
	async logout() {
		try {
			await this.post('logout', {});
		} finally {
			// Clear cache and redirect regardless of result
			this.clearCache();
			window.location.href = '/';
		}
	}
}

// Create and export global instance
window.apiService = new ApiService();