/**
 * Project Kiyo OAuth2 Portal
 * Main JavaScript functionality
 */

class OAuth2Portal {
    constructor() {
        this.state = {
            loading: false,
            error: null,
            success: null,
            userInfo: null,
            connectionStats: null
        };
        
        this.elements = {
            loadingScreen: document.getElementById('loadingScreen'),
            defaultContent: document.getElementById('defaultContent'),
            successContent: document.getElementById('successContent'),
            errorContent: document.getElementById('errorContent'),
            userInfo: document.getElementById('userInfo'),
            connectionStats: document.getElementById('connectionStats'),
            errorMessage: document.getElementById('errorMessage'),
            errorDetails: document.getElementById('errorDetails'),
            discordAppLink: document.getElementById('discordAppLink'),
            discordBrowserLink: document.getElementById('discordBrowserLink')
        };
        
        this.init();
    }
    
    init() {
        // Check URL parameters for OAuth callback
        this.checkOAuthCallback();
        
        // Set up smooth scrolling for navigation
        this.setupSmoothScrolling();
        
        // Set up intersection observer for animations
        this.setupAnimations();
        
        // Hide loading screen initially
        this.hideLoading();
        
        console.log('🚀 Project Kiyo OAuth2 Portal initialized');
    }
    
    checkOAuthCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        const errorDescription = urlParams.get('error_description');
        
        if (error) {
            this.showError(
                `OAuth2 Error: ${error}`,
                errorDescription || 'An error occurred during authorization.',
                {
                    error_code: error,
                    description: errorDescription,
                    timestamp: new Date().toISOString()
                }
            );
            return;
        }
        
        if (code && state) {
            this.showLoading();
            this.processOAuthCallback(code, state);
            return;
        }
        
        // Show default content if no OAuth parameters
        this.showDefault();
    }
    
    async processOAuthCallback(code, state) {
        try {
            console.log('🔄 Processing OAuth callback...');
            
            // Simulate processing time for better UX
            await this.delay(1000);
            
            // In a real implementation, you would make an API call here
            // For demo purposes, we'll simulate different outcomes
            const mockResponse = this.getMockResponse();
            
            if (mockResponse.success) {
                await this.delay(500);
                this.showSuccess(mockResponse.data);
            } else {
                this.showError(
                    mockResponse.error.title,
                    mockResponse.error.message,
                    mockResponse.error.details
                );
            }
            
        } catch (error) {
            console.error('❌ OAuth processing error:', error);
            this.showError(
                'Processing Error',
                'An unexpected error occurred while processing your authorization.',
                {
                    error: error.message,
                    timestamp: new Date().toISOString()
                }
            );
        }
    }
    
    getMockResponse() {
        // Simulate different response scenarios for demo
        const scenarios = [
            {
                success: true,
                data: {
                    userInfo: {
                        id: '123456789012345678',
                        username: 'YouTubeCreator',
                        discriminator: '1234',
                        avatar: '7d49d5b5c8a3d3a1a6b2f3c4d5e6f7g8'
                    },
                    connections: [
                        {
                            id: 'UC1234567890123456789',
                            name: 'My Awesome Channel',
                            verified: true,
                            subscriberCount: 25000
                        }
                    ],
                    guildId: '987654321098765432',
                    channelId: '876543210987654321'
                }
            },
            {
                success: false,
                error: {
                    title: 'No YouTube Connections',
                    message: 'No YouTube account is connected to your Discord profile.',
                    details: {
                        suggestion: 'Please connect your YouTube account in Discord Settings > Connections',
                        help_url: 'https://support.discord.com/hc/en-us/articles/212112068-Connections'
                    }
                }
            },
            {
                success: false,
                error: {
                    title: 'Invalid State Parameter',
                    message: 'The authorization state parameter is invalid or expired.',
                    details: {
                        suggestion: 'Please restart the authorization process',
                        error_code: 'INVALID_STATE'
                    }
                }
            }
        ];
        
        // Return random scenario for demo (in production, this would be the actual API response)
        return scenarios[Math.floor(Math.random() * scenarios.length)];
    }
    
    showLoading() {
        this.hideAllContent();
        this.elements.loadingScreen.classList.remove('hidden');
        this.state.loading = true;
        
        // Update page title
        document.title = 'Processing Authorization - Project Kiyo';
    }
    
    hideLoading() {
        this.elements.loadingScreen.classList.add('hidden');
        this.state.loading = false;
    }
    
    showDefault() {
        this.hideAllContent();
        this.elements.defaultContent.classList.remove('hidden');
        
        // Update page title
        document.title = 'Project Kiyo - OAuth2 Portal';
    }
    
    showSuccess(data) {
        this.hideAllContent();
        this.state.success = data;
        
        // Populate user info
        this.populateUserInfo(data.userInfo);
        
        // Populate connection stats
        this.populateConnectionStats(data.connections);
        
        // Set up Discord links
        this.setupDiscordLinks(data.guildId, data.channelId);
        
        // Show success content with animation
        this.elements.successContent.classList.remove('hidden');
        
        // Update page title
        document.title = 'Authorization Successful - Project Kiyo';
        
        // Add success animation
        this.animateSuccess();
        
        console.log('✅ Authorization successful');
    }
    
    showError(title, message, details = null) {
        this.hideAllContent();
        this.state.error = { title, message, details };
        
        // Update error message
        this.elements.errorMessage.textContent = message;
        
        // Populate error details if provided
        if (details) {
            this.populateErrorDetails(details);
        } else {
            this.elements.errorDetails.innerHTML = '';
        }
        
        // Show error content
        this.elements.errorContent.classList.remove('hidden');
        
        // Update page title
        document.title = `Error: ${title} - Project Kiyo`;
        
        console.error('❌ Authorization error:', { title, message, details });
    }
    
    populateUserInfo(userInfo) {
        if (!userInfo) return;
        
        const avatarUrl = userInfo.avatar
            ? `https://cdn.discordapp.com/avatars/${userInfo.id}/${userInfo.avatar}.png?size=128`
            : 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        this.elements.userInfo.innerHTML = `
            <img src="${avatarUrl}" alt="Discord Avatar" class="user-avatar" onerror="this.src='https://cdn.discordapp.com/embed/avatars/0.png'">
            <div class="user-details">
                <h3>${this.escapeHtml(userInfo.username)}</h3>
                <p>Successfully authenticated</p>
            </div>
        `;
    }
    
    populateConnectionStats(connections) {
        if (!connections || !connections.length) return;
        
        const totalConnections = connections.length;
        const totalSubscribers = connections.reduce((sum, conn) => sum + (conn.subscriberCount || 0), 0);
        const verifiedConnections = connections.filter(conn => conn.verified).length;
        
        this.elements.connectionStats.innerHTML = `
            <div class="connection-stat">
                <div class="stat-number">${totalConnections}</div>
                <div class="stat-label">YouTube Connections</div>
            </div>
            <div class="connection-stat">
                <div class="stat-number">${totalSubscribers.toLocaleString()}</div>
                <div class="stat-label">Total Subscribers</div>
            </div>
            <div class="connection-stat">
                <div class="stat-number">${verifiedConnections}</div>
                <div class="stat-label">Verified Channels</div>
            </div>
        `;
    }
    
    populateErrorDetails(details) {
        if (!details) return;
        
        let detailsHtml = '<h4>Error Details</h4>';
        
        for (const [key, value] of Object.entries(details)) {
            if (typeof value === 'string') {
                detailsHtml += `<p><strong>${this.formatKey(key)}:</strong> ${this.escapeHtml(value)}</p>`;
            } else if (typeof value === 'object') {
                detailsHtml += `<p><strong>${this.formatKey(key)}:</strong> <code>${JSON.stringify(value, null, 2)}</code></p>`;
            }
        }
        
        this.elements.errorDetails.innerHTML = detailsHtml;
    }
    
    setupDiscordLinks(guildId, channelId) {
        if (!guildId || !channelId) return;
        
        const discordAppUrl = `discord://discord.com/channels/${guildId}/${channelId}`;
        const discordBrowserUrl = `https://discord.com/channels/${guildId}/${channelId}`;
        
        this.elements.discordAppLink.href = discordAppUrl;
        this.elements.discordBrowserLink.href = discordBrowserUrl;
    }
    
    hideAllContent() {
        Object.values(this.elements).forEach(element => {
            if (element && element.classList) {
                element.classList.add('hidden');
            }
        });
    }
    
    setupSmoothScrolling() {
        document.querySelectorAll('a[href^="#"]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = document.querySelector(link.getAttribute('href'));
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });
    }
    
    setupAnimations() {
        // Intersection Observer for fade-in animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe elements for animation
        document.querySelectorAll('.feature-card, .support-card, .about-content').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(el);
        });
    }
    
    animateSuccess() {
        // Add a subtle success animation
        const successCard = document.querySelector('.status-card.success');
        if (successCard) {
            successCard.style.transform = 'scale(0.95)';
            successCard.style.opacity = '0';
            
            setTimeout(() => {
                successCard.style.transition = 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)';
                successCard.style.transform = 'scale(1)';
                successCard.style.opacity = '1';
            }, 100);
        }
    }
    
    // Utility functions
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    formatKey(key) {
        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
}

