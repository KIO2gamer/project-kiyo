/**
 * Server Settings Manager for Kiyo Discord Bot Dashboard
 * Handles loading, displaying and saving server settings
 */

class ServerSettingsManager {
	constructor(containerId, guildId) {
		this.containerId = containerId;
		this.guildId = guildId;
		this.container = document.getElementById(containerId);
		this.settings = null;
		this.isLoading = false;
		this.isSaving = false;

		// Bind methods
		this.initialize = this.initialize.bind(this);
		this.loadSettings = this.loadSettings.bind(this);
		this.renderSettings = this.renderSettings.bind(this);
		this.saveSettings = this.saveSettings.bind(this);
		this.collectFormData = this.collectFormData.bind(this);
		this.handleFormSubmit = this.handleFormSubmit.bind(this);

		// Auto-initialize if guildId is provided
		if (guildId && this.container) {
			this.initialize();
		}
	}

	/**
	 * Initializes the settings manager
	 * @param {string} guildId - Optional guild ID to override constructor
	 */
	async initialize(guildId = null) {
		if (guildId) this.guildId = guildId;

		if (!this.guildId) {
			this.showError('No server ID provided');
			return;
		}

		if (!this.container) {
			console.error(`Container with ID "${this.containerId}" not found`);
			return;
		}

		await this.loadSettings();
	}

