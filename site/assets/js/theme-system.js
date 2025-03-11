/**
 * Theme System for Kiyo Discord Bot Dashboard
 * Provides consistent theming functionality across the site
 */

// Theme options
const THEMES = {
	light: 'light',
	dark: 'dark',
	system: 'system'
};

// Local storage key
const STORAGE_KEY = 'kiyo-theme';

/**
 * Theme system singleton
 */
const ThemeSystem = {
	/**
	 * Initialize theme system
	 * Sets up event listeners and applies initial theme
	 */
	initialize() {
		// Apply saved theme on load
		this.applyTheme(this.getSavedTheme());

		// Add system preference change listener
		window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
			if (this.getSavedTheme() === THEMES.system) {
				this.applySystemTheme();
			}
		});

		// Initialize theme controls if present
		this.initializeThemeControls();

		return this;
	},

	/**
	 * Get saved theme preference
	 * @returns {string} Theme name: 'light', 'dark', or 'system'
	 */
	getSavedTheme() {
		return localStorage.getItem(STORAGE_KEY) || THEMES.system;
	},

	/**
	 * Save theme preference to localStorage
	 * @param {string} theme Theme to save
	 */
	saveTheme(theme) {
		if (Object.values(THEMES).includes(theme)) {
			localStorage.setItem(STORAGE_KEY, theme);
		}
	},

	/**
	 * Apply theme to document
	 * @param {string} theme Theme to apply
	 */
	applyTheme(theme) {
		// Save theme preference
		this.saveTheme(theme);

		// Apply appropriate theme
		if (theme === THEMES.system) {
			this.applySystemTheme();
		} else {
			document.documentElement.setAttribute('data-bs-theme', theme);
			document.body.className = document.body.className
				.replace(/theme-(light|dark)/g, '')
				.trim();
			document.body.classList.add(`theme-${theme}`);
		}

		// Dispatch theme change event
		document.dispatchEvent(new CustomEvent('themechange', {
			detail: { theme: this.getEffectiveTheme() }
		}));
	},

	/**
	 * Apply system theme based on user's OS preference
	 */
	applySystemTheme() {
		const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		const theme = prefersDark ? THEMES.dark : THEMES.light;

		document.documentElement.setAttribute('data-bs-theme', theme);
		document.body.className = document.body.className
			.replace(/theme-(light|dark)/g, '')
			.trim();
		document.body.classList.add(`theme-${theme}`);
	},

	/**
	 * Get the currently effective theme (resolves 'system' to actual theme)
	 * @returns {string} 'light' or 'dark'
	 */
	getEffectiveTheme() {
		const savedTheme = this.getSavedTheme();
		if (savedTheme !== THEMES.system) {
			return savedTheme;
		}

		return window.matchMedia('(prefers-color-scheme: dark)').matches
			? THEMES.dark
			: THEMES.light;
	},

	/**
	 * Initialize theme control elements
	 */
	initializeThemeControls() {
		// Look for theme toggle buttons or radios
		document.querySelectorAll('[name="theme"]').forEach(radio => {
			// Set initial state
			if (radio.value === this.getSavedTheme()) {
				radio.checked = true;
			}

			// Add change listener
			radio.addEventListener('change', () => {
				if (radio.checked) {
					this.applyTheme(radio.value);
				}
			});
		});

		// Theme toggle button (if present)
		document.querySelectorAll('.theme-toggle').forEach(toggle => {
			toggle.addEventListener('click', () => {
				const currentTheme = this.getEffectiveTheme();
				this.applyTheme(currentTheme === THEMES.dark ? THEMES.light : THEMES.dark);
			});
		});
	}
};

// Export the theme system globally
window.ThemeSystem = ThemeSystem;

// Auto-initialize on page load
document.addEventListener('DOMContentLoaded', () => {
	ThemeSystem.initialize();
});