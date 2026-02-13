const express = require('express');
const { fetchData, validateUrl } = require('../utils/index');
const { cacheMiddleware } = require('../utils/cache');
const { getScraperForDomain } = require('../scrapers');

const ONE_DAY = 3600 * 24;

const router = express.Router();

router.get('/chapters', cacheMiddleware(ONE_DAY), async (req, res, next) => {
    const { url } = req.query;

    try {
        const domain = validateUrl(url);
        const $ = await fetchData(url);

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
    const { url } = req.query;

    try {
        const domain = validateUrl(url);
        const $ = await fetchData(url);

        const scraper = getScraperForDomain(domain);
        const data = scraper.getChapterData($);

        res.json(data);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