	/**
	 * Loads server settings from API
	 */
	async loadSettings() {
		if (this.isLoading) return;

		try {
			this.isLoading = true;
			this.showLoading();

			// Set a timeout for the request
			const timeoutPromise = new Promise((_, reject) => {
				setTimeout(() => reject(new Error('Request timed out')), 10000); // 10 seconds timeout
			});

			// Use API service if available, otherwise fallback
			let settingsPromise;
			if (window.apiService) {
				settingsPromise = window.apiService.getServerSettings(this.guildId);
			} else {
				settingsPromise = fetch(`/.netlify/functions/dashboardApi/guilds/${this.guildId}/settings`, {
					credentials: 'include'
				}).then(response => {
					if (!response.ok) {
						if (response.status === 401) {
							window.location.href = '/.netlify/functions/dashboardAuth';
							return;
						}
						if (response.status === 404) {
							throw new Error('Server settings not found. The bot might not be in this server yet.');
						}
						if (response.status === 403) {
							throw new Error('You do not have permission to access these settings.');
						}
						throw new Error(`Failed to load settings: ${response.status}`);
					}
					return response.json();
				});
			}

			// Race the request against the timeout
			this.settings = await Promise.race([settingsPromise, timeoutPromise]);
			this.renderSettings();
		} catch (error) {
			console.error('Error loading server settings:', error);

			// Determine appropriate error message
			let errorMessage = 'Failed to load server settings';
			if (error.message.includes('timed out')) {
				errorMessage = 'The request timed out. Please check your connection and try again.';
			} else if (error.message.includes('not found')) {
				errorMessage = error.message;
			} else if (error.message.includes('permission')) {
				errorMessage = error.message;
			}

			this.showError(errorMessage);
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Shows loading state in the container
	 */
	showLoading() {
		this.container.innerHTML = `
      <div class="text-center p-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Loading server settings...</p>
      </div>
    `;
	}

	/**
	 * Shows error message in the container
	 * @param {string} message - Error message to display
	 */
	showError(message) {
		// Special case for "settings not found" error
		if (message.includes('not found') && message.includes('settings')) {
			this.showInitializationScreen();
			return;
		}

		this.container.innerHTML = `
      <div class="alert alert-danger" role="alert">
        <h4 class="alert-heading">Error</h4>
        <p>${message}</p>
        <hr>
        <div class="d-flex flex-column flex-md-row gap-2">
          <button class="btn btn-outline-danger" onclick="this.closest('.settings-container').settingsManager.loadSettings()">
            <i class="bi bi-arrow-clockwise me-2"></i>Try Again
          </button>
          <a href="/dashboard/servers" class="btn btn-outline-secondary">
            <i class="bi bi-arrow-left me-2"></i>Back to Servers
          </a>
          <button class="btn btn-link" onclick="showDebugInfo()">
            Show Debug Info
          </button>
        </div>
      </div>

      <script>
        function showDebugInfo() {
          const debugInfo = {
            guildId: '${this.guildId}',
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          };
          
          const debugModal = document.createElement('div');
          debugModal.className = 'modal fade';
          debugModal.id = 'debugInfoModal';
          debugModal.innerHTML = \`
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title">Debug Information</h5>
                  <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                  <p>Please share this information with support:</p>
                  <pre class="bg-light p-3"><code>\${JSON.stringify(debugInfo, null, 2)}</code></pre>
                </div>
                <div class="modal-footer">
                  <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Close</button>
                  <button type="button" class="btn btn-primary" onclick="navigator.clipboard.writeText(JSON.stringify(debugInfo, null, 2)).then(() => showToast('success', 'Debug info copied to clipboard'))">
                    Copy to Clipboard
                  </button>
                </div>
              </div>
            </div>
          \`;
          
          document.body.appendChild(debugModal);
          const modal = new bootstrap.Modal(document.getElementById('debugInfoModal'));
          modal.show();
        }
      </script>
    `;

		// Store reference to manager in the container for retry action
		this.container.settingsManager = this;
	}

	/**
	 * Shows server initialization screen when settings don't exist yet
	 */
	showInitializationScreen() {
		this.container.innerHTML = `
      <div class="card">
        <div class="card-body text-center p-5">
          <i class="bi bi-robot text-primary" style="font-size: 4rem;"></i>
          <h2 class="my-4">Welcome to Kiyo Bot!</h2>
          <p class="mb-4 lead">This server hasn't been configured yet. Initialize settings to start using Kiyo's features.</p>
          
          <div class="d-grid gap-2 d-md-block">
            <button class="btn btn-primary btn-lg" id="initialize-settings">
              <i class="bi bi-magic me-2"></i>Initialize Default Settings
            </button>
            <a href="/dashboard/servers" class="btn btn-outline-secondary btn-lg">
              <i class="bi bi-arrow-left me-2"></i>Back to Servers
            </a>
          </div>
        </div>
      </div>
    `;

		// Add event listener for initialization button
		const initBtn = document.getElementById('initialize-settings');
		if (initBtn) {
			initBtn.addEventListener('click', () => this.initializeServerSettings());
		}

		// Store reference to manager
		this.container.settingsManager = this;
	}

	/**
	 * Initializes default server settings
	 */
	async initializeServerSettings() {
		if (!this.guildId) return;

		try {
			// Show loading state
			const initBtn = document.getElementById('initialize-settings');
			if (initBtn) {
				initBtn.disabled = true;
				initBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Setting up...';
			}

			// Default settings to initialize
			const defaultSettings = {
				prefix: '!',
				premium_enabled: false,
				log_channel: null,
				welcome: {
					enabled: false,
					channel: null,
					message: 'Welcome {user} to {server}! You are our {memberCount}th member.',
					dm: false
				},
				moderation: {
					logging: false,
					log_channel: null,
					automod_level: 0,
					muted_role: null
				}
			};

			// Save settings via API
			if (window.apiService) {
				this.settings = await window.apiService.updateServerSettings(this.guildId, defaultSettings);
			} else {
				const response = await fetch(`/.netlify/functions/dashboardApi/guilds/${this.guildId}/settings`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify(defaultSettings)
				});

				if (!response.ok) {
					throw new Error(`Failed to initialize settings: ${response.status}`);
				}

				this.settings = await response.json();
			}

			// Show success message
			if (window.showToast) {
				window.showToast('success', 'Settings initialized successfully!');
			}

			// Render the settings form now that we have settings
			this.renderSettings();
		} catch (error) {
			console.error('Error initializing server settings:', error);
			this.showError(error.message || 'Failed to initialize server settings');
		}
	}

	/**
	 * Renders settings form in the container
	 */
	renderSettings() {
		if (!this.settings) return;

		// Clear any existing content
		this.container.innerHTML = '';

		// Create settings form
		const form = document.createElement('form');
		form.id = 'settings-form';
		form.className = 'needs-validation';
		form.noValidate = true;

		// Add server information section
		const serverInfo = this.createServerInfoSection();
		form.appendChild(serverInfo);

		// Add general settings section
		const generalSettings = this.createGeneralSettingsSection();
		form.appendChild(generalSettings);

		// Add welcome settings section
		const welcomeSettings = this.createWelcomeSettingsSection();
		form.appendChild(welcomeSettings);

		// Add moderation settings section
		const moderationSettings = this.createModerationSettingsSection();
		form.appendChild(moderationSettings);

		// Add form actions
		const actions = document.createElement('div');
		actions.className = 'row mt-4 mb-2';
		actions.innerHTML = `
      <div class="col-12 d-flex justify-content-between">
        <button type="button" class="btn btn-secondary" id="reset-settings">
          <i class="bi bi-arrow-counterclockwise me-2"></i>Reset
        </button>
        <button type="submit" class="btn btn-primary" id="save-settings">
          <i class="bi bi-save me-2"></i>Save Settings
        </button>
      </div>
    `;
		form.appendChild(actions);

		// Add form submit handler
		form.addEventListener('submit', this.handleFormSubmit);

		// Add reset handler
		form.querySelector('#reset-settings').addEventListener('click', () => {
			if (confirm('Are you sure you want to reset your changes?')) {
				this.renderSettings();
			}
		});

		// Append form to container
		this.container.appendChild(form);

		// Initialize any Bootstrap components in the form
		if (typeof bootstrap !== 'undefined') {
			// Initialize tooltips
			const tooltips = [].slice.call(form.querySelectorAll('[data-bs-toggle="tooltip"]'));
			tooltips.map(el => new bootstrap.Tooltip(el));

			// Initialize any other Bootstrap components as needed
		}
	}

	/**
	 * Creates server information section
	 * @returns {HTMLElement} Section element
	 */
	createServerInfoSection() {
		const section = document.createElement('div');
		section.className = 'card mb-4';

		const serverIcon = this.settings.guild.icon
			? `https://cdn.discordapp.com/icons/${this.guildId}/${this.settings.guild.icon}.png?size=128`
			: 'https://cdn.discordapp.com/embed/avatars/0.png';

		section.innerHTML = `
      <div class="card-body">
        <div class="d-flex align-items-center mb-3">
          <img src="${serverIcon}" alt="${this.settings.guild.name}" class="me-3 rounded" width="64" height="64">
          <div>
            <h2 class="card-title mb-0">${this.settings.guild.name}</h2>
            <p class="text-muted mb-0">Server Settings</p>
          </div>
        </div>
        <div class="server-stats d-flex flex-wrap">
          <div class="me-4">
            <i class="bi bi-people-fill me-2"></i>
            <span>${this.settings.guild.memberCount || 'N/A'} members</span>
          </div>
          <div class="me-4">
            <i class="bi bi-hash me-2"></i>
            <span>${this.settings.guild.channels?.length || 'N/A'} channels</span>
          </div>
          <div>
            <i class="bi bi-shield-fill me-2"></i>
            <span>${this.settings.guild.roles?.length || 'N/A'} roles</span>
          </div>
        </div>
      </div>
    `;

		return section;
	}

	/**
	 * Creates general settings section
	 * @returns {HTMLElement} Section element
	 */
	createGeneralSettingsSection() {
		const section = document.createElement('div');
		section.className = 'card mb-4';

		section.innerHTML = `
      <div class="card-header">
        <h3 class="card-title mb-0">
          <i class="bi bi-gear-fill me-2"></i>General Settings
        </h3>
      </div>
      <div class="card-body">
        <div class="mb-3">
          <label for="prefix" class="form-label">Command Prefix</label>
          <div class="input-group">
            <span class="input-group-text"><i class="bi bi-terminal"></i></span>
            <input type="text" class="form-control" id="prefix" name="prefix" 
              value="${this.settings.prefix || '!'}" placeholder="!" maxlength="5" required>
            <div class="invalid-feedback">Prefix cannot be empty</div>
          </div>
          <div class="form-text">The prefix used for text commands. Slash commands will work regardless.</div>
        </div>
        
        <div class="form-check form-switch mb-3">
          <input class="form-check-input" type="checkbox" role="switch" id="premium-features" name="premium_enabled"
            ${this.settings.premium_enabled ? 'checked' : ''} ${!this.settings.premium_available ? 'disabled' : ''}>
          <label class="form-check-label" for="premium-features">
            Enable Premium Features
            ${!this.settings.premium_available ? '<span class="badge bg-secondary ms-2">Unavailable</span>' : ''}
          </label>
        </div>
        
        <div class="mb-3">
          <label for="log-channel" class="form-label">Log Channel</label>
          <select class="form-select" id="log-channel" name="log_channel">
            <option value="">None</option>
            ${this.generateChannelOptions(this.settings.guild.channels, this.settings.log_channel)}
          </select>
          <div class="form-text">Channel where bot activity will be logged</div>
        </div>
      </div>
    `;

		return section;
	}

	/**
	 * Creates welcome settings section
	 * @returns {HTMLElement} Section element
	 */
	createWelcomeSettingsSection() {
		const section = document.createElement('div');
		section.className = 'card mb-4';

		section.innerHTML = `
      <div class="card-header">
        <h3 class="card-title mb-0">
          <i class="bi bi-door-open-fill me-2"></i>Welcome Settings
        </h3>
      </div>
      <div class="card-body">
        <div class="form-check form-switch mb-3">
          <input class="form-check-input" type="checkbox" role="switch" id="welcome-enabled" name="welcome.enabled"
            ${this.settings.welcome?.enabled ? 'checked' : ''}>
          <label class="form-check-label" for="welcome-enabled">
            Enable Welcome Messages
          </label>
        </div>
        
        <div class="mb-3">
          <label for="welcome-channel" class="form-label">Welcome Channel</label>
          <select class="form-select" id="welcome-channel" name="welcome.channel" 
            ${!this.settings.welcome?.enabled ? 'disabled' : ''}>
            <option value="">None</option>
            ${this.generateChannelOptions(this.settings.guild.channels, this.settings.welcome?.channel)}
          </select>
        </div>
        
        <div class="mb-3">
          <label for="welcome-message" class="form-label">Welcome Message</label>
          <textarea class="form-control" id="welcome-message" name="welcome.message" rows="3"
            placeholder="Welcome {user} to {server}!" ${!this.settings.welcome?.enabled ? 'disabled' : ''}
          >${this.settings.welcome?.message || ''}</textarea>
          <div class="form-text">
            Available variables: {user}, {server}, {memberCount}
          </div>
        </div>
        
        <div class="form-check form-switch mb-3">
          <input class="form-check-input" type="checkbox" role="switch" id="welcome-dm" name="welcome.dm"
            ${this.settings.welcome?.dm ? 'checked' : ''} ${!this.settings.welcome?.enabled ? 'disabled' : ''}>
          <label class="form-check-label" for="welcome-dm">
            Also send welcome message as DM
          </label>
        </div>
      </div>
    `;

		// Add event listener to enable/disable related fields
		section.querySelector('#welcome-enabled').addEventListener('change', (e) => {
			const fields = section.querySelectorAll('#welcome-channel, #welcome-message, #welcome-dm');
			fields.forEach(field => {
				field.disabled = !e.target.checked;
			});
		});

		return section;
	}

	/**
	 * Creates moderation settings section
	 * @returns {HTMLElement} Section element
	 */
	createModerationSettingsSection() {
		const section = document.createElement('div');
		section.className = 'card mb-4';

		section.innerHTML = `
      <div class="card-header">
        <h3 class="card-title mb-0">
          <i class="bi bi-shield-fill me-2"></i>Moderation Settings
        </h3>
      </div>
      <div class="card-body">
        <div class="form-check form-switch mb-3">
          <input class="form-check-input" type="checkbox" role="switch" id="mod-logging" name="moderation.logging"
            ${this.settings.moderation?.logging ? 'checked' : ''}>
          <label class="form-check-label" for="mod-logging">
            Enable Moderation Logging
          </label>
        </div>
        
        <div class="mb-3">
          <label for="mod-log-channel" class="form-label">Moderation Log Channel</label>
          <select class="form-select" id="mod-log-channel" name="moderation.log_channel"
            ${!this.settings.moderation?.logging ? 'disabled' : ''}>
            <option value="">Same as general log channel</option>
            ${this.generateChannelOptions(this.settings.guild.channels, this.settings.moderation?.log_channel)}
          </select>
        </div>
        
        <div class="mb-3">
          <label for="auto-mod-level" class="form-label">AutoMod Level</label>
          <select class="form-select" id="auto-mod-level" name="moderation.automod_level">
            <option value="0" ${this.settings.moderation?.automod_level === 0 ? 'selected' : ''}>Disabled</option>
            <option value="1" ${this.settings.moderation?.automod_level === 1 ? 'selected' : ''}>Basic (spam, excessive mentions)</option>
            <option value="2" ${this.settings.moderation?.automod_level === 2 ? 'selected' : ''}>Standard (+ profanity, links)</option>
            <option value="3" ${this.settings.moderation?.automod_level === 3 ? 'selected' : ''}>Strict (+ capitals, emotes, duplicates)</option>
          </select>
        </div>
        
        <div class="mb-3">
          <label for="muted-role" class="form-label">Muted Role</label>
          <select class="form-select" id="muted-role" name="moderation.muted_role">
            <option value="">Auto-create when needed</option>
            ${this.generateRoleOptions(this.settings.guild.roles, this.settings.moderation?.muted_role)}
          </select>
        </div>
      </div>
    `;

		// Add event listener to enable/disable related fields
		section.querySelector('#mod-logging').addEventListener('change', (e) => {
			section.querySelector('#mod-log-channel').disabled = !e.target.checked;
		});

		return section;
	}

	/**
	 * Generates options for channel select elements
	 * @param {Array} channels - List of channels
	 * @param {string} selectedId - Selected channel ID
	 * @returns {string} HTML for options
	 */
	generateChannelOptions(channels = [], selectedId) {
		if (!channels || !channels.length) return '';

		const textChannels = channels.filter(c => c.type === 0 || c.type === 5);

		return textChannels.map(channel => `
      <option value="${channel.id}" ${channel.id === selectedId ? 'selected' : ''}>
        #${channel.name}
      </option>
    `).join('');
	}

	/**
	 * Generates options for role select elements
	 * @param {Array} roles - List of roles
	 * @param {string} selectedId - Selected role ID
	 * @returns {string} HTML for options
	 */
	generateRoleOptions(roles = [], selectedId) {
		if (!roles || !roles.length) return '';

		return roles
			.filter(role => !role.managed && role.name !== '@everyone')
			.sort((a, b) => b.position - a.position)
			.map(role => `
        <option value="${role.id}" ${role.id === selectedId ? 'selected' : ''}>
          ${role.name}
        </option>
      `).join('');
	}

	/**
	 * Handles form submission
	 * @param {Event} e - Submit event
	 */
	async handleFormSubmit(e) {
		e.preventDefault();

		// Validate form
		const form = e.target;
		if (!form.checkValidity()) {
			e.stopPropagation();
			form.classList.add('was-validated');
			return;
		}

		// Collect form data
		const formData = this.collectFormData(form);

		// Save settings
		await this.saveSettings(formData);
	}

	/**
	 * Collects and structures form data
	 * @param {HTMLFormElement} form - Settings form
	 * @returns {Object} Structured settings data
	 */
	collectFormData(form) {
		const formData = new FormData(form);
		const settings = {};

		// Process flat fields
		settings.prefix = formData.get('prefix');
		settings.premium_enabled = formData.has('premium_enabled');
		settings.log_channel = formData.get('log_channel') || null;

		// Process welcome settings
		settings.welcome = {
			enabled: formData.has('welcome.enabled'),
			channel: formData.get('welcome.channel') || null,
			message: formData.get('welcome.message') || '',
			dm: formData.has('welcome.dm')
		};

		// Process moderation settings
		settings.moderation = {
			logging: formData.has('moderation.logging'),
			log_channel: formData.get('moderation.log_channel') || null,
			automod_level: parseInt(formData.get('moderation.automod_level') || '0', 10),
			muted_role: formData.get('moderation.muted_role') || null
		};

		return settings;
	}

	/**
	 * Saves settings to API
	 * @param {Object} settings - Settings to save
	 */
	async saveSettings(settings) {
		if (this.isSaving) return;

		try {
			this.isSaving = true;

			// Show saving state
			const saveBtn = document.getElementById('save-settings');
			const originalBtnText = saveBtn.innerHTML;
			saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
			saveBtn.disabled = true;

			// Use API service if available, otherwise fallback
			let result;
			if (window.apiService) {
				result = await window.apiService.updateServerSettings(this.guildId, settings);
			} else {
				const response = await fetch(`/.netlify/functions/dashboardApi/guilds/${this.guildId}/settings`, {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json'
					},
					credentials: 'include',
					body: JSON.stringify(settings)
				});

				if (!response.ok) {
					if (response.status === 401) {
						window.location.href = '/.netlify/functions/dashboardAuth';
						return;
					}

					// Try to get error message from response
					let errorMsg = `Failed to save settings: ${response.status}`;
					try {
						const errorData = await response.json();
						if (errorData.error) errorMsg = errorData.error;
					} catch (e) {
						// Ignore JSON parse error
					}

					throw new Error(errorMsg);
				}

				result = await response.json();
			}

			// Update settings object with returned data
			this.settings = result;

			// Show success message
			if (window.showToast) {
				window.showToast('success', 'Settings saved successfully!');
			} else {
				alert('Settings saved successfully!');
			}

		} catch (error) {
			console.error('Error saving settings:', error);

			// Show error message
			if (window.showToast) {
				window.showToast('error', error.message || 'Failed to save settings');
			} else {
				alert(`Error: ${error.message || 'Failed to save settings'}`);
			}

		} finally {
			this.isSaving = false;

			// Restore button state
			const saveBtn = document.getElementById('save-settings');
			if (saveBtn) {
				saveBtn.innerHTML = originalBtnText || '<i class="bi bi-save me-2"></i>Save Settings';
				saveBtn.disabled = false;
			}
		}
	}
}

// Export the class globally
window.ServerSettingsManager = ServerSettingsManager;

// Initialize on DOMContentLoaded if guildId is specified in URL
document.addEventListener('DOMContentLoaded', () => {
	// Look for server settings container and guild ID
	const container = document.getElementById('server-settings-container');
	const guildIdEl = document.getElementById('guild-id');

	if (container && guildIdEl) {
		const guildId = guildIdEl.value;
		if (guildId) {
			// Create and initialize settings manager
			new ServerSettingsManager('server-settings-container', guildId);
		}
	}
});
