/**
 * Configuration
 */
const CONFIG_DEFAULT = {
    appName: 'Cuma Baca',
    apiBaseUrl: '/komik',
};

/**
 * Utility functions
 */
function validateAndFormatURL(url) {
    try {
        let parsedUrl = new URL(url);

        let formattedUrl = parsedUrl.origin + parsedUrl.pathname;
        if (formattedUrl.endsWith('/')) {
            formattedUrl = formattedUrl.slice(0, -1);
        }

        return formattedUrl;
    } catch (e) {
        console.error('URL tidak valid:', url);
        return null;
    }
}

/**
 * Format timestamp as relative time (e.g., "2 jam lalu", "Kemarin")
 */
function formatRelativeTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) {
        return 'Baru saja';
    } else if (diffMin < 60) {
        return `${diffMin} menit lalu`;
    } else if (diffHour < 24) {
        return `${diffHour} jam lalu`;
    } else if (diffDay === 1) {
        return 'Kemarin';
    } else if (diffDay < 7) {
        return `${diffDay} hari lalu`;
    } else if (diffDay < 30) {
        const weeks = Math.floor(diffDay / 7);
        return `${weeks} minggu lalu`;
    } else {
        const months = Math.floor(diffDay / 30);
        return `${months} bulan lalu`;
    }
}

/**
 * Check if secret mode is active (localStorage only)
 * DEFAULT: Returns FALSE for new users (NSFW disabled by default)
 * @returns {boolean}
 */
function isSecretMode() {
    // Migrate old secretMode key to new nsfwEnabled key
    if (localStorage.getItem('secretMode') === 'true') {
        localStorage.setItem('nsfwEnabled', 'true');
        localStorage.removeItem('secretMode');
        return true;
    }
    // Default to FALSE - only true if explicitly set to 'true'
    return localStorage.getItem('nsfwEnabled') === 'true';
}

/**
 * Get domain badge color based on hostname
 */
function getDomainBadgeColor(hostname) {
    if (hostname.includes('komiku')) {
        return 'bg-blue-100 text-blue-800';
    } else if (hostname.includes('komikcast')) {
        return 'bg-green-100 text-green-800';
    } else if (hostname.includes('sektedoujin')) {
        return 'bg-purple-100 text-purple-800';
    }
    return 'bg-gray-100 text-gray-800';
}

/**
 * Get domain display name
 */
function getDomainDisplayName(hostname) {
    if (hostname.includes('komiku')) {
        return 'komiku.org';
    } else if (hostname.includes('komikcast')) {
        return 'komikcast.fit';
    } else if (hostname.includes('sektedoujin')) {
        return 'sektedoujin.cc';
    }
    return hostname;
}

/**
 * CachedComicsApp - Main application class for cached comics page
 */
class CachedComicsApp {
    rootElement = document.querySelector('#root');

    constructor() {
        this.comics = [];
        this.isLoading = false;
        this.error = null;
        this.isSecretMode = isSecretMode();
    }

    static _instance;

