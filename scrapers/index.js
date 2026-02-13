const { websites } = require('../config/websites');
const KomikuScraper = require('./komiku');
const KomikcastScraper = require('./komikcast');

const scrapers = {
    komiku: new KomikuScraper(),
    komikcast: new KomikcastScraper()
};

function getScraperForDomain(domain) {
    // Extract hostname from domain (remove protocol)
    const hostname = domain.replace(/^https?:\/\//, '').replace(/:\d+$/, '');

    // Find which website config matches this domain
    for (const [key, config] of Object.entries(websites)) {
        if (config.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
            return scrapers[key];
        }
    }

    throw new Error(`No scraper found for domain: ${domain}`);
}

function getScraper(websiteKey) {
    const scraper = scrapers[websiteKey];
    if (!scraper) {
        throw new Error(`No scraper found for website: ${websiteKey}`);
    }
    return scraper;
}

function getWebsiteConfig(domain) {
    const hostname = domain.replace(/^https?:\/\//, '').replace(/:\d+$/, '');

    for (const [key, config] of Object.entries(websites)) {
        if (config.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
            return config;
        }
    }

    throw new Error(`No website config found for domain: ${domain}`);
}

module.exports = {
    getScraperForDomain,
    getScraper,
    getWebsiteConfig,
    scrapers
};
