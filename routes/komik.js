const express = require('express');
const axios = require('axios');
const { getDomain, loadCheerio } = require('../utils/index')

const router = express.Router();

router.get('/chapters', async (req, res, next) => {
    const { url } = req.query

    const domain = getDomain(url)
    if (!domain) {
        return next(new Error('url tidak valid'));
    }

    try {
        const response = await axios(url)

        if (!response.data) {
            throw new Error('Ada yang salah!');
        }

        const $ = loadCheerio(response.data);

        const data = []

        const chapterListElement = $('.judulseries')
        chapterListElement.each((index, el) => {
            const element = $(el)
            const anchor = element.children('a')

            const href = anchor.attr('href')
            if (!href) {
                return
            }

            const chapter = anchor.children('[itemprop="itemListElement"]').text()

            data.push({
                chapter,
                url: domain + href
            })
        })

        res.json({
            url,
            data
        })
    } catch (error) {
        next(error);
    }
})

router.get('/data', async (req, res, next) => {
    const { url } = req.query;

    if (!getDomain(url)) {
        return next(new Error('url tidak valid'));
    }

    try {
        const response = await axios(url);

        if (!response.data) {
            throw new Error('Ada yang salah!');
        }

        const $ = loadCheerio(response.data);

        const title = $('#Judul h1').first().text().trim();
        const Images = $('#Baca_Komik img');

        const data = [];
        Images.each((index, img) => {
            const imgEl = $(img);

            data.push(imgEl.attr('src'));
        })

        res.json({
            title,
            data
        })

    } catch (error) {
        next(error);
    }
})

module.exports = router;