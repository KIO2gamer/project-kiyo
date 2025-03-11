/**
 * dashboard-common.js - Common utilities for Kiyo Discord Bot dashboard
 * Shared functionality across dashboard pages
 */

// API URL constants
const API_BASE = '/.netlify/functions/dashboardApi';
const AUTH_ENDPOINT = '/.netlify/functions/dashboardAuth';

// Cache for user data to avoid repeated requests
let userCache = null;
let serversCache = null;

/**
 * Loads and displays the user profile in the header
 * Redirects to login if unauthorized
 * @returns {Promise<Object|null>} User profile data or null if error
 */
async function loadUserProfile() {
	try {
		// Return cached data if available
		if (userCache) {
			updateProfileUI(userCache);
			return userCache;
		}

		const response = await fetchWithAuth(`${API_BASE}/profile`);

		// Handle successful response
		if (response.ok) {
			const userData = await response.json();
			userCache = userData;
			updateProfileUI(userData);
			return userData;
		}

		// Handle unauthorized response by redirecting to login
		if (response.status === 401) {
			redirectToLogin();
			return null;
		}

		throw new Error(`Failed to fetch profile: ${response.status}`);
	} catch (error) {
		console.error('Error loading user profile:', error);
		showToast('error', 'Failed to load user profile');
		return null;
	}
}

/**
 * Updates the UI with user profile information
 * @param {Object} userData User data from API
 */