// Global functions for button actions
function startOAuth() {
    // In a real implementation, this would redirect to the Discord OAuth URL
    console.log('🚀 Starting OAuth authorization...');
    
    // For demo purposes, simulate the OAuth flow
    const demoParams = new URLSearchParams({
        code: 'demo_authorization_code_' + Date.now(),
        state: 'demo_state_parameter'
    });
    
    // Redirect to current page with demo parameters
    window.location.href = `${window.location.pathname}?${demoParams.toString()}`;
}

function scrollToFeatures() {
    const featuresSection = document.getElementById('features');
    if (featuresSection) {
        featuresSection.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
        });
    }
}

function retryAuthorization() {
    // Clear URL parameters and show default content
    window.history.replaceState({}, document.title, window.location.pathname);
    window.location.reload();
}

// Theme detection and handling
function detectTheme() {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const theme = prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', theme);
    return theme;
}

// Performance monitoring
function logPerformance() {
    if ('performance' in window) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = performance.getEntriesByType('navigation')[0];
                console.log('⚡ Page Performance:', {
                    loadTime: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
                    domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
                    totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
                });
            }, 0);
        });
    }
}

// Error tracking
function setupErrorTracking() {
    window.addEventListener('error', (event) => {
        console.error('💥 Global error:', {
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            error: event.error
        });
    });
    
    window.addEventListener('unhandledrejection', (event) => {
        console.error('💥 Unhandled promise rejection:', event.reason);
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Detect theme
    detectTheme();
    
    // Set up error tracking
    setupErrorTracking();
    
    // Log performance
    logPerformance();
    
    // Initialize OAuth portal
    window.oauthPortal = new OAuth2Portal();
    
    // Listen for theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', detectTheme);
});

// Service Worker registration for PWA features (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('🔧 Service Worker registered:', registration.scope);
            })
            .catch(error => {
                console.log('❌ Service Worker registration failed:', error);
            });
    });
}

// Export for potential external use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OAuth2Portal };
}

