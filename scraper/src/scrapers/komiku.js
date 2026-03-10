export class KomikuScraper {
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

    getComicList($) {
        const comics = [];

        $('div.bge').each((_, el) => {
            const element = $(el);

            // Title
            const title = element.find('div.kan a h3').first().text().trim();
            if (!title) return;

            // URL (from the kan link, relative path)
            const url = element.find('div.kan > a').first().attr('href');
            if (!url) return;

            // Cover image
            const cover = element.find('div.bgei img').first().attr('src') || '';

            // Type and Genre from tpe1_inf: "<b>Manga</b> Fantasi"
            const typeGenreEl = element.find('div.tpe1_inf');
            const type = typeGenreEl.find('b').text().trim() || 'Manga';
            // Genre is the text after the <b> tag
            const fullText = typeGenreEl.text().trim();
            const genre = fullText.replace(type, '').trim() || '';

            comics.push({ title, url, cover, type, genre });
        });

        return comics;
    }
}
