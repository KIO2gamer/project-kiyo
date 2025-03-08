/**
 * Kiyo Dashboard - Client-side functionality
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
  // Initialize tooltips and popovers if Bootstrap is loaded
  if (typeof bootstrap !== 'undefined') {
    // Initialize all tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltip => {
      new bootstrap.Tooltip(tooltip);
    });
    
    // Initialize all popovers
    const popovers = document.querySelectorAll('[data-bs-toggle="popover"]');
    popovers.forEach(popover => {
      new bootstrap.Popover(popover);
    });
  }
  
  // Setup real-time stat updates if on dashboard page
  setupStatUpdates();
  
  // Add form submission handlers
  setupFormHandlers();
  
  // Add confirmation dialogs
  setupConfirmations();
});

/**
 * Sets up periodic updates for bot stats on the dashboard
 */
function setupStatUpdates() {
  const botStatsElement = document.getElementById('bot-stats');
  
  if (botStatsElement) {
    // Update every 30 seconds
    setInterval(() => {
      fetch('/api/status')
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok');
          return response.json();
        })
        .then(data => {
          // Update stats in the UI
          document.getElementById('server-count').textContent = data.servers;
          document.getElementById('user-count').textContent = data.users;
          document.getElementById('bot-ping').textContent = `${data.ping}ms`;
          
          // Format uptime
          const uptime = data.uptime;
          const days = Math.floor(uptime / (1000 * 60 * 60 * 24));
          const hours = Math.floor((uptime % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
          const minutes = Math.floor((uptime % (1000 * 60 * 60)) / (1000 * 60));
          
          document.getElementById('bot-uptime').textContent = `${days}d ${hours}h ${minutes}m`;
        })
        .catch(error => {
          console.error('Error updating stats:', error);
        });
    }, 30000);
  }
}

/**
 * Sets up form submission handlers with better UI feedback
 */
function setupFormHandlers() {
  // Settings form handler
  const settingsForm = document.getElementById('settingsForm');
  if (settingsForm) {
    settingsForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Show loading state
      const submitBtn = this.querySelector('button[type="submit"]');
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Saving...';
      
      // Get the guild ID from the URL
      const guildId = window.location.pathname.split('/')[3];
      
      // Collect form data
      const formData = new FormData(this);
      const settings = {
        prefix: formData.get('prefix'),
        deleteCommands: formData.get('deleteCommands') === 'on',
        embedColor: formData.get('embedColor') === 'on',
        welcome: {
          enabled: formData.get('welcomeEnabled') === 'on',
          channelId: formData.get('welcomeChannel'),
          message: formData.get('welcomeMessage')
        },
        automod: {
          enabled: formData.get('automodEnabled') === 'on',
          filterEnabled: formData.get('filterEnabled') === 'on',
          filteredWords: formData.get('filteredWords').split('\n').filter(word => word.trim().length > 0)
        },
        moderation: {
          logChannelId: formData.get('logChannel')
        }
      };
      
      // Send settings to API
      fetch(`/api/servers/${guildId}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Failed to save settings');
      })
      .then(data => {
        // Show success message
        showToast('Settings saved successfully!', 'success');
      })
      .catch(error => {
        // Show error message
        showToast(`Error: ${error.message}`, 'danger');
      })
      .finally(() => {
        // Restore button state
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      });
    });
  }
  
  // Command toggle handlers
  const commandToggles = document.querySelectorAll('input[id^="command-"]');
  commandToggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
      const commandName = this.id.replace('command-', '');
      const enabled = this.checked;
      const guildId = window.location.pathname.split('/')[3];
      
      fetch(`/api/servers/${guildId}/commands/${commandName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ enabled })
      })
      .then(response => {
        if (!response.ok) throw new Error('Failed to update command status');
        return response.json();
      })
      .then(data => {
        showToast(`Command ${commandName} ${enabled ? 'enabled' : 'disabled'}`, 'success');
      })
      .catch(error => {
        // Revert toggle on error
        this.checked = !enabled;
        showToast(`Error: ${error.message}`, 'danger');
      });
    });
  });
}

/**
 * Sets up confirmation dialogs for dangerous actions
 */
function setupConfirmations() {
  const dangerousButtons = document.querySelectorAll('[data-confirm]');
  
  dangerousButtons.forEach(button => {
    button.addEventListener('click', function(e) {
      const message = this.getAttribute('data-confirm') || 'Are you sure?';
      
      if (!confirm(message)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });
  });
}

/**
 * Shows a toast notification
 * @param {string} message - The message to display
 * @param {string} type - The type of toast (success, danger, warning, info)
 */
function showToast(message, type = 'info') {
  // Check if toast container exists, if not create it
  let toastContainer = document.querySelector('.toast-container');
  
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed bottom-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }
  
  // Create toast element
  const toastEl = document.createElement('div');
  toastEl.className = `toast align-items-center text-white bg-${type} border-0`;
  toastEl.setAttribute('role', 'alert');
  toastEl.setAttribute('aria-live', 'assertive');
  toastEl.setAttribute('aria-atomic', 'true');
  
  toastEl.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        ${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
    </div>
  `;
  
  // Add toast to container
  toastContainer.appendChild(toastEl);
  
  // Initialize and show toast with Bootstrap
  if (typeof bootstrap !== 'undefined') {
    const toast = new bootstrap.Toast(toastEl, {
      autohide: true,
      delay: 5000
    });
    toast.show();
  }
}

/**
 * Formats a number for display (e.g., 1000 → 1K)
 * @param {number} num - The number to format
 * @returns {string} Formatted number
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
