const express = require('express');
const { fetchData, validateUrl } = require('../utils/index')

const router = express.Router();

router.get('/chapters', async (req, res, next) => {
    const { url } = req.query;

    try {
        const domain = validateUrl(url);
        const $ = await fetchData(url);

        const data = [];

        const chapterListElement = $('.judulseries');
        chapterListElement.each((index, el) => {
            const element = $(el);
            const anchor = element.children('a');

            const href = anchor.attr('href');
            if (!href) {
                return;
            }

            const chapter = anchor.children('[itemprop="itemListElement"]').text();

            data.push({
                chapter,
                url: domain + href
            });
        });

        res.json({
            url,
            data
        });
    } catch (error) {
        next(error);
    }
});

router.get('/data', async (req, res, next) => {
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
            data
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;