const scraperClient = require('../middleware/scraperClient');
const { websites } = require('../config/websites');

/**
 * Get website configuration for a URL
 * Auto-fixes URLs missing protocol by prepending https://
 */
function getWebsiteConfig(url) {
    try {
        // Prepend https:// if URL is missing protocol
        let fullUrl = url;
        if (!url.match(/^https?:\/\//i)) {
            fullUrl = 'https://' + url;
        }

        const urlObj = new URL(fullUrl);
        const hostname = urlObj.hostname;

        for (const [key, config] of Object.entries(websites)) {
            if (config.domains.some(d => hostname === d || hostname.endsWith('.' + d))) {
                return config;
            }
        }
        return null;
    } catch {
        return null;
    }
}

/**
 * GET /komik/chapters?url=<comic-url>&mode=<normal|secret>
 * Returns chapter list for a comic
 */
async function getChapters(req, res, next) {
    const { url, mode = 'normal' } = req.query;

    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL parameter is required'
        });
    }

    try {
        // Validate URL is from supported website
        const config = getWebsiteConfig(url);
        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported website URL'
            });
        }

        // Check NSFW mode requirement
        if (config.nsfw && mode !== 'secret') {
            return res.status(403).json({
                success: false,
                error: 'This content requires secret mode',
                nsfw: true,
                useSecretMode: true
            });
        }

        // Ensure URL has protocol for scraper service
        let fullUrl = url;
        if (!url.match(/^https?:\/\//i)) {
            fullUrl = 'https://' + url;
        }

        // Call scraper service
        const result = await scraperClient.getChapters(fullUrl, mode);

        // Handle empty results
        if (result.data && result.data.length === 0) {
            return res.status(404).json({
                success: false,
                url,
                data: []
            });
        }

        res.json(result);

    } catch (error) {
        if (error.message === 'Scraper service unavailable') {
            return res.status(504).json({
                success: false,
                error: 'Scraper service unavailable. Please try again later.',
                retryAfter: 60
            });
        }
        next(error);
    }
}

/**
 * GET /komik/data?url=<chapter-url>&mode=<normal|secret>
 * Returns images for a specific chapter
 */
async function getChapterData(req, res, next) {
    const { url, mode = 'normal' } = req.query;

    if (!url) {
        return res.status(400).json({
            success: false,
            error: 'URL parameter is required'
        });
    }

    try {
        // Validate URL is from supported website
        const config = getWebsiteConfig(url);
        if (!config) {
            return res.status(400).json({
                success: false,
                error: 'Unsupported website URL'
            });
        }

        // Check NSFW mode requirement
        if (config.nsfw && mode !== 'secret') {
            return res.status(403).json({
                success: false,
                error: 'This content requires secret mode',
                nsfw: true,
                useSecretMode: true
            });
        }

        // Ensure URL has protocol for scraper service
        let fullUrl = url;
        if (!url.match(/^https?:\/\//i)) {
            fullUrl = 'https://' + url;
        }

        // Call scraper service
        const result = await scraperClient.getData(fullUrl, mode);

        res.json(result);

    } catch (error) {
        if (error.message === 'Scraper service unavailable') {
            return res.status(504).json({
                success: false,
                error: 'Scraper service unavailable. Please try again later.',
                retryAfter: 60
            });
        }
        next(error);
    }
}

module.exports = {
    getChapters,
    getChapterData,
};
