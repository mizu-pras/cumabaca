/**
 * SecretSettingsApp - Handles NSFW settings page functionality
 */
class SecretSettingsApp {
    rootElement = document.querySelector('#root');

    constructor() {
        this.nsfwToggle = null;
        this.warningNotice = null;
        this.confirmationMessage = null;
        this.disabledMessage = null;
    }

    static _instance;

    static get instance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new SecretSettingsApp();
        return this._instance;
    }

    init() {
        // Get DOM elements
        this.nsfwToggle = document.getElementById('nsfw-toggle');
        this.warningNotice = document.getElementById('warning-notice');
        this.confirmationMessage = document.getElementById('confirmation-message');
        this.disabledMessage = document.getElementById('disabled-message');

        // Initialize toggle state from localStorage
        this.initializeToggleState();

        // Add NSFW badge to header if active
        this.addNsfwBadgeToHeader();

        // Set up event listener
        this.nsfwToggle.addEventListener('change', this.handleToggleChange.bind(this));

        // Show warning notice if NSFW is enabled
        this.updateVisibilityMessages();
    }

    /**
     * Add NSFW badge to header when mode is active
     */
    addNsfwBadgeToHeader() {
        const appTitle = document.querySelector('header h1');
        if (!appTitle) return;

        // Update app title to support flex layout
        appTitle.className = 'text-4xl m-0 flex items-center gap-3';

        // Check if NSFW is enabled
        const nsfwEnabled = localStorage.getItem('nsfwEnabled') === 'true' ||
                           localStorage.getItem('secretMode') === 'true';

        if (nsfwEnabled) {
            // Only add badge if it doesn't exist
            if (!appTitle.querySelector('.nsfw-badge')) {
                const nsfwBadge = document.createElement('span');
                nsfwBadge.className = 'nsfw-badge text-sm bg-red-100 text-red-800 px-2 py-1 rounded font-medium';
                nsfwBadge.textContent = 'NSFW';
                appTitle.appendChild(nsfwBadge);
            }
        }
    }

    /**
     * Update NSFW badge visibility when toggle changes
     */
    updateNsfwBadgeVisibility() {
        const appTitle = document.querySelector('header h1');
        if (!appTitle) return;

        const nsfwBadge = appTitle.querySelector('.nsfw-badge');
        const isEnabled = this.nsfwToggle.checked;

        if (isEnabled && !nsfwBadge) {
            const newBadge = document.createElement('span');
            newBadge.className = 'nsfw-badge text-sm bg-red-100 text-red-800 px-2 py-1 rounded font-medium';
            newBadge.textContent = 'NSFW';
            appTitle.appendChild(newBadge);
        } else if (!isEnabled && nsfwBadge) {
            nsfwBadge.remove();
        }
    }

    /**
     * Initialize toggle state based on localStorage
     * DEFAULT: NSFW mode is DISABLED by default for new users
     * Only enabled if user explicitly enables it or has old secretMode setting
     */
    initializeToggleState() {
        // Migrate old secretMode key to new nsfwEnabled key
        if (localStorage.getItem('secretMode') === 'true') {
            localStorage.setItem('nsfwEnabled', 'true');
            localStorage.removeItem('secretMode');
        }

        // Default to DISABLED - only true if explicitly set to 'true'
        const nsfwEnabled = localStorage.getItem('nsfwEnabled') === 'true';
        this.nsfwToggle.checked = nsfwEnabled;
    }

    /**
     * Handle toggle change event
     */
    handleToggleChange(event) {
        const isEnabled = event.target.checked;

        // Save to localStorage
        localStorage.setItem('nsfwEnabled', isEnabled ? 'true' : 'false');

        // Update NSFW badge visibility
        this.updateNsfwBadgeVisibility();

        // Update visibility messages
        this.updateVisibilityMessages();

        // Show appropriate message
        this.showToggleMessage(isEnabled);
    }

    /**
     * Update visibility of warning notice based on toggle state
     */
    updateVisibilityMessages() {
        const isEnabled = this.nsfwToggle.checked;

        if (isEnabled) {
            this.warningNotice.classList.remove('hidden');
        } else {
            this.warningNotice.classList.add('hidden');
        }
    }

    /**
     * Show confirmation or disabled message with fade-out
     */
    showToggleMessage(isEnabled) {
        // Hide all messages first
        this.confirmationMessage.classList.add('hidden');
        this.disabledMessage.classList.add('hidden');

        // Show appropriate message
        const messageToShow = isEnabled ? this.confirmationMessage : this.disabledMessage;
        messageToShow.classList.remove('hidden');

        // Fade out message after 3 seconds
        setTimeout(() => {
            messageToShow.classList.add('hidden');
        }, 3000);
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        SecretSettingsApp.instance.init();
    });
} else {
    SecretSettingsApp.instance.init();
}
