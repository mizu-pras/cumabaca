const {
    fetchData,
    fetchDataWithBrowser,
    validateUrl,
} = require('../utils/index');
const { getScraperForDomain, getWebsiteConfig } = require('../scrapers');

/**
 * Komik controller - handles chapter list and chapter data scraping
 * Extracts business logic from routes for better separation of concerns
 */

/**
 * GET /komik/chapters?url=<comic-url>&mode=<normal|secret>
 * Returns chapter list for a comic
 */
async function getChapters(req, res, next) {
    const { url, mode } = req.query;

    const domain = validateUrl(url);
    const config = getWebsiteConfig(domain);

    // Check if NSFW content requires secret mode
    if (mode !== 'secret' && config.nsfw) {
        return res.status(403).json({
            error: 'NSFW content',
            nsfw: true,
            useSecretMode: true,
        });
    }

    // Use browser if the website requires JavaScript rendering
    const fetchFn = config.useBrowser ? fetchDataWithBrowser : fetchData;
    const $ = await fetchFn(url, config);

    const scraper = getScraperForDomain(domain);
    const data = scraper.getChapters($, domain);

    if (data.length <= 0) {
        return res.status(404).json({ url, data });
    }

    res.json({
        url,
        data,
    });
}

/**
 * GET /komik/data?url=<chapter-url>&mode=<normal|secret>
 * Returns images for a specific chapter
 */
async function getChapterData(req, res, next) {
    const { url, mode } = req.query;

    const domain = validateUrl(url);
    const config = getWebsiteConfig(domain);

    // Check if NSFW content requires secret mode
    if (mode !== 'secret' && config.nsfw) {
        return res.status(403).json({
            error: 'NSFW content',
            nsfw: true,
            useSecretMode: true,
        });
    }

    // Use browser if the website requires JavaScript rendering
    const fetchFn = config.useBrowser ? fetchDataWithBrowser : fetchData;
    const $ = await fetchFn(url, config);

    const scraper = getScraperForDomain(domain);
    const data = scraper.getChapterData($, url);

    res.json(data);
}

module.exports = {
    getChapters,
    getChapterData,
};
