const express = require('express');
const axios = require('axios');
const {
    fetchData,
    fetchDataWithBrowser,
    validateUrl,
} = require('../utils/index');
const { cacheMiddleware } = require('../utils/cache');
const { getScraperForDomain, getWebsiteConfig } = require('../scrapers');
const { del, clear, getStats } = require('../utils/mongodb-cache');

const ONE_DAY = 3600 * 24;

const router = express.Router();

router.get('/chapters', cacheMiddleware(ONE_DAY), async (req, res, next) => {
    const { url, mode } = req.query;

    try {
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
        const $ = await fetchFn(url);

        const scraper = getScraperForDomain(domain);
        const data = scraper.getChapters($, domain);

        res.json({
            url,
            data,
        });
    } catch (error) {
        next(error);
    }
});

router.get('/data', cacheMiddleware(ONE_DAY), async (req, res, next) => {
    const { url, mode } = req.query;

    try {
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
        const $ = await fetchFn(url);

        const scraper = getScraperForDomain(domain);
        const data = scraper.getChapterData($, url);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

// Image proxy endpoint to bypass CORS and hotlink protection
router.get('/image', async (req, res, next) => {
    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL parameter required' });
    }

    try {
        // Fetch image with proper Referer header to bypass hotlink protection
        const response = await axios({
            method: 'GET',
            url,
            responseType: 'stream',
            headers: {
                Referer: 'https://v1.komikcast.fit/',
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            },
            httpsAgent: new (require('https').Agent)({
                rejectUnauthorized: false,
            }),
        });

        // Set CORS and security headers to prevent OpaqueResponseBlocking
        res.setHeader('Content-Type', response.headers['content-type']);
        res.setHeader('Cache-Control', 'public, max-age=86400'); // Cache for 1 day
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
        res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');

        // Pipe image data to response
        response.data.pipe(res);
    } catch (error) {
        console.error('Image proxy error:', error.message);
        next(error);
    }
});

// === Admin Endpoints ===

/**
 * GET /komik/cache/stats
 * View cache statistics
 */
router.get('/cache/stats', async (req, res, next) => {
    try {
        const stats = await getStats();
        res.json(stats);
    } catch (error) {
        next(error);
    }
});

/**
 * DELETE /komik/cache?key=<cache-key>
 * Delete specific cache entry by key
 * DELETE /komik/cache
 * Clear all cache entries
 */
router.delete('/cache', async (req, res, next) => {
    try {
        const { key } = req.query;

        if (key) {
            // Delete specific cache entry
            const deleted = await del(key);

            if (deleted) {
                return res.json({
                    success: true,
                    message: `Cache entry deleted: ${key}`,
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: `Cache entry not found: ${key}`,
                });
            }
        } else {
            // Clear all cache entries
            const deletedCount = await clear();
            return res.json({
                success: true,
                deletedEntries: deletedCount,
                message: `Cleared ${deletedCount} cache entries`,
            });
        }
    } catch (error) {
        next(error);
    }
});

module.exports = router;
