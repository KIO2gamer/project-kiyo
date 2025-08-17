// Dashboard JavaScript utilities

// Global dashboard object
window.dashboard = {
    // Show alert messages
    showAlert: function (type, message, duration = 5000) {
        const alertContainer =
            document.getElementById("alert-container") || this.createAlertContainer();

        const alertId = "alert-" + Date.now();
        const alertHtml = `
            <div class="alert alert-${type} alert-dismissible fade show" id="${alertId}" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;

        alertContainer.insertAdjacentHTML("beforeend", alertHtml);

        // Auto-remove after duration
        if (duration > 0) {
            setTimeout(() => {
                const alert = document.getElementById(alertId);
                if (alert) {
                    const bsAlert = new bootstrap.Alert(alert);
                    bsAlert.close();
                }
            }, duration);
        }
    },

    // Create alert container if it doesn't exist
    createAlertContainer: function () {
        let container = document.getElementById("alert-container");
        if (!container) {
            container = document.createElement("div");
            container.id = "alert-container";
            container.className = "position-fixed top-0 end-0 p-3";
            container.style.zIndex = "9999";
            document.body.appendChild(container);
        }
        return container;
    },

    // Format numbers with commas
    formatNumber: function (num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    },

    // Format uptime
    formatUptime: function (seconds) {
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
    },

    // Format time
    formatTime: function (date) {
        if (typeof date === "string") {
            date = new Date(date);
        }
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
        });
    },

    // Format date
    formatDate: function (date) {
        if (typeof date === "string") {
            date = new Date(date);
        }
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    },

    // API helper
    api: {
        get: async function (url) {
            try {
                const response = await fetch(url);
                return await response.json();
            } catch (error) {
                console.error("API GET error:", error);
                throw error;
            }
        },

        post: async function (url, data) {
            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify(data),
                });
                return await response.json();
            } catch (error) {
                console.error("API POST error:", error);
                throw error;
            }
        },

        delete: async function (url) {
            try {
                const response = await fetch(url, {
                    method: "DELETE",
                });
                return await response.json();
            } catch (error) {
                console.error("API DELETE error:", error);
                throw error;
            }
        },
    },

    // Loading states
    setLoading: function (elementId, isLoading = true) {
        const element = document.getElementById(elementId);
        if (!element) return;

        if (isLoading) {
            element.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
    },

    // Confirm dialog
    confirm: function (message, callback) {
        if (window.confirm(message)) {
            callback();
        }
    },
};

// Initialize dashboard when DOM is loaded
document.addEventListener("DOMContentLoaded", function () {
    // Create alert container
    dashboard.createAlertContainer();

    // Add loading states to elements with data-loading attribute
    document.querySelectorAll("[data-loading]").forEach((element) => {
        dashboard.setLoading(element.id, true);
    });

    // Handle all confirm buttons
    document.addEventListener("click", function (e) {
        if (e.target.hasAttribute("data-confirm")) {
            e.preventDefault();
            const message = e.target.getAttribute("data-confirm");
            dashboard.confirm(message, function () {
                // If it's a link, navigate to it
                if (e.target.tagName === "A") {
                    window.location.href = e.target.href;
                }
                // If it's a button with data-action, trigger the action
                else if (e.target.hasAttribute("data-action")) {
                    const action = e.target.getAttribute("data-action");
                    if (window[action] && typeof window[action] === "function") {
                        window[action]();
                    }
                }
            });
        }
    });
});

// Utility functions for charts
window.chartUtils = {
    // Generate random data for demo charts
    generateRandomData: function (count, min = 0, max = 100) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return data;
    },

    // Generate time labels
    generateTimeLabels: function (count, interval = "hour") {
        const labels = [];
        const now = new Date();

        for (let i = count - 1; i >= 0; i--) {
            let time;
            if (interval === "hour") {
                time = new Date(now.getTime() - i * 60 * 60 * 1000);
                labels.push(time.getHours() + ":00");
            } else if (interval === "day") {
                time = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                labels.push(time.toLocaleDateString("en-US", { month: "short", day: "numeric" }));
            } else if (interval === "minute") {
                time = new Date(now.getTime() - i * 60 * 1000);
                labels.push(time.getMinutes() + "m");
            }
        }

        return labels;
    },

    // Common chart options
    getDefaultOptions: function () {
        return {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: "bottom",
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                },
            },
        };
    },
};

// Auto-refresh functionality
window.autoRefresh = {
    intervals: new Map(),

    start: function (name, callback, interval = 30000) {
        this.stop(name); // Clear existing interval
        const intervalId = setInterval(callback, interval);
        this.intervals.set(name, intervalId);
    },

    stop: function (name) {
        if (this.intervals.has(name)) {
            clearInterval(this.intervals.get(name));
            this.intervals.delete(name);
        }
    },

    stopAll: function () {
        this.intervals.forEach((intervalId) => {
            clearInterval(intervalId);
        });
        this.intervals.clear();
    },
};

// Cleanup on page unload
window.addEventListener("beforeunload", function () {
    autoRefresh.stopAll();
});