function updateProfileUI(userData) {
	const userProfileEl = document.getElementById('user-profile');
	if (!userProfileEl) return;

	// Create avatar URL with fallback
	const avatarUrl = userData.avatar
		? `https://cdn.discordapp.com/avatars/${userData.id}/${userData.avatar}.png?size=64`
		: 'https://cdn.discordapp.com/embed/avatars/0.png';

	userProfileEl.innerHTML = `
    <div class="d-flex align-items-center">
      <img src="${avatarUrl}" alt="${userData.username}" class="avatar me-2">
      <div>
        <span class="username">${userData.username}</span>
        <div class="dropdown d-inline-block ms-2">
          <button class="btn btn-sm dropdown-toggle p-0 text-white" type="button" data-bs-toggle="dropdown">
            <i class="bi bi-chevron-down"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><a class="dropdown-item" href="/dashboard/settings"><i class="bi bi-gear me-2"></i>Settings</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#" onclick="logout()"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

/**
 * Loads managed servers for the current user
 * @returns {Promise<Array|null>} Array of servers or null if error
 */
async function loadManagedServers() {
	try {
		// Return cached data if available
		if (serversCache) return serversCache;

		const response = await fetchWithAuth(`${API_BASE}/guilds`);

		if (!response.ok) {
			if (response.status === 401) redirectToLogin();
			throw new Error(`Failed to fetch servers: ${response.status}`);
		}

		const data = await response.json();
		serversCache = data.guilds;
		return data.guilds;
	} catch (error) {
		console.error('Error loading servers:', error);
		showToast('error', 'Failed to load servers');
		return null;
	}
}

/**
 * Fetch with authentication handling
 * @param {string} url URL to fetch
 * @param {Object} options Fetch options
 * @returns {Promise<Response>} Fetch response
 */
async function fetchWithAuth(url, options = {}) {
	// Ensure credentials are included for cookies
	const fetchOptions = {
		...options,
		credentials: 'include'
	};

	try {
		const response = await fetch(url, fetchOptions);
		return response;
	} catch (error) {
		console.error(`Fetch error for ${url}:`, error);
		throw error;
	}
}

/**
 * Makes a POST request to the API
 * @param {string} endpoint API endpoint
 * @param {Object} data Data to send
 * @returns {Promise<Object>} Response data
 */
async function postToApi(endpoint, data) {
	try {
		const response = await fetchWithAuth(`${API_BASE}${endpoint}`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify(data)
		});

		if (!response.ok) {
			if (response.status === 401) redirectToLogin();

			// Try to get error message from response
			let errorMessage = `API error: ${response.status}`;
			try {
				const errorData = await response.json();
				errorMessage = errorData.error || errorMessage;
			} catch (e) {
				// Ignore JSON parse error
			}

			throw new Error(errorMessage);
		}

		return await response.json();
	} catch (error) {
		console.error(`API error (${endpoint}):`, error);
		throw error;
	}
}

/**
 * Redirects user to login page
 */
function redirectToLogin() {
	window.location.href = AUTH_ENDPOINT;
}

/**
 * Logs the user out by clearing session
 */
function logout() {
	fetch(`${API_BASE}/logout`, {
		method: 'POST',
		credentials: 'include'
	})
		.finally(() => {
			// Clear caches
			userCache = null;
			serversCache = null;

			// Redirect to home page
			window.location.href = '/';
		});
}

/**
 * Shows a toast notification
 * @param {string} type Type of toast (success, error, warning, info)
 * @param {string} message Message to display
 * @param {number} duration Duration in ms
 */
function showToast(type, message, duration = 3000) {
	// Ensure toast container exists
	let toastContainer = document.querySelector('.toast-container');
	if (!toastContainer) {
		toastContainer = document.createElement('div');
		toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
		document.body.appendChild(toastContainer);
	}

	// Map type to Bootstrap colors and icons
	let bgColor, iconClass;
	switch (type) {
		case 'success':
			bgColor = 'bg-success';
			iconClass = 'bi-check-circle';
			break;
		case 'error':
			bgColor = 'bg-danger';
			iconClass = 'bi-exclamation-triangle';
			break;
		case 'warning':
			bgColor = 'bg-warning text-dark';
			iconClass = 'bi-exclamation-circle';
			break;
		default: // info
			bgColor = 'bg-info text-dark';
			iconClass = 'bi-info-circle';
	}

	// Create toast element
	const toastId = 'toast-' + Date.now();
	const toastEl = document.createElement('div');
	toastEl.className = `toast align-items-center ${bgColor} border-0 mb-2`;
	toastEl.setAttribute('role', 'alert');
	toastEl.setAttribute('aria-live', 'assertive');
	toastEl.setAttribute('aria-atomic', 'true');
	toastEl.setAttribute('id', toastId);

	// Set toast content
	toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${iconClass} me-2"></i> ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;

	// Add toast to container
	toastContainer.appendChild(toastEl);

	// Initialize and show toast
	const toast = new bootstrap.Toast(toastEl, {
		autohide: true,
		delay: duration
	});
	toast.show();

	// Remove toast element after it's hidden
	toastEl.addEventListener('hidden.bs.toast', () => {
		toastEl.remove();
	});
}

/**
 * Returns appropriate Bootstrap class for toast type
 * @param {string} type Toast type
 * @returns {string} Bootstrap color class
 */
function getToastClass(type) {
	const typeMap = {
		success: 'success',
		error: 'danger',
		warning: 'warning',
		info: 'info'
	};

	return typeMap[type] || 'primary';
}

/**
 * Format a Discord timestamp
 * @param {string|number} timestamp Discord timestamp
 * @returns {string} Formatted date
 */
function formatTimestamp(timestamp) {
	if (!timestamp) return 'N/A';

	const date = new Date(timestamp);
	return date.toLocaleString();
}

/**
 * Initialize popovers, tooltips and other Bootstrap components
 */
function initBootstrapComponents() {
	// Initialize tooltips
	const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
	tooltipTriggerList.map(function (tooltipTriggerEl) {
		return new bootstrap.Tooltip(tooltipTriggerEl);
	});

	// Initialize popovers
	const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
	popoverTriggerList.map(function (popoverTriggerEl) {
		return new bootstrap.Popover(popoverTriggerEl);
	});
}

/**
 * Initialize navigation sidebar active state
 */
function initActiveSidebar() {
	const currentPath = window.location.pathname;
	document.querySelectorAll('.sidebar-nav a').forEach(link => {
		if (currentPath.includes(link.getAttribute('href'))) {
			link.parentElement.classList.add('active');
		}
	});
}

/**
 * Initialize mobile navigation
 */
function initMobileNavigation() {
	const sidebarToggle = document.querySelector('.navbar-toggle');
	const sidebar = document.querySelector('.sidebar');

	if (sidebarToggle && sidebar) {
		sidebarToggle.addEventListener('click', () => {
			sidebar.classList.toggle('show');
		});

		// Close sidebar when clicking outside on mobile
		document.addEventListener('click', (e) => {
			if (window.innerWidth < 992 &&
				!e.target.closest('.sidebar') &&
				!e.target.closest('.navbar-toggle')) {
				sidebar.classList.remove('show');
			}
		});
	}
}

/**
 * Initializes dashboard common features including theme
 */
function initializeDashboard() {
	// Initialize theme system if available
	if (window.ThemeSystem) {
		try {
			window.ThemeSystem.initialize();
		} catch (error) {
			console.error('Failed to initialize theme system:', error);

			// Fallback to basic theme based on system preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
		}
	} else {
		console.warn('Theme system not available, using system default');
	}

	// Initialize other dashboard common features
	setupNavigation();
	initializeToasts();
	// Other initializations...
}

// Initialize theme from saved preference
function initializeTheme() {
	const savedTheme = localStorage.getItem('kiyo-theme') || 'system';
	applyTheme(savedTheme);

	// Update radio buttons if on settings page
	document.querySelectorAll('input[name="theme"]').forEach(radio => {
		if (radio.value === savedTheme) {
			radio.checked = true;
		}
	});

	// Listen for system preference changes if using system theme
	if (savedTheme === 'system') {
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
			applyTheme('system');
		});
	}
}

// Call when DOM loads
document.addEventListener('DOMContentLoaded', () => {
	initActiveSidebar();
	initBootstrapComponents();
	loadUserProfile();
	initMobileNavigation();
	initializeTheme();
});

// Export functions for use in other scripts
window.loadUserProfile = loadUserProfile;
window.loadManagedServers = loadManagedServers;
window.fetchWithAuth = fetchWithAuth;
window.postToApi = postToApi;
window.showToast = showToast;
window.logout = logout;
window.formatTimestamp = formatTimestamp;
window.applyTheme = applyTheme;
window.initializeTheme = initializeTheme;