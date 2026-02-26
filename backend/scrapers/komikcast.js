class KomikcastScraper {
    getSelectors() {
        return {
            chapterList: 'a[href*="/chapter/"]',
            chapterName: '.font-semibold',
            images: '#Baca_Komik img',
        };
    }

    getChapters($, domain) {
        const selectors = this.getSelectors();
        const data = [];

        $(selectors.chapterList).each((index, el) => {
            const element = $(el);
            const href = element.attr('href');
            if (!href) return;

            const chapter = element.find(selectors.chapterName).text().trim();
            if (!chapter) return;

            data.push({
                chapter,
                url: domain + href,
            });
        });

        return data;
    }

    getChapterData($, url = '') {
        // Extract title from URL: https://v1.komikcast.fit/series/magic-emperor/chapter/817
        // -> "Magic Emperor Chapter 817"
        const urlMatch = url.match(/\/series\/([^/]+)\/chapter\/(\d+)/);
        let title = '';

        if (urlMatch) {
            const seriesName = urlMatch[1]
                .split('-')
                .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            const chapterNumber = urlMatch[2];
            title = `${seriesName} Chapter ${chapterNumber}`;
        }

        // Extract images - only get actual comic pages (alt="Page X")
        const images = [];
        $('.chapter-scrollbar img[alt^="Page"]').each((_, img) => {
            const imgEl = $(img);
            const src = '/komik/image?url=' + imgEl.attr('src');
            if (src) {
                images.push(src);
            }
        });

        return {
            title,
            data: images,
        };
    }
}

module.exports = KomikcastScraper;
