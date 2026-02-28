import { websites } from '../config/websites.js';
import { KomikuScraper } from './komiku.js';
import { KomikcastScraper } from './komikcast.js';
import { SektedoujinScraper } from './sektedoujin.js';

const scrapers = {
    komiku: new KomikuScraper(),
    komikcast: new KomikcastScraper(),
    sektedoujin: new SektedoujinScraper()
};

export function getScraperForDomain(domain) {
    // Extract hostname from URL (remove protocol and path)
    let hostname;
    try {
        hostname = new URL(domain).hostname;
    } catch {
        // If not a valid URL, assume it's already a hostname
        hostname = domain.replace(/^https?:\/\//, '').replace(/:\d+$/, '').split('/')[0];
    }

    // Find which website config matches this domain
    for (const [key, config] of Object.entries(websites)) {
        if (config.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
            return scrapers[key];
        }
    }

    throw new Error(`No scraper found for domain: ${domain}`);
}

export function getScraper(websiteKey) {
    const scraper = scrapers[websiteKey];
    if (!scraper) {
        throw new Error(`No scraper found for website: ${websiteKey}`);
    }
    return scraper;
}

export function getWebsiteConfig(domain) {
    // Extract hostname from URL (remove protocol and path)
    let hostname;
    try {
        hostname = new URL(domain).hostname;
    } catch {
        // If not a valid URL, assume it's already a hostname
        hostname = domain.replace(/^https?:\/\//, '').replace(/:\d+$/, '').split('/')[0];
    }

    for (const [key, config] of Object.entries(websites)) {
        if (config.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
            return config;
        }
    }

    throw new Error(`No website config found for domain: ${domain}`);
}

export { scrapers };
