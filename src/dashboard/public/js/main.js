// Show loading spinner
function showLoading(button) {
	const originalText = button.innerHTML;
	button.disabled = true;
	button.innerHTML = `
        <div class="loading-spinner inline-block mr-2"></div>
        Loading...
    `;
	return originalText;
}

// Hide loading spinner
function hideLoading(button, originalText) {
	button.disabled = false;
	button.innerHTML = originalText;
}

// Handle form submissions
document.addEventListener('DOMContentLoaded', () => {
	const forms = document.querySelectorAll('form');
	forms.forEach(form => {
		form.addEventListener('submit', async (e) => {
			e.preventDefault();
			const submitButton = form.querySelector('button[type="submit"]');
			const originalText = showLoading(submitButton);

			try {
				const formData = new FormData(form);
				const data = Object.fromEntries(formData.entries());

				const response = await fetch(form.action, {
					method: form.method,
					headers: {
						'Content-Type': 'application/json',
					},
					body: JSON.stringify(data),
				});

				if (!response.ok) {
					throw new Error('Network response was not ok');
				}

				const result = await response.json();
				showNotification('Success!', 'Changes saved successfully.', 'success');
			} catch (error) {
				console.error('Error:', error);
				showNotification('Error!', 'Something went wrong. Please try again.', 'error');
			} finally {
				hideLoading(submitButton, originalText);
			}
		});
	});
});

// Show notification
function showNotification(title, message, type = 'info') {
	const notification = document.createElement('div');
	notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg max-w-sm animate-fade-in
        ${type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'} text-white`;

	notification.innerHTML = `
        <h4 class="font-bold mb-1">${title}</h4>
        <p>${message}</p>
    `;

	document.body.appendChild(notification);

	setTimeout(() => {
		notification.style.opacity = '0';
		setTimeout(() => {
			notification.remove();
		}, 300);
	}, 3000);
}

// Handle mobile menu
const mobileMenuButton = document.querySelector('[data-mobile-menu-button]');
const mobileMenu = document.querySelector('[data-mobile-menu]');

if (mobileMenuButton && mobileMenu) {
	mobileMenuButton.addEventListener('click', () => {
		const isExpanded = mobileMenuButton.getAttribute('aria-expanded') === 'true';
		mobileMenuButton.setAttribute('aria-expanded', !isExpanded);
		mobileMenu.classList.toggle('hidden');
	});
}

// Handle dropdowns
document.addEventListener('click', (e) => {
	const dropdown = e.target.closest('[data-dropdown]');
	if (!dropdown) return;

	const dropdownMenu = dropdown.querySelector('[data-dropdown-menu]');
	if (!dropdownMenu) return;

	e.preventDefault();
	dropdownMenu.classList.toggle('hidden');
});

// Close dropdowns when clicking outside
document.addEventListener('click', (e) => {
	if (!e.target.closest('[data-dropdown]')) {
		document.querySelectorAll('[data-dropdown-menu]').forEach(menu => {
			if (!menu.classList.contains('hidden')) {
				menu.classList.add('hidden');
			}
		});
	}
});

// Handle tabs
const tabButtons = document.querySelectorAll('[data-tab-button]');
const tabPanels = document.querySelectorAll('[data-tab-panel]');

tabButtons.forEach(button => {
	button.addEventListener('click', () => {
		const targetPanel = button.getAttribute('data-tab-button');

		tabButtons.forEach(btn => btn.classList.remove('active'));
		tabPanels.forEach(panel => panel.classList.add('hidden'));

		button.classList.add('active');
		document.querySelector(`[data-tab-panel="${targetPanel}"]`).classList.remove('hidden');
	});
}); 