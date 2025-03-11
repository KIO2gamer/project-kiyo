/**
 * Main application script for Kiyo Discord Bot Dashboard
 * Initializes shared components and handles site-wide functionality
 */

// App configuration
const APP_CONFIG = {
	name: 'Kiyo Bot Dashboard',
	version: '1.0.0',
	debug: false // Set to true to enable debug logging
};

/**
 * Main app class for Kiyo Dashboard
 */
class KiyoApp {
	constructor() {
		this.initialized = false;
		this.pendingReady = [];

		// Bind methods
		this.init = this.init.bind(this);
		this.onDOMReady = this.onDOMReady.bind(this);
		this.initializeTheme = this.initializeTheme.bind(this);
		this.initializeToasts = this.initializeToasts.bind(this);
		this.onAppReady = this.onAppReady.bind(this);
		this.debug = this.debug.bind(this);
	}

	/**
	 * Initialize the application
	 */
	init() {
		// Only initialize once
		if (this.initialized) return;

		try {
			this.debug('Initializing application...');

			// Register DOM ready handler
			document.addEventListener('DOMContentLoaded', this.onDOMReady);

			// Initialize components that don't require DOM
			this.initialized = true;
			this.debug('Basic initialization complete');

		} catch (error) {
			console.error('Failed to initialize application:', error);
		}
	}

	/**
	 * DOM Ready handler
	 */
	onDOMReady() {
		this.debug('DOM ready, initializing components...');

		try {
			// Initialize theme system
			this.initializeTheme();

			// Initialize toasts
			this.initializeToasts();

			// Initialize API service
			this.initializeApiService();

			// Initialize user authentication state
			this.initializeAuthState();

			// Trigger ready callbacks
			this.triggerReadyCallbacks();

			this.debug('Application fully initialized');

		} catch (error) {
			console.error('Error during component initialization:', error);
		}
	}

	/**
	 * Initialize theme system
	 */
	initializeTheme() {
		try {
			if (window.ThemeSystem) {
				window.ThemeSystem.initialize();
				this.debug('Theme system initialized');
			} else {
				this.initializeThemeFallback();
			}
		} catch (error) {
			console.error('Theme initialization error:', error);
			this.initializeThemeFallback();
		}
	}

