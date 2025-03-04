// Authentication system for dashboard
const AuthManager = {
    // Check authentication status
    async checkAuthStatus() {
        try {
            const response = await fetch('/.netlify/functions/getAuthStatus');
            if (!response.ok) throw new Error('Failed to fetch auth status');
            const data = await response.json();
            return data.authenticated ? data.user : null;
        } catch (error) {
            console.error('Auth check error:', error);
            return null;
        }
    },

    // Handle login redirect
    async handleLogin() {
        try {
            const state = crypto.randomUUID();
            sessionStorage.setItem('oauth_state', state);
            
            const response = await fetch('/.netlify/functions/getOAuthParams');
            if (!response.ok) throw new Error('Failed to get OAuth parameters');
            const { clientId, redirectUri } = await response.json();
            
            window.location.href = `https://discord.com/oauth2/authorize?client_id=${encodeURIComponent(clientId)}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=identify%20connections&state=${state}`;
        } catch (error) {
            console.error('Login initialization error:', error);
            sessionStorage.removeItem('oauth_state');
        }
    },

    // Handle logout
    async handleLogout() {
        try {
            await fetch('/.netlify/functions/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: this.getToken() })
            });
            sessionStorage.clear();
            window.location.reload();
        } catch (error) {
            console.error('Logout error:', error);
        }
    },

    // Token management
    storeToken(token) {
        sessionStorage.setItem('auth_token', token);
    },

    getToken() {
        return sessionStorage.getItem('auth_token');
    },

    // UI integration
    async updateUI() {
        const user = await this.checkAuthStatus();
        const authElements = document.querySelectorAll('[data-auth]');
        
        authElements.forEach(element => {
            const state = element.dataset.auth;
            element.style.display = user ? 
                (state === 'authenticated' ? 'block' : 'none') :
                (state === 'guest' ? 'block' : 'none');
        });

        if(user) {
            const avatar = document.getElementById('user-avatar');
            const username = document.getElementById('user-name');
            if(avatar) avatar.src = user.avatar;
            if(username) username.textContent = user.username;
        }
    }
};

// Initialize auth system on load
document.addEventListener('DOMContentLoaded', async () => {
    // Handle OAuth callback
    const urlParams = new URLSearchParams(window.location.search);
    if(urlParams.has('code')) {
        AuthManager.storeToken(urlParams.get('code'));
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    // Bind login/logout buttons
    document.querySelectorAll('[data-action="login"]').forEach(btn => {
        btn.addEventListener('click', AuthManager.handleLogin);
    });

    document.querySelectorAll('[data-action="logout"]').forEach(btn => {
        btn.addEventListener('click', AuthManager.handleLogout);
    });

    // Update UI state
    await AuthManager.updateUI();
});