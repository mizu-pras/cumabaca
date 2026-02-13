class KomikuScraper {
    getSelectors() {
        return {
            chapterList: '.judulseries',
            chapterName: '[itemprop="name"]',
            chapterTitle: '#Judul h1',
            images: '#Baca_Komik img',
        };
    }

    getChapters($, domain) {
        const selectors = this.getSelectors();
        const data = [];

        const chapterListElement = $(selectors.chapterList);
        chapterListElement.each((index, el) => {
            const element = $(el);
            const anchor = element.children('a');

            const href = anchor.attr('href');
            if (!href) {
                return;
            }

            const chapter = anchor.find(selectors.chapterName).text();

            data.push({
                chapter,
                url: domain + href,
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
            data.push(imgEl.attr('src'));
        });

        return {
            title,
            data,
        };
    }
}

module.exports = KomikuScraper;
