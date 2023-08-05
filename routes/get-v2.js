const express = require('express');
const router = express.Router();
const axios = require('axios');
const cheerio = require('cheerio');

function extractBodyContent(html) {
    let match = html.match(/(<body[^>]*>[\s\S]*?<\/body>)/i);
    return match ? match[1] : null;
}

const patternUrl = (pattern = 1, prefix, title, chapter) => {
    const buildurl = pattern <= 3
        ? `${title}-chapter-${chapter}`
        : `${title}-chapter-${String(chapter).padStart(2, 0)}`

    if (pattern === 1) {
        return `${prefix}${buildurl}`
    }
    else if (pattern === 2) {
        return `${prefix}httpsadmin-komiku-org${buildurl}`
    }
    else if (pattern === 3) {
        return `${prefix}${buildurl}-bahasa-indonesia`
    }
    else if (pattern === 4) {
        return `${prefix}${buildurl}`
    }
    else if (pattern === 5) {
        return `${prefix}httpsadmin-komiku-org${buildurl}`
    }
    else if (pattern === 6) {
        return `${prefix}${buildurl}-bahasa-indonesia`
    }

    return null
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

    // const buildurl = `${title}-chapter-${chapter}`

    // console.log('buildurl', buildurl);

    const options = {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/115.0' }
    };

    try {
        let responseData = null

        let pattern = 1
        while (!responseData) {
            const url = patternUrl(pattern, prefix, title, chapter)

            if (!url) {
                throw new Error('url tidak valid, check url asli di web komiku')
            }

            console.log('get url', url)

            const response = await axios.get(url, options);
            if (response.status != 200) {
                throw new Error(`get to ${buildurl} failed`);
            }

            responseData = response.data

            pattern++
        }

        // if (!response.data) {
        //     const url2 = prefix + buildurl + '-bahasa-indonesia'
        //     console.log('try', url2)

        //     const response2 = await axios.get(url2)
        //     if (response2.status != 200) {
        //         throw new Error(`get to ${buildurl} failed`);
        //     }

        //     if (response2.data) {
        //         response.data = response2.data
        //     }
        //     else {
        //         const url3 = prefix + 'httpsadmin-komiku-org' + buildurl
        //         console.log('try', url3)

        //         const response3 = await axios.get(url3)
        //         if (response3.status != 200) {
        //             throw new Error(`get to ${buildurl} failed`);
        //         }

        //         response.data = response3.data;
        //     }
        // }

        const result = responseData.replace(/[\t\r\n]/g, '').trim()

        let $ = cheerio.load(result);

        const titleData = $('#Judul h1').first().text();
        const mainSection = $('#Baca_Komik').first()

        let data = {};
        data.title = titleData
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