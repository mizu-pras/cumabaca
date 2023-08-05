const CONFIG_DEFAULT = {
    komik: 'https://komiku.id/manga/versatile-mage'
}

class LocalConfig {
    static getData(key, defaultData) {
        const data = localStorage.getItem(key)
        if (data) {
            return data;
        }

        if (defaultData) {
            localStorage.setItem(key, defaultData)

            return defaultData
        }

        return null
    }

    static setData(key, data) {
        if (typeof data === 'object') {
            const stringData = JSON.stringify(data)
            localStorage.setItem(key, stringData)
        }
        else {
            localStorage.setItem(key, data)
        }

        return data
    }
}

// class Config {
//     manga = ''
//     activeChapter = ''
// }

class MainApp {
    /** @type {{entities: {[key: string]: {chapter: string, url: string}}, ids: string[]}} */
    chapters = {
        entities: {},
        ids: []
    }

    komikData = []

    komik = ''
    activeChapter = ''

    static _instance;

    static get instance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new MainApp();
        return this._instance;
    }

    init() {
        console.log('main app init');

        this.komik = LocalConfig.getData('komik', CONFIG_DEFAULT['komik']);

        this.getChapterList()

        // add event listener
    }

    resetKomik() {
        this.komik = LocalConfig.setData('komik', CONFIG_DEFAULT['komik']);
    }

    changeKomik(url) {
        url = validateAndFormatURL(url)

        if (!url) {
            return
        }

        this.komikData = []
        this.komik = LocalConfig.setData('komik', url);

        this.getChapterList();
    }

    changeChapter(chapter) {
        if (!this.komik) {
            console.log('tidak ada komik yang dipilih');
            return
        }

        if (!this.chapters.ids.includes(chapter)) {
            console.log('chapter tidak ada');
            return
        }

        const curChapIndex = this.getIndexChapter(this.activeChapter);
        const targetChapIndex = this.getIndexChapter(chapter);
        console.log({ curChapIndex, targetChapIndex });

        const isNextChapter = curChapIndex - 1 === targetChapIndex

        if (!isNextChapter) {
            this.komikData = []
        }

        this.activeChapter = LocalConfig.setData(`${this.komik}-chapter`, chapter);

        this.getKomikData();
    }

    getIndexChapter(chapter) {
        return this.chapters.ids.indexOf(chapter)
    }

    // api
    async getChapterList() {
        try {
            const params = new URLSearchParams({
                url: this.komik
            })

            console.log('get chapter list', params)

            this.chapters.entities = {}
            this.chapters.ids = []

            const response = await fetch('/komik/chapters?' + params.toString());
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const chapters = await response.json();
            console.log('chapters', chapters)

            if (!chapters.data) {
                throw new Error('data tidaka ada');
            }

            /** @type {{chapter: string, url: string}[]} */
            const data = chapters.data

            const byChapter = data.reduce((byChapter, value) => {
                byChapter[value.chapter] = value
                return byChapter
            }, {})

            this.chapters.entities = byChapter
            this.chapters.ids = Object.keys(byChapter)

            if (this.chapters.ids.length > 0) {
                this.activeChapter = LocalConfig.getData(`${this.komik}-chapter`, this.chapters.ids[this.chapters.ids.length - 1]);
                this.getKomikData();
            }

        } catch (error) {
            // reset
            this.komik = '';
            this.activeChapter = '';

            console.log(error)
        }
    }

    async getKomikData() {
        try {
            if (!this.activeChapter) {
                throw new Error('tidak ada chapter yang dipilih')
            }

            const selectChapterData = this.chapters.entities[this.activeChapter]
            if (!selectChapterData) {
                throw new Error('chapter tida ada');
            }

            const params = new URLSearchParams({
                url: selectChapterData.url
            })

            console.log('get komik data', params)

            const response = await fetch('/komik/data?' + params.toString());
            if (!response.ok) {
                throw new Error(response.statusText)
            }

            /** @type {{data: string[], title: string}} */
            const data = await response.json();
            console.log(data);

            if (!data.hasOwnProperty('data') || !data.hasOwnProperty('title')) {
                throw new Error('response data tida valid');
            }

            this.komikData.push(data);

        } catch (error) {
            console.log(error)
        }
    }
}

function validateAndFormatURL(url) {
    try {
        let parsedUrl = new URL(url);

        let formattedUrl = parsedUrl.origin + parsedUrl.pathname;
        if (formattedUrl.endsWith('/')) {
            formattedUrl = formattedUrl.slice(0, -1); // Menghapus '/' di akhir jika ada
        }

        return formattedUrl;
    } catch (e) {
        console.error("URL tidak valid:", url);
        return null;
    }
}

window.onload = () => {
    MainApp.instance.init();
}