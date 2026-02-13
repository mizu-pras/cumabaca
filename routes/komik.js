const express = require('express');
const cache = require('memory-cache');
const { fetchData, validateUrl } = require('../utils/index');

const ONE_DAY = 3600 * 24;
const cacheMiddleware = (duration) => {
    return (req, res, next) => {
        let key = '__express__' + req.originalUrl || req.url;
        let cachedBody = cache.get(key);
        if (cachedBody) {
            res.send(cachedBody);
            return;
        } else {
            res.sendResponse = res.send;
            res.send = (body) => {
                cache.put(key, body, duration * 1000);
                res.sendResponse(body);
            };
            next();
        }
    };
};

const router = express.Router();

router.get('/chapters', cacheMiddleware(ONE_DAY), async (req, res, next) => {
    const { url } = req.query;

    try {
        const domain = validateUrl(url);
        const $ = await fetchData(url);

        console.log('get chapters', $);

        const data = [];

        const chapterListElement = $('.judulseries');
        chapterListElement.each((index, el) => {
            const element = $(el);
            const anchor = element.children('a');

            const href = anchor.attr('href');
            if (!href) {
                return;
            }

            const chapter = anchor.find('[itemprop="name"]').text();

            data.push({
                chapter,
                url: domain + href,
            });
        });

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
        validateUrl(url);
        const $ = await fetchData(url);

        const title = $('#Judul h1').first().text().trim();
        const Images = $('#Baca_Komik img');

        const data = [];
        Images.each((_, img) => {
            const imgEl = $(img);

            data.push(imgEl.attr('src'));
        });

        res.json({
            title,
            data,
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
