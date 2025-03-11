/**
 * theme-system.js - Theme management for Kiyo Dashboard
 * Supports light, dark and system themes with persistent settings
 */

// Available themes
const THEMES = {
	LIGHT: 'light',
	DARK: 'dark',
	SYSTEM: 'system'
};

// Theme specific variables
const themeVariables = {
	light: {
		'--bg-color': '#f8f9fa',
		'--text-color': '#212529',
		'--card-bg': '#ffffff',
		'--border-color': 'rgba(0,0,0,0.125)',
		'--input-bg': '#ffffff',
		'--header-bg': '#ffffff'
	},
	dark: {
		'--bg-color': '#1a1d21',
		'--text-color': '#e1e5eb',
		'--card-bg': '#25282c',
		'--border-color': 'rgba(255,255,255,0.1)',
		'--input-bg': '#2c2f33',
		'--header-bg': '#2c2f33'
	}
};

/**
 * Initialize theme system
 */
function initializeTheme() {
	// Load user preference from localStorage or default to system with error handling
	let savedTheme = THEMES.SYSTEM;
	try {
		const storedTheme = localStorage.getItem('kiyo-theme');
		if (storedTheme) {
			savedTheme = storedTheme;
		}
	} catch (error) {
		console.warn('Failed to retrieve theme preference:', error);
	}

	applyTheme(savedTheme);

	// Update radio buttons if on settings page
	document.querySelectorAll('input[name="theme"]').forEach(radio => {
		if (radio.value === savedTheme) {
			radio.checked = true;
		}

		// Add change listener to radio buttons
		radio.addEventListener('change', (e) => {
			if (e.target.checked) {
				applyTheme(e.target.value);
			}
		});
	});

	// Add theme toggle button to pages without settings
	if (!document.querySelector('input[name="theme"]')) {
		createThemeToggle();
	}

	// Listen for system preference changes if using system theme
	if (savedTheme === THEMES.SYSTEM) {
		listenForSystemChanges();
	}
}

/**
 * Create theme toggle button
 */
function createThemeToggle() {
	const userProfile = document.getElementById('user-profile');
	if (!userProfile) return;

	// Check if toggle already exists to prevent duplicates
	if (document.getElementById('theme-toggle')) return;

	const currentTheme = getCurrentTheme();

	// Create the toggle button
	const toggleBtn = document.createElement('button');
	toggleBtn.className = 'btn btn-sm btn-outline-secondary ms-2';
	toggleBtn.id = 'theme-toggle';
	toggleBtn.setAttribute('aria-label', 'Toggle theme');
	toggleBtn.innerHTML = currentTheme === THEMES.DARK
		? '<i class="bi bi-sun"></i>'
		: '<i class="bi bi-moon"></i>';

	// Add click handler
	toggleBtn.addEventListener('click', () => {
		const currentTheme = getCurrentTheme();
		const newTheme = currentTheme === THEMES.DARK ? THEMES.LIGHT : THEMES.DARK;
		applyTheme(newTheme);

		// Update icon
		toggleBtn.innerHTML = newTheme === THEMES.DARK
			? '<i class="bi bi-sun"></i>'
			: '<i class="bi bi-moon"></i>';
	});

	// Insert before last element in user profile (typically logout button)
	if (userProfile.lastElementChild) {
		userProfile.insertBefore(toggleBtn, userProfile.lastElementChild);
	} else {
		userProfile.appendChild(toggleBtn);
	}
}

/**
 * Apply theme based on selection
 * @param {string} theme Theme name: light, dark, or system
 */
function applyTheme(theme) {
	// Store the user's preference with error handling
	try {
		localStorage.setItem('kiyo-theme', theme);
	} catch (error) {
		console.warn('Failed to save theme preference:', error);
	}

	// Get actual theme (resolve system preference)
	const actualTheme = theme === THEMES.SYSTEM
		? getSystemTheme()
		: theme;

	// Apply theme classes
	document.documentElement.setAttribute('data-bs-theme', actualTheme);
	document.body.classList.remove(`theme-${THEMES.LIGHT}`, `theme-${THEMES.DARK}`);
	document.body.classList.add(`theme-${actualTheme}`);

	// Apply CSS variables
	applyThemeVariables(actualTheme);
}

/**
 * Apply theme specific CSS variables
 * @param {string} theme Theme name
 */
function applyThemeVariables(theme) {
	const variables = themeVariables[theme];
	if (!variables) {
		console.warn(`Theme variables not found for theme: ${theme}`);
		return;
	}

	try {
		const root = document.documentElement;
		Object.entries(variables).forEach(([key, value]) => {
			root.style.setProperty(key, value);
		});
	} catch (error) {
		console.error('Failed to apply theme variables:', error);
	}
}

/**
 * Get the current theme based on CSS classes
 * @returns {string} Current theme
 */
function getCurrentTheme() {
	const isDark = document.body.classList.contains(`theme-${THEMES.DARK}`);
	return isDark ? THEMES.DARK : THEMES.LIGHT;
}

/**
 * Get system theme preference
 * @returns {string} System theme preference
 */
function getSystemTheme() {
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? THEMES.DARK : THEMES.LIGHT;
}

/**
 * Listen for system theme preference changes
 */
function listenForSystemChanges() {
	const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

	// Use addEventListener with feature detection for better browser compatibility
	const changeListener = e => {
		try {
			const theme = localStorage.getItem('kiyo-theme');
			if (theme === THEMES.SYSTEM) {
				applyTheme(THEMES.SYSTEM);

				// Update toggle button icon if it exists
				const toggleBtn = document.getElementById('theme-toggle');
				if (toggleBtn) {
					const systemTheme = getSystemTheme();
					toggleBtn.innerHTML = systemTheme === THEMES.DARK
						? '<i class="bi bi-sun"></i>'
						: '<i class="bi bi-moon"></i>';
				}
			}
		} catch (error) {
			console.warn('Error handling theme change:', error);
		}
	};

	// Use modern event listener with fallback
	if (mediaQuery.addEventListener) {
		mediaQuery.addEventListener('change', changeListener);
	} else if (mediaQuery.addListener) {
		// Deprecated but needed for older browsers
		mediaQuery.addListener(changeListener);
	}
}

// Export theme system
window.ThemeSystem = {
	initialize: initializeTheme,
	applyTheme,
	getCurrentTheme
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeTheme);