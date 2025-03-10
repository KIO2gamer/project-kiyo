/**
 * server-management.js - Server management functionality for Kiyo Dashboard
 * Handles server details, configuration, and management actions
 */

// Constants
const API_BASE = '/.netlify/functions/dashboardApi';

// Cache for current server data
let currentServer = null;
let currentServerId = null;

/**
 * Initialize server management functionality
 */
document.addEventListener('DOMContentLoaded', async () => {
	// Check for server ID in URL query params
	const urlParams = new URLSearchParams(window.location.search);
	const serverId = urlParams.get('id');

	// Initialize event listeners for server action buttons
	initializeActionListeners();

	// If server ID was provided, load that specific server
	if (serverId) {
		await loadServerDetails(serverId);
	}

	// Add event listener for add server button
	initializeAddServerButton();
});

/**
 * Initialize event listeners for server action buttons
 */
function initializeActionListeners() {
	document.querySelectorAll('.server-action').forEach(link => {
		link.addEventListener('click', function (e) {
			e.preventDefault();
			const action = this.getAttribute('data-action');
			handleServerAction(action, currentServerId);
		});
	});
}

/**
 * Initialize the add server button
 */
async function initializeAddServerButton() {
	const addServerLink = document.getElementById('add-server-link');
	if (!addServerLink) return;

	try {
		const response = await fetchWithAuth(`${API_BASE}/config`);
		if (response.ok) {
			const data = await response.json();
			if (data.inviteUrl) {
				addServerLink.href = data.inviteUrl;
			}
		}
	} catch (error) {
		console.error('Failed to fetch bot invite URL:', error);
	}
}

/**
 * Load server details by server ID
 * @param {string} serverId - Discord server ID
 */
async function loadServerDetails(serverId) {
	if (!serverId) return;

	try {
		// Show loading state
		document.getElementById('server-details-section').style.display = 'block';
		document.getElementById('selected-server-name').textContent = 'Loading server details...';

		// Fetch server details from API
		const response = await fetchWithAuth(`${API_BASE}/guilds/${serverId}`);
		if (!response.ok) {
			throw new Error(`Failed to fetch server details: ${response.status}`);
		}

		// Parse server data
		const server = await response.json();
		currentServer = server;
		currentServerId = serverId;

		// Update UI with server details
		updateServerDetailsUI(server);

		// Fetch server configuration
		await loadServerConfiguration(serverId);

		// Highlight this server in the grid if needed
		highlightSelectedServer(serverId);

	} catch (error) {
		console.error('Error loading server details:', error);
		document.getElementById('server-details-section').innerHTML =
			'<div class="alert alert-danger">Failed to load server details. Please try again later.</div>';
	}
}

/**
 * Update the server details UI with server data
 * @param {Object} server - Server data object
 */
function updateServerDetailsUI(server) {
	// Set server name and title
	document.getElementById('selected-server-name').textContent = `${server.name} - Server Details`;
	document.getElementById('selected-server-title').textContent = server.name;

	// Set server icon
	const serverIcon = server.icon
		? `https://cdn.discordapp.com/icons/${server.id}/${server.icon}.png?size=256`
		: '/assets/img/default-server.png';
	document.getElementById('selected-server-icon').src = serverIcon;

	// Update stats
	document.getElementById('server-member-count').textContent = server.memberCount || 'N/A';
	document.getElementById('server-channel-count').textContent = server.channels || 'N/A';

	// Format creation date
	const creationTimestamp = server.createdAt || server.id ? calculateSnowflakeTimestamp(server.id) : null;
	const creationDate = creationTimestamp
		? new Date(creationTimestamp).toLocaleDateString()
		: 'Unknown';
	document.getElementById('server-creation-date').textContent = creationDate;
}

/**
 * Load server configuration from API
 * @param {string} serverId - Discord server ID
 */
async function loadServerConfiguration(serverId) {
	try {
		const response = await fetchWithAuth(`${API_BASE}/guilds/${serverId}/config`);
		if (!response.ok) {
			throw new Error(`Failed to load server configuration: ${response.status}`);
		}

		const config = await response.json();

		// Store the configuration data for later use
		currentServer.config = config;

		// Update UI elements based on config if needed
		updateConfigurationUI(config);

	} catch (error) {
		console.error('Error loading server configuration:', error);
		showToast('error', 'Failed to load server configuration');
	}
}

/**
 * Update UI based on server configuration
 * @param {Object} config - Server configuration data
 */
function updateConfigurationUI(config) {
	// This function will be implemented based on specific configuration needs
	// For now, it's a placeholder
}

/**
 * Handle server action button clicks
 * @param {string} action - Action identifier (welcome, moderation, commands, stats)
 * @param {string} serverId - Discord server ID
 */
function handleServerAction(action, serverId) {
	if (!serverId) {
		showToast('error', 'No server selected');
		return;
	}

	switch (action) {
		case 'welcome':
			showWelcomeMessageEditor(serverId);
			break;
		case 'moderation':
			window.location.href = `/dashboard/moderation?id=${serverId}`;
			break;
		case 'commands':
			window.location.href = `/dashboard/commands?id=${serverId}`;
			break;
		case 'stats':
			window.location.href = `/dashboard/stats?id=${serverId}`;
			break;
		default:
			console.warn(`Unknown action: ${action}`);
	}
}

/**
 * Show welcome message configuration modal
 * @param {string} serverId - Discord server ID
 */
async function showWelcomeMessageEditor(serverId) {
	// Check if we already have server config loaded
	if (!currentServer || !currentServer.config) {
		await loadServerConfiguration(serverId);
	}

	// Create modal if it doesn't exist
	if (!document.getElementById('welcomeConfigModal')) {
		createWelcomeModal();
	}

	// Populate fields with current config
	const config = currentServer.config;
	const welcomeMessage = config.welcomeMessage || '';
	const welcomeChannel = config.welcomeChannel || '';

	document.getElementById('welcome-message').value = welcomeMessage;
	document.getElementById('welcome-channel').value = welcomeChannel;

	// Fetch channels for dropdown
	await populateChannelDropdown(serverId);

	// Show the modal
	const welcomeModal = new bootstrap.Modal(document.getElementById('welcomeConfigModal'));
	welcomeModal.show();
}

/**
 * Create welcome message modal
 */
function createWelcomeModal() {
	const modalHtml = `
		<div class="modal fade" id="welcomeConfigModal" tabindex="-1" aria-labelledby="welcomeConfigModalLabel" aria-hidden="true">
			<div class="modal-dialog modal-lg">
				<div class="modal-content">
					<div class="modal-header">
						<h5 class="modal-title" id="welcomeConfigModalLabel">Configure Welcome Messages</h5>
						<button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
					</div>
					<div class="modal-body">
						<form id="welcome-config-form">
							<div class="mb-3">
								<label for="welcome-channel" class="form-label">Welcome Channel</label>
								<select class="form-select" id="welcome-channel" required>
									<option value="">Select a channel...</option>
								</select>
								<div class="form-text">Choose the channel where welcome messages will be sent</div>
							</div>
							<div class="mb-3">
								<label for="welcome-message" class="form-label">Welcome Message</label>
								<textarea class="form-control" id="welcome-message" rows="5" placeholder="Welcome {user} to {server}!" oninput="previewWelcomeMessage()"></textarea>
								<div class="form-text">
									Available placeholders:
									<ul class="mt-2">
										<li><code>{user}</code> - Mentions the new user</li>
										<li><code>{username}</code> - New user's name</li>
										<li><code>{server}</code> - Server name</li>
										<li><code>{memberCount}</code> - Current member count</li>
									</ul>
								</div>
								<div id="welcome-message-preview"></div>
							</div>
						</form>
					</div>
					<div class="modal-footer">
						<button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
						<button type="button" class="btn btn-primary" id="save-welcome-config">Save Changes</button>
					</div>
				</div>
			</div>
		</div>
	`;

	// Append to body
	const div = document.createElement('div');
	div.innerHTML = modalHtml.trim();
	document.body.appendChild(div.firstChild);

	// Add event listener to save button
	document.getElementById('save-welcome-config').addEventListener('click', saveWelcomeConfig);
}

/**
 * Populate channel dropdown with server text channels
 * @param {string} serverId - Discord server ID
 */
async function populateChannelDropdown(serverId) {
	try {
		const response = await fetchWithAuth(`${API_BASE}/guilds/${serverId}/channels`);
		if (!response.ok) {
			throw new Error(`Failed to fetch server channels: ${response.status}`);
		}

		const { channels } = await response.json();
		const dropdown = document.getElementById('welcome-channel');
		const currentValue = dropdown.value;

		// Clear existing options except the first one
		while (dropdown.options.length > 1) {
			dropdown.remove(1);
		}

		// Add text channels to dropdown
		channels.filter(channel => channel.type === 0).forEach(channel => {
			const option = document.createElement('option');
			option.value = channel.id;
			option.textContent = `#${channel.name}`;
			dropdown.appendChild(option);
		});

		// Restore selected value if it exists
		if (currentValue && Array.from(dropdown.options).some(opt => opt.value === currentValue)) {
			dropdown.value = currentValue;
		}

	} catch (error) {
		console.error('Error fetching server channels:', error);
		showToast('error', 'Failed to load server channels');
	}
}

/**
 * Save welcome message configuration
 */
async function saveWelcomeConfig() {
	const welcomeChannel = document.getElementById('welcome-channel').value;
	const welcomeMessage = document.getElementById('welcome-message').value;

	if (!currentServerId) {
		showToast('error', 'No server selected');
		return;
	}

	// Validate inputs
	if (!welcomeChannel) {
		showToast('error', 'Please select a welcome channel');
		return;
	}

	try {
		// Merge with existing config
		const updatedConfig = {
			...currentServer.config,
			welcomeChannel,
			welcomeMessage
		};

		// Save to API
		const response = await postToApi(`guilds/${currentServerId}/config`, updatedConfig);

		// Update local cache
		currentServer.config = response.config;

		// Show success message and close modal
		showToast('success', 'Welcome message configuration saved');
		bootstrap.Modal.getInstance(document.getElementById('welcomeConfigModal')).hide();

	} catch (error) {
		console.error('Error saving welcome configuration:', error);
		showToast('error', 'Failed to save configuration');
	}
}

/**
 * Highlight the selected server in the server grid
 * @param {string} serverId - Discord server ID
 */
function highlightSelectedServer(serverId) {
	// Remove highlight from all servers
	document.querySelectorAll('.server-card').forEach(card => {
		card.classList.remove('selected');
	});

	// Add highlight to selected server
	const serverCards = document.querySelectorAll('.server-card');
	for (const card of serverCards) {
		const link = card.querySelector('a');
		if (link && link.href.includes(`id=${serverId}`)) {
			card.classList.add('selected');
			break;
		}
	}
}

/**
 * Calculate timestamp from Discord Snowflake ID
 * @param {string} snowflake - Discord Snowflake ID
 * @returns {number} Timestamp in milliseconds
 */
function calculateSnowflakeTimestamp(snowflake) {
	// Discord epoch (2015-01-01T00:00:00.000Z)
	const DISCORD_EPOCH = 1420070400000;
	return Number(BigInt(snowflake) >> 22n) + DISCORD_EPOCH;
}

/**
 * Load all servers the user can manage
 */
async function loadServers(page = 1, limit = 12) {
	const serversContainer = document.getElementById('servers-container');
	if (!serversContainer) return;

	try {
		// Show loading state if first page
		if (page === 1) {
			serversContainer.innerHTML = `<div class="text-center py-4">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-2">Loading your servers...</p>
      </div>`;
		} else {
			// Add a loading indicator at the bottom for pagination
			const loadingIndicator = document.createElement('div');
			loadingIndicator.id = 'load-more-indicator';
			loadingIndicator.className = 'text-center py-3';
			loadingIndicator.innerHTML = `<div class="spinner-border spinner-border-sm text-primary" role="status">
        <span class="visually-hidden">Loading more...</span>
      </div>`;
			serversContainer.appendChild(loadingIndicator);
		}

		// Fetch with pagination
		const guilds = await loadManagedServers(page, limit);

		// Remove loading indicators
		if (page === 1) {
			serversContainer.innerHTML = '';
		} else {
			document.getElementById('load-more-indicator')?.remove();
		}

		// Render servers
		// ...existing code to render servers...

		// Add load more button if needed
		if (guilds.hasMore) {
			const loadMoreBtn = document.createElement('div');
			loadMoreBtn.className = 'text-center mt-3';
			loadMoreBtn.innerHTML = `<button class="btn btn-outline-primary" id="load-more-servers">
        Load More Servers
      </button>`;
			serversContainer.appendChild(loadMoreBtn);

			document.getElementById('load-more-servers').addEventListener('click', () => {
				loadServers(page + 1, limit);
			});
		}
	} catch (error) {
		// Error handling...
	}
}

/**
 * Toggle command status for a server
 * @param {string} serverId - Discord server ID
 * @param {string} commandId - Command ID
 * @param {boolean} enabled - Whether command should be enabled
 */
async function toggleCommand(serverId, commandId, enabled) {
	try {
		await postToApi(`guilds/${serverId}/commands/${commandId}`, {
			enabled: enabled
		});

		showToast('success', `Command ${enabled ? 'enabled' : 'disabled'} successfully`);
	} catch (error) {
		console.error('Error toggling command:', error);
		showToast('error', 'Failed to update command status');
	}
}

// Add to site/assets/js/server-management.js
function previewWelcomeMessage() {
	const message = document.getElementById('welcome-message').value;
	const previewContainer = document.getElementById('welcome-message-preview');

	// Replace placeholders with sample values
	let preview = message
		.replace(/{user}/g, '@NewUser')
		.replace(/{username}/g, 'NewUser')
		.replace(/{server}/g, currentServer.name)
		.replace(/{memberCount}/g, currentServer.memberCount || '100');

	previewContainer.innerHTML = `<div class="card p-3 mt-2 mb-0 bg-light">
    <p class="mb-0"><strong>Preview:</strong></p>
    <p class="mb-0">${preview}</p>
  </div>`;
}

// Export functions for global access
window.loadServerDetails = loadServerDetails;
window.loadServers = loadServers;