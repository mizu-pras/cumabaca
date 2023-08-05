const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

function extractBodyContent(html) {
    let match = html.match(/(<body[^>]*>[\s\S]*?<\/body>)/i);
    return match ? match[1] : null;
}


router.post('/per-chapter', async (req, res, next) => {
    const { title, chapter } = req.body
    let prefix = req.body.prefix

    if (!prefix || !title || !chapter) {
        return next(new Error('params invalid'));
    }

    const lastPrefix = prefix[prefix.length - 1]

    if (lastPrefix !== '/') {
        prefix += '/';
    }

    const buildurl = `${prefix}${title}-chapter-${chapter}`

    console.log('buildurl', buildurl);

    const options = {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0' }
    };

    try {
        const response = await axios.get(buildurl, options);
        if (response.status != 200) {
            throw new Error(`get to ${buildurl} failed`);
        }

        const result = response.data.replace(/[\t\r\n]/g, '').trim()

        let $ = cheerio.load(result);

        const title = $('#Judul h1').first().text();
        const mainSection = $('#Baca_Komik').first()

        let data = {};
        data.title = title
        data.source = []

        mainSection.children('img').each((index, img) => {
            data.source[index] = {}
            data.source[index]['src'] = $(img).attr('src')
        })

        return res.json({
            success: true,
            data: data
        })

    } catch (error) {
        next(error);
    }
})

module.exports = router;