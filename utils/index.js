const cheerio = require('cheerio');

function getDomain(url) {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.origin; // Mengembalikan protokol bersama dengan nama host
    } catch (e) {
        console.error("URL tidak valid:", url);
        return null;
    }
}

function loadCheerio(html) {
    const result = html.replace(/[\t\r\n]/g, '').trim()

    return cheerio.load(result)
}

module.exports = {
    getDomain,
    loadCheerio
}