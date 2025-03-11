/**
 * mobile-navigation.js - Improved mobile navigation for Kiyo Dashboard
 */

/**
 * Initialize mobile navigation
 */
function initMobileNavigation() {
	const sidebarToggle = document.querySelector('.navbar-toggle');
	const sidebar = document.querySelector('.sidebar');
	const mainContent = document.querySelector('.main-content');

	if (!sidebarToggle || !sidebar) return;

	// Toggle sidebar when button is clicked
	sidebarToggle.addEventListener('click', (e) => {
		e.preventDefault();
		e.stopPropagation();
		sidebar.classList.toggle('show');
		document.body.classList.toggle('sidebar-open');
	});

	// Add overlay for mobile when sidebar is open
	const overlay = document.createElement('div');
	overlay.className = 'sidebar-overlay';
	document.body.appendChild(overlay);

	// Close sidebar when clicking overlay
	overlay.addEventListener('click', () => {
		sidebar.classList.remove('show');
		document.body.classList.remove('sidebar-open');
	});

	// Close sidebar when clicking outside on mobile
	document.addEventListener('click', (e) => {
		if (window.innerWidth < 992 &&
			document.body.classList.contains('sidebar-open') &&
			!e.target.closest('.sidebar') &&
			!e.target.closest('.navbar-toggle')) {
			sidebar.classList.remove('show');
			document.body.classList.remove('sidebar-open');
		}
	});

	// Add swipe gestures for mobile
	let touchStartX = 0;
	let touchEndX = 0;

	// Track touch start position
	document.addEventListener('touchstart', (e) => {
		touchStartX = e.changedTouches[0].screenX;
	}, { passive: true });

	// Handle swipe gesture
	document.addEventListener('touchend', (e) => {
		touchEndX = e.changedTouches[0].screenX;
		handleSwipeGesture();
	}, { passive: true });

	/**
	 * Handle swipe gesture to open/close sidebar
	 */
	function handleSwipeGesture() {
		const SWIPE_THRESHOLD = 100;
		const isRightSwipe = touchEndX - touchStartX > SWIPE_THRESHOLD;
		const isLeftSwipe = touchStartX - touchEndX > SWIPE_THRESHOLD;

		// Right swipe to open sidebar
		if (isRightSwipe && touchStartX < 50 && !sidebar.classList.contains('show')) {
			sidebar.classList.add('show');
			document.body.classList.add('sidebar-open');
		}

		// Left swipe to close sidebar
		if (isLeftSwipe && sidebar.classList.contains('show')) {
			sidebar.classList.remove('show');
			document.body.classList.remove('sidebar-open');
		}
	}

	// Handle window resize (e.g., orientation change)
	window.addEventListener('resize', () => {
		if (window.innerWidth >= 992) {
			sidebar.classList.remove('show');
			document.body.classList.remove('sidebar-open');
		}
	});
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initMobileNavigation);

// Export for use in other files
window.MobileNavigation = {
	initialize: initMobileNavigation
};