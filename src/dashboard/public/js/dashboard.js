// Dashboard JavaScript utilities

class Dashboard {
    constructor() {
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupTooltips();
        this.setupAutoRefresh();
    }

    setupEventListeners() {
        // Handle form submissions
        document.addEventListener("submit", this.handleFormSubmit.bind(this));

        // Handle button clicks
        document.addEventListener("click", this.handleButtonClick.bind(this));

        // Handle modal events
        document.addEventListener("show.bs.modal", this.handleModalShow.bind(this));
    }

    setupTooltips() {
        // Initialize Bootstrap tooltips
        const tooltipTriggerList = [].slice.call(
            document.querySelectorAll('[data-bs-toggle="tooltip"]'),
        );
        tooltipTriggerList.map(function (tooltipTriggerEl) {
            return new bootstrap.Tooltip(tooltipTriggerEl);
        });
    }

    setupAutoRefresh() {
        // Auto-refresh certain elements every 30 seconds
        setInterval(() => {
            this.refreshStats();
        }, 30000);
    }

    async refreshStats() {
        try {
            const response = await fetch("/api/stats");
            const data = await response.json();

            // Update stats if elements exist
            this.updateElement("guild-count", data.guilds);
            this.updateElement("user-count", data.users?.toLocaleString());
            this.updateElement("bot-ping", data.ping + "ms");

            // Update uptime
            if (data.uptime) {
                const uptime = this.formatUptime(data.uptime);
                this.updateElement("uptime", uptime);
            }
        } catch (error) {
            console.error("Error refreshing stats:", error);
        }
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element && value !== undefined) {
            element.textContent = value;
        }
    }

    formatUptime(seconds) {
        const days = Math.floor(seconds / 86400);
        const hours = Math.floor((seconds % 86400) / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (days > 0) {
            return `${days}d ${hours}h ${minutes}m`;
        } else if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }

    async handleFormSubmit(event) {
        const form = event.target;
        if (!form.classList.contains("ajax-form")) return;

        event.preventDefault();

        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;

        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Saving...';

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());

            const response = await fetch(form.action, {
                method: form.method || "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const result = await response.json();

            if (response.ok) {
                this.showAlert("success", "Settings saved successfully!");

                // Trigger custom event
                form.dispatchEvent(new CustomEvent("formSuccess", { detail: result }));
            } else {
                throw new Error(result.error || "An error occurred");
            }
        } catch (error) {
            this.showAlert("danger", error.message);
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    handleButtonClick(event) {
        const button = event.target.closest("button");
        if (!button) return;

        // Handle action buttons
        if (button.dataset.action) {
            this.handleAction(button.dataset.action, button);
        }
    }

    async handleAction(action, button) {
        const originalText = button.textContent;

        try {
            button.disabled = true;
            button.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';

            switch (action) {
                case "refresh-stats":
                    await this.refreshStats();
                    break;
                case "test-connection":
                    await this.testConnection();
                    break;
                default:
                    console.warn("Unknown action:", action);
            }
        } catch (error) {
            this.showAlert("danger", error.message);
        } finally {
            button.disabled = false;
            button.textContent = originalText;
        }
    }

    async testConnection() {
        const response = await fetch("/api/stats");
        if (response.ok) {
            this.showAlert("success", "Connection test successful!");
        } else {
            throw new Error("Connection test failed");
        }
    }

    handleModalShow(event) {
        const modal = event.target;
        const trigger = event.relatedTarget;

        if (trigger && trigger.dataset.serverId) {
            // Load server data for modal
            this.loadServerData(trigger.dataset.serverId, modal);
        }
    }

    async loadServerData(serverId, modal) {
        try {
            const response = await fetch(`/api/guild/${serverId}`);
            const data = await response.json();

            // Update modal content
            const modalTitle = modal.querySelector(".modal-title");
            const modalBody = modal.querySelector(".modal-body");

            if (modalTitle) {
                modalTitle.textContent = data.name;
            }

            if (modalBody) {
                modalBody.innerHTML = this.renderServerDetails(data);
            }
        } catch (error) {
            console.error("Error loading server data:", error);
        }
    }

    renderServerDetails(server) {
        return `
            <div class="row">
                <div class="col-md-6">
                    <h6>Server Information</h6>
                    <p><strong>Members:</strong> ${server.memberCount}</p>
                    <p><strong>Channels:</strong> ${server.channels?.length || 0}</p>
                    <p><strong>Roles:</strong> ${server.roles?.length || 0}</p>
                </div>
                <div class="col-md-6">
                    ${server.icon ? `<img src="${server.icon}" alt="Server Icon" class="img-fluid rounded">` : ""}
                </div>
            </div>
        `;
    }

    showAlert(type, message, duration = 5000) {
        const alertContainer =
            document.getElementById("alert-container") || this.createAlertContainer();

        const alert = document.createElement("div");
        alert.className = `alert alert-${type} alert-dismissible fade show`;
        alert.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        alertContainer.appendChild(alert);

        // Auto-dismiss after duration
        setTimeout(() => {
            if (alert.parentNode) {
                alert.remove();
            }
        }, duration);
    }

    createAlertContainer() {
        const container = document.createElement("div");
        container.id = "alert-container";
        container.className = "position-fixed top-0 end-0 p-3";
        container.style.zIndex = "9999";
        document.body.appendChild(container);
        return container;
    }

    // Utility methods
    formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }

    formatBytes(bytes) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    }

    formatDate(date) {
        return new Intl.DateTimeFormat("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        }).format(new Date(date));
    }

    // Chart utilities
    createChart(canvasId, type, data, options = {}) {
        const ctx = document.getElementById(canvasId);
        if (!ctx) return null;

        return new Chart(ctx, {
            type: type,
            data: data,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                ...options,
            },
        });
    }

    // WebSocket connection for real-time updates
    setupWebSocket() {
        if (typeof io !== "undefined") {
            this.socket = io();

            this.socket.on("stats-update", (data) => {
                this.updateStats(data);
            });

            this.socket.on("server-update", (data) => {
                this.updateServerInfo(data);
            });
        }
    }

    updateStats(data) {
        // Update dashboard stats in real-time
        Object.keys(data).forEach((key) => {
            this.updateElement(key, data[key]);
        });
    }

    updateServerInfo(data) {
        // Update server information in real-time
        const serverCard = document.querySelector(`[data-server-id="${data.id}"]`);
        if (serverCard) {
            // Update server card content
            const memberCount = serverCard.querySelector(".member-count");
            if (memberCount) {
                memberCount.textContent = data.memberCount;
            }
        }
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    window.dashboard = new Dashboard();
});

// Export for use in other scripts
if (typeof module !== "undefined" && module.exports) {
    module.exports = Dashboard;
}
