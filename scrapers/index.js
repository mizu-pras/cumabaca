const { websites } = require('../config/websites');
const KomikuScraper = require('./komiku');

const scrapers = {
    komiku: new KomikuScraper()
};

function getScraperForDomain(domain) {
    // Extract hostname from domain (remove protocol)
    const hostname = domain.replace(/^https?:\/\//, '').replace(/:\d+$/, '');

    // Find which website config matches this domain
    for (const [key, config] of Object.entries(websites.websites)) {
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

module.exports = {
    getScraperForDomain,
    getScraper,
    scrapers
};
