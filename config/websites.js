module.exports = {
    websites: {
        komiku: {
            name: 'Komiku',
            domains: ['komiku.org', 'komiku.id'],
            baseUrl: 'https://komiku.org',
            lang: 'id',
        },
        komikcast: {
            name: 'Komikcast',
            domains: ['v1.komikcast.fit'],
            baseUrl: 'https://v1.komikcast.fit',
            lang: 'id',
            useBrowser: true,
            waitUntil: 'networkidle0',
        },
        sektedoujin: {
            name: 'Sektedoujin',
            domains: ['sektedoujin.cc'],
            baseUrl: 'https://sektedoujin.cc',
            lang: 'id',
            useBrowser: true,
            nsfw: true,
        },
    },
};
