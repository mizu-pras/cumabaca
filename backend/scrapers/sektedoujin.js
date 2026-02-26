class SektedoujinScraper {
    getSelectors() {
        return {
            chapterList: '#chapterlist li',
            chapterName: '.chapternum',
            chapterTitle: '#chapterheading',
            images: '#readerarea img',
        };
    }

    getChapters($, domain) {
        const selectors = this.getSelectors();
        const data = [];

        $(selectors.chapterList).each((index, el) => {
            const anchor = $(el).find('a');
            const href = anchor.attr('href');
            if (!href) {
                return;
            }

            const chapter = anchor.find(selectors.chapterName).text();

            data.push({
                chapter,
                url: href, // Absolute URLs, no need to prepend domain
            });
        });

        return data;
    }

    getChapterData($, _url = undefined) {
        const selectors = this.getSelectors();
        const title = $(selectors.chapterTitle).first().text().trim();
        const images = $(selectors.images);

        const data = [];
        images.each((_, img) => {
            const imgEl = $(img);
            // Prioritize data-src (lazy-loaded images), fallback to src
            const src =
                '/komik/image?url=' +
                (imgEl.attr('data-src') || imgEl.attr('src'));
            data.push(src);
        });

        return {
            title,
            data,
        };
    }
}

module.exports = SektedoujinScraper;
