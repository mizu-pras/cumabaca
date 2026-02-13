const CONFIG_DEFAULT = {
    appName: 'Cuma Baca',
    komik: 'https://komiku.org/manga/versatile-mage',
};

class LocalConfig {
    static getData(key, defaultData) {
        const data = localStorage.getItem(key);
        if (data) {
            return data;
        }

        if (defaultData) {
            localStorage.setItem(key, defaultData);

            return defaultData;
        }

        return null;
    }

    static setData(key, data) {
        if (typeof data === 'object') {
            const stringData = JSON.stringify(data);
            localStorage.setItem(key, stringData);
        } else {
            localStorage.setItem(key, data);
        }

        return data;
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
        ids: [],
    };

    komikData = [];
    chapterTitle = '';

    komik = '';
    activeChapter = '';

    isFetchChapterRunning = false;
    isFetchDataRunning = false;

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

        // Don't auto-fetch chapters on first load - user must click "Kirim" manually
        MainUI.instance.init();

        // add event listener
        document.addEventListener('scroll', this.handleScroll);
        document.addEventListener('scroll', MainUI.instance.handleScrollForBackToTop.bind(MainUI.instance));
        document.addEventListener('keydown', MainUI.instance.handleTabKey.bind(MainUI.instance));
    }

    resetKomik() {
        this.komik = LocalConfig.setData('komik', CONFIG_DEFAULT['komik']);
    }

    changeKomik(url) {
        this.komikData = [];
        this.chapterTitle = '';

        this.komik = LocalConfig.setData('komik', url);

        this.getChapterList(() => {
            MainUI.instance.showUI();
        });
    }

    prevChapter() {
        const curChapterIndex = this.chapters.ids.indexOf(this.activeChapter);
        const prevChapterIndex = curChapterIndex + 1;

        if (prevChapterIndex >= this.chapters.ids.length - 1) {
            return;
        }

        const prevChapter = this.chapters.ids[prevChapterIndex];
        this.changeChapter(prevChapter, true);
        MainUI.instance.updateSelectedChapter(prevChapter);
    }

    nextChapter(clear = true) {
        const curChapterIndex = this.chapters.ids.indexOf(this.activeChapter);
        const nextChapterIndex = curChapterIndex - 1;

        if (nextChapterIndex < 0) {
            return;
        }

        const nextChapter = this.chapters.ids[nextChapterIndex];
        this.changeChapter(nextChapter, clear);
        MainUI.instance.updateSelectedChapter(nextChapter);
    }

    changeChapter(chapter, clear = false) {
        if (!this.komik) {
            console.log('tidak ada komik yang dipilih');
            return;
        }

        if (!this.chapters.ids.includes(chapter)) {
            console.log('chapter tidak ada');
            return;
        }

        this.komikData = [];
        this.chapterTitle = '';

        this.activeChapter = LocalConfig.setData(
            `${this.komik}-chapter`,
            chapter,
        );

        this.getKomikData(
            clear,
            MainUI.instance.fetchKomikDataCallback.bind(MainUI.instance),
        );
    }

    getIndexChapter(chapter) {
        return this.chapters.ids.indexOf(chapter);
    }

    // api
    /**
     *
     * @param {Function | undefined} cb
     */
    async getChapterList(cb = undefined) {
        if (this.isFetchChapterRunning) {
            return;
        }

        this.isFetchChapterRunning = true;

        MainUI.instance.setFormLoading(true);
        MainUI.instance.loadingLoadChapterList();

        try {
            const params = new URLSearchParams({
                url: this.komik,
            });

            console.log('get chapter list', params);

            this.chapters.entities = {};
            this.chapters.ids = [];

            const response = await fetch(
                '/komik/chapters?' + params.toString(),
            );
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const chapters = await response.json();
            console.log('chapters', chapters);

            if (!chapters.data) {
                throw new Error('data tidaka ada');
            }

            /** @type {{chapter: string, url: string}[]} */
            const data = chapters.data;

            const byChapter = data.reduce((byChapter, value) => {
                byChapter[value.chapter] = value;
                return byChapter;
            }, {});

            this.chapters.entities = byChapter;
            this.chapters.ids = Object.keys(byChapter);

            if (this.chapters.ids.length > 0) {
                this.activeChapter = LocalConfig.getData(
                    `${this.komik}-chapter`,
                    this.chapters.ids[this.chapters.ids.length - 1],
                );
                this.getKomikData(
                    true,
                    MainUI.instance.fetchKomikDataCallback.bind(
                        MainUI.instance,
                    ),
                );
            }

            MainUI.instance.loadingLoadChapterListRemove();
            MainUI.instance.setFormLoading(false);
            this.isFetchChapterRunning = false;
            if (cb) {
                cb();
            }
        } catch (error) {
            // reset
            this.komik = '';
            this.activeChapter = '';

            console.log(error);

            MainUI.instance.loadingLoadChapterListRemove();
            MainUI.instance.setFormLoading(false);
            this.isFetchChapterRunning = false;
            if (cb) {
                cb();
            }
        }
    }

    /**
     *
     * @param {Function | undefined} cb
     */
    async getKomikData(clear = false, cb = undefined) {
        if (this.isFetchDataRunning) {
            return;
        }

        this.isFetchDataRunning = true;

        MainUI.instance.setChapterSelectLoading(true);

        if (clear) {
            MainUI.instance.render.innerHTML = '';
        } else {
            MainUI.instance.komikStatusRemove();
        }

        const idLoading = 'loading';
        MainUI.instance.komikStatusBuilder(idLoading, 'Loading...');

        try {
            if (!this.activeChapter) {
                throw new Error('tidak ada chapter yang dipilih');
            }

            const selectChapterData =
                this.chapters.entities[this.activeChapter];
            if (!selectChapterData) {
                throw new Error('chapter tida ada');
            }

            const params = new URLSearchParams({
                url: selectChapterData.url,
            });

            console.log('get komik data', params);

            const response = await fetch('/komik/data?' + params.toString());
            if (!response.ok) {
                throw new Error(response.statusText);
            }

            /** @type {{data: string[], title: string}} */
            const data = await response.json();
            console.log(data);

            if (!data.hasOwnProperty('data') || !data.hasOwnProperty('title')) {
                throw new Error('response data tida valid');
            }

            this.komikData = data.data;
            this.chapterTitle = data.title;

            this.isFetchDataRunning = false;
            MainUI.instance.setChapterSelectLoading(false);

            if (cb) {
                cb(clear);
            }
        } catch (error) {
            console.log(error);

            MainUI.instance.komikStatusRemove(idLoading);
            MainUI.instance.komikStatusBuilder('', error.message, true);

            this.isFetchDataRunning = false;
            MainUI.instance.setChapterSelectLoading(false);
        }
    }

    handleScroll() {
        let documentHeight = document.body.scrollHeight;
        let currentScroll = window.scrollY + window.innerHeight;
        // When the user is [modifier]px from the bottom, fire the event.
        let modifier = 4000;
        if (currentScroll + modifier > documentHeight) {
            if (MainApp.instance.isFetchDataRunning) {
                return;
            }

            MainApp.instance.nextChapter(false);
        }
    }
}

window.onload = () => {
    MainApp.instance.init();
};