	/**
	 * Fallback theme initialization
	 */
	initializeThemeFallback() {
		this.debug('Using fallback theme initialization');

		// Get saved theme or use system default
		const savedTheme = localStorage.getItem('kiyo-theme') || 'system';

		if (savedTheme === 'system') {
			// Apply system preference
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
		} else {
			// Apply saved preference
			document.documentElement.setAttribute('data-bs-theme', savedTheme);
		}

		// Set up theme toggle controls
		document.querySelectorAll('[name="theme"]').forEach(radio => {
			if (radio.value === savedTheme) {
				radio.checked = true;
			}

			radio.addEventListener('change', () => {
				if (radio.checked) {
					this.applyTheme(radio.value);
				}
			});
		});

		// Listen for system preference changes
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
			if (localStorage.getItem('kiyo-theme') === 'system') {
				document.documentElement.setAttribute('data-bs-theme', e.matches ? 'dark' : 'light');
			}
		});
	}

	/**
	 * Apply theme
	 * @param {string} theme - Theme to apply (light, dark, system)
	 */
	applyTheme(theme) {
		if (window.ThemeSystem) {
			window.ThemeSystem.applyTheme(theme);
			return;
		}

		// Fallback theme application
		localStorage.setItem('kiyo-theme', theme);

		if (theme === 'system') {
			const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
			document.documentElement.setAttribute('data-bs-theme', prefersDark ? 'dark' : 'light');
		} else {
			document.documentElement.setAttribute('data-bs-theme', theme);
		}
	}

	/**
	 * Initialize toast notification system
	 */
	initializeToasts() {
		this.debug('Initializing toast notification system');

		// Create toast container if it doesn't exist
		if (!document.querySelector('.toast-container')) {
			const toastContainer = document.createElement('div');
			toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
			toastContainer.style.zIndex = "1050";
			document.body.appendChild(toastContainer);
		}

		// Define global toast function if not already defined
		if (!window.showToast) {
			window.showToast = (type, message, duration = 3000) => {
				const toastContainer = document.querySelector('.toast-container');
				if (!toastContainer) return;

				// Map type to Bootstrap styles and icons
				const typeMap = {
					success: { bgClass: 'bg-success', icon: 'bi-check-circle' },
					error: { bgClass: 'bg-danger', icon: 'bi-exclamation-triangle' },
					warning: { bgClass: 'bg-warning text-dark', icon: 'bi-exclamation-circle' },
					info: { bgClass: 'bg-info text-dark', icon: 'bi-info-circle' }
				};

				const { bgClass, icon } = typeMap[type] || typeMap.info;

				// Create toast element
				const toastId = 'toast-' + Date.now();
				const toast = document.createElement('div');
				toast.className = `toast align-items-center ${bgClass} border-0 mb-2`;
				toast.id = toastId;
				toast.setAttribute('role', 'alert');
				toast.setAttribute('aria-live', 'assertive');
				toast.setAttribute('aria-atomic', 'true');

				toast.innerHTML = `
          <div class="d-flex">
            <div class="toast-body">
              <i class="bi ${icon} me-2"></i> ${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
          </div>
        `;

				toastContainer.appendChild(toast);

				// Initialize and show toast using Bootstrap
				if (window.bootstrap && window.bootstrap.Toast) {
					const bsToast = new window.bootstrap.Toast(toast, {
						delay: duration,
						autohide: true
					});

					bsToast.show();

					// Remove from DOM after hidden
					toast.addEventListener('hidden.bs.toast', () => {
						toast.remove();
					});
				} else {
					// Fallback if Bootstrap JS isn't available
					toast.style.opacity = '1';
					setTimeout(() => {
						toast.style.opacity = '0';
						toast.style.transition = 'opacity 0.5s ease';

						setTimeout(() => {
							toast.remove();
						}, 500);
					}, duration);
				}
			};
		}
	}

	/**
	 * Initialize API service
	 */
	initializeApiService() {
		this.debug('Initializing API service');

		// Check if API service already exists
		if (window.apiService) {
			this.debug('API service already initialized');
			return;
		}

		// Check if the ApiService class exists
		if (typeof ApiService !== 'undefined') {
			window.apiService = new ApiService();
			this.debug('API service initialized');
		} else {
			console.warn('ApiService class not found, API service not initialized');
		}
	}

	/**
	 * Initialize authentication state
	 */
	initializeAuthState() {
		this.debug('Initializing authentication state');

		// Only proceed on dashboard pages
		if (!document.querySelector('.dashboard')) {
			this.debug('Not a dashboard page, skipping auth check');
			return;
		}

		// Try to load user profile to verify authentication
		if (window.loadUserProfile) {
			window.loadUserProfile().catch(error => {
				console.error('Authentication error:', error);
			});
		} else if (window.apiService) {
			window.apiService.getProfile().catch(error => {
				console.error('Authentication error:', error);
			});
		}
	}

	/**
	 * Register a callback for when the app is fully initialized
	 * @param {Function} callback - Function to call when app is ready
	 */
	onAppReady(callback) {
		if (typeof callback !== 'function') return;

		if (this.initialized && document.readyState === 'complete') {
			callback();
		} else {
			this.pendingReady.push(callback);
		}
	}

	/**
	 * Trigger ready callbacks
	 */
	triggerReadyCallbacks() {
		this.debug(`Triggering ${this.pendingReady.length} ready callbacks`);

		this.pendingReady.forEach(callback => {
			try {
				callback();
			} catch (error) {
				console.error('Error in ready callback:', error);
			}
		});

		this.pendingReady = [];
	}

	/**
	 * Debug logging function
	 * @param {string} message - Debug message
	 */
	debug(message) {
		if (APP_CONFIG.debug) {
			console.log(`[KiyoApp] ${message}`);
		}
	}
}

// Create and initialize app instance
window.KiyoApp = new KiyoApp();
window.KiyoApp.init();

// Export key functions to global scope
window.applyTheme = (theme) => window.KiyoApp.applyTheme(theme);
window.onAppReady = (callback) => window.KiyoApp.onAppReady(callback);
