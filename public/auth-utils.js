/**
 * Authentication Utility for Armada Analytics Hub
 * This script handles client-side authentication checks and user profile display
 */

class AuthManager {
    constructor() {
        this.user = null;
        this.authenticated = false;
    }

    /**
     * Check authentication status
     */
    async checkAuth() {
        try {
            const response = await fetch('/api/auth/status');
            const data = await response.json();

            if (data.authenticated) {
                this.authenticated = true;
                this.user = data.user;
                return true;
            } else {
                this.redirectToLogin();
                return false;
            }
        } catch (error) {
            console.error('Auth check failed:', error);
            this.redirectToLogin();
            return false;
        }
    }

    /**
     * Get full user information
     */
    async getUserInfo() {
        try {
            const response = await fetch('/api/auth/user');
            if (response.ok) {
                const data = await response.json();
                this.user = data;
                return data;
            } else {
                this.redirectToLogin();
                return null;
            }
        } catch (error) {
            console.error('Failed to get user info:', error);
            return null;
        }
    }

    /**
     * Redirect to login page
     */
    redirectToLogin() {
        window.location.href = '/login';
    }

    /**
     * Logout user
     */
    logout() {
        window.location.href = '/logout';
    }

    /**
     * Add user profile to navigation bar
     */
    addUserProfile(containerId = 'user-profile-container') {
        if (!this.user) return;

        const container = document.getElementById(containerId);
        if (!container) return;

        const profileHTML = `
            <div class="user-profile" style="display: flex; align-items: center; gap: 12px; padding: 12px; background: #f8fafc; border-radius: 10px; margin-bottom: 16px;">
                <img src="${this.user.avatar}" alt="${this.user.name}"
                     style="width: 40px; height: 40px; border-radius: 50%; border: 2px solid #3b82f6;">
                <div style="flex: 1; min-width: 0;">
                    <div style="font-size: 14px; font-weight: 600; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.user.name}</div>
                    <div style="font-size: 12px; color: #64748b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${this.user.email}</div>
                </div>
            </div>
            <div class="logout-btn" onclick="authManager.logout()"
                 style="padding: 10px 12px; margin-bottom: 16px; cursor: pointer; transition: all 0.2s ease; border-radius: 8px; display: flex; align-items: center; gap: 12px; color: #64748b; font-weight: 500; font-size: 14px; background: transparent;">
                <span style="font-size: 18px;">🚪</span>
                <span>Logout</span>
            </div>
        `;

        container.innerHTML = profileHTML;

        // Add hover effect
        const logoutBtn = container.querySelector('.logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('mouseenter', () => {
                logoutBtn.style.background = '#fee2e2';
                logoutBtn.style.color = '#dc2626';
            });
            logoutBtn.addEventListener('mouseleave', () => {
                logoutBtn.style.background = 'transparent';
                logoutBtn.style.color = '#64748b';
            });
        }
    }

    /**
     * Show loading state
     */
    showLoading() {
        const loadingHTML = `
            <div id="auth-loading" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.95); display: flex; align-items: center; justify-content: center; z-index: 9999;">
                <div style="text-align: center;">
                    <div style="width: 50px; height: 50px; border: 4px solid #e2e8f0; border-top-color: #3b82f6; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto 20px;"></div>
                    <p style="color: #64748b; font-size: 16px;">Verifying authentication...</p>
                </div>
            </div>
            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            </style>
        `;
        document.body.insertAdjacentHTML('afterbegin', loadingHTML);
    }

    /**
     * Hide loading state
     */
    hideLoading() {
        const loading = document.getElementById('auth-loading');
        if (loading) {
            loading.remove();
        }
    }

    /**
     * Initialize authentication
     */
    async init() {
        this.showLoading();
        const authenticated = await this.checkAuth();
        this.hideLoading();

        if (authenticated) {
            // Try to add user profile if container exists
            this.addUserProfile();
        }

        return authenticated;
    }
}

// Create global instance
const authManager = new AuthManager();

// Auto-initialize on page load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        authManager.init();
    });
} else {
    authManager.init();
}