    static get instance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new CachedComicsApp();
        return this._instance;
    }

    async init() {
        this.generateHeader();
        this.generateMainContainer();
        await this.fetchCachedComics();
        this.render();
    }

    generateHeader() {
        const header = document.createElement('header');
        header.className = 'px-4 py-4';

        const appTitle = document.createElement('h1');
        appTitle.className = 'text-4xl m-0 flex items-center gap-3';
        appTitle.textContent = CONFIG_DEFAULT.appName;

        // Add NSFW badge if mode is active
        if (this.isSecretMode) {
            const nsfwBadge = document.createElement('span');
            nsfwBadge.className =
                'text-sm bg-red-100 text-red-800 px-2 py-1 rounded font-medium';
            nsfwBadge.textContent = 'NSFW';
            appTitle.appendChild(nsfwBadge);
        }

        // Navigation
        const nav = document.createElement('nav');
        nav.className = 'flex gap-6 mt-4';

        const homeLink = document.createElement('a');
        homeLink.href = '/';
        homeLink.className =
            'text-gray-600 hover:text-gray-800 transition-colors';
        homeLink.textContent = 'Home';

        const aboutLink = document.createElement('a');
        aboutLink.href = '/about.html';
        aboutLink.className =
            'text-gray-600 hover:text-gray-800 transition-colors';
        aboutLink.textContent = 'Tentang Kami';

        const websitesLink = document.createElement('a');
        websitesLink.href = '/websites.html';
        websitesLink.className =
            'text-gray-600 hover:text-gray-800 transition-colors';
        websitesLink.textContent = 'Website yang Didukung';

        const cachedLink = document.createElement('a');
        cachedLink.href = '/cached.html';
        cachedLink.className = 'text-gray-800 border-b-2 border-gray-800';
        cachedLink.textContent = 'Ter-Cache';

        nav.append(homeLink, aboutLink, websitesLink, cachedLink);

        header.append(appTitle, nav);

        this.rootElement.append(header);
    }

    generateMainContainer() {
        const main = document.createElement('main');
        main.className = 'max-w-6xl mx-auto px-4 py-8';
        main.id = 'cached-comics-container';

        // Page title
        const pageTitle = document.createElement('h1');
        pageTitle.className = 'text-3xl font-bold mb-2';
        pageTitle.textContent = 'Komik Ter-Cache';

        // Page description
        const pageDesc = document.createElement('p');
        pageDesc.className = 'text-gray-600 mb-8';
        pageDesc.textContent =
            'Daftar komik yang sudah di-scrape dan tersimpan di cache.';

        // Content container
        const contentContainer = document.createElement('div');
        contentContainer.id = 'content-container';

        main.append(pageTitle, pageDesc, contentContainer);
        this.rootElement.append(main);

        this.contentContainer = contentContainer;
    }

    async fetchCachedComics() {
        this.isLoading = true;
        this.error = null;
        this.render();

        try {
            // Backend returns all comics; frontend filters based on localStorage
            const response = await fetch(
                `${CONFIG_DEFAULT.apiBaseUrl}/cached-comics`,
            );

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            this.comics = await response.json();
            this.isLoading = false;
        } catch (error) {
            console.error('Failed to fetch cached comics:', error);
            this.error = error.message;
            this.isLoading = false;
        }

        this.render();
    }

    render() {
        if (!this.contentContainer) return;

        this.contentContainer.innerHTML = '';

        if (this.isLoading) {
            this.renderLoading();
        } else if (this.error) {
            this.renderError();
        } else if (this.comics.length === 0) {
            this.renderEmpty();
        } else {
            this.renderComicsList();
        }
    }

    renderLoading() {
        const loadingContainer = document.createElement('div');
        loadingContainer.className =
            'flex flex-col items-center justify-center py-16';

        const spinner = document.createElement('div');
        spinner.className =
            'animate-spin w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full mb-4';

        const loadingText = document.createElement('p');
        loadingText.className = 'text-gray-600';
        loadingText.textContent = 'Memuat daftar komik ter-cache...';

        loadingContainer.append(spinner, loadingText);
        this.contentContainer.append(loadingContainer);
    }

    renderError() {
        const errorContainer = document.createElement('div');
        errorContainer.className =
            'bg-red-50 border-l-4 border-red-400 p-6 mb-6';

        const errorTitle = document.createElement('h2');
        errorTitle.className = 'text-xl font-semibold text-red-800 mb-2';
        errorTitle.textContent = 'Terjadi Kesalahan';

        const errorMessage = document.createElement('p');
        errorMessage.className = 'text-red-700';
        errorMessage.textContent = `Gagal memuat daftar komik ter-cache: ${this.error}`;

        const retryButton = document.createElement('button');
        retryButton.className =
            'mt-4 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition-colors';
        retryButton.textContent = 'Coba Lagi';
        retryButton.addEventListener('click', () => this.fetchCachedComics());

        errorContainer.append(errorTitle, errorMessage, retryButton);
        this.contentContainer.append(errorContainer);
    }

    renderEmpty() {
        const emptyContainer = document.createElement('div');
        emptyContainer.className = 'text-center py-16';

        const emptyIcon = document.createElement('div');
        emptyIcon.className = 'text-6xl mb-4';
        emptyIcon.textContent = '📚';

        const emptyTitle = document.createElement('h2');
        emptyTitle.className = 'text-2xl font-semibold text-gray-700 mb-2';
        emptyTitle.textContent = 'Belum ada komik yang di-cache';

        const emptyMessage = document.createElement('p');
        emptyMessage.className = 'text-gray-600';
        emptyMessage.textContent =
            'Baca komik pertama Anda untuk melihatnya muncul di sini.';

        emptyContainer.append(emptyIcon, emptyTitle, emptyMessage);
        this.contentContainer.append(emptyContainer);
    }

    renderComicsList() {
        const grid = document.createElement('div');
        grid.className = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

        // Filter comics based on NSFW preference
        const visibleComics = this.comics.filter((comic) => {
            // Show if not NSFW, or if NSFW mode is enabled
            return !comic.isNsfw || this.isSecretMode;
        });

        // Show filter notice if some comics are hidden
        const hiddenCount = this.comics.length - visibleComics.length;
        if (hiddenCount > 0) {
            // const filterNotice = document.createElement('div');
            // filterNotice.className = 'bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6 text-sm text-yellow-800';
            // filterNotice.innerHTML = `
            //     <p><strong>${hiddenCount} komik NSFW disembunyikan</strong></p>
            //     <p class="mt-1">
            //         <a href="/secret.html" class="underline hover:text-yellow-900">Buka Pengaturan</a>
            //         untuk melihat konten NSFW.
            //     </p>
            // `;
            // this.contentContainer.append(filterNotice);
        }

        visibleComics.forEach((comic) => {
            const card = this.createComicCard(comic);
            grid.append(card);
        });

        this.contentContainer.append(grid);
    }

    createComicCard(comic) {
        const card = document.createElement('div');
        card.className =
            'bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col';

        // Header with domain badge
        const cardHeader = document.createElement('div');
        cardHeader.className = 'flex items-start justify-between mb-4';

        const domainBadge = document.createElement('span');
        const badgeColor = getDomainBadgeColor(comic.domain);
        domainBadge.className = `${badgeColor} text-xs font-medium px-2.5 py-0.5 rounded`;
        domainBadge.textContent = getDomainDisplayName(comic.domain);

        cardHeader.append(domainBadge);

        // Comic title
        const title = document.createElement('h3');
        title.className =
            'text-lg font-semibold text-gray-900 mb-2 line-clamp-2';
        title.textContent = comic.title;

        // Comic URL
        const url = document.createElement('p');
        url.className = 'text-sm text-gray-500 mb-4 truncate';
        url.textContent = comic.url;
        url.title = comic.url;

        // Timestamp
        const timestamp = document.createElement('p');
        timestamp.className = 'text-sm text-gray-600 mb-4';
        timestamp.textContent = `Di-cache ${formatRelativeTime(comic.cachedAt)}`;

        // Spacer for flexbox
        const spacer = document.createElement('div');
        spacer.className = 'flex-grow';

        // Read button
        const readButton = document.createElement('a');
        readButton.href = this.buildReadUrl(comic);
        readButton.className =
            'w-full inline-block text-center px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors';
        readButton.textContent = 'Baca';

        card.append(cardHeader, title, url, timestamp, spacer, readButton);

        return card;
    }

    buildReadUrl(comic) {
        // No mode parameter in URL - main.js sends it based on localStorage
        return `/?url=${encodeURIComponent(comic.url)}`;
    }
}

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        CachedComicsApp.instance.init();
    });
} else {
    CachedComicsApp.instance.init();
}
