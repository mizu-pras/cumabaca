

class MainUI {
    rootElement = document.querySelector('#root');

    formKomik = document.createElement('form');
    render = document.createElement('div');

    /** @type {HTMLSelectElement} */
    chapterElement = null

    static _instance;

    static get instance() {
        if (this._instance) {
            return this._instance;
        }

        this._instance = new MainUI();
        return this._instance;
    }

    constructor() {
        this.render.setAttribute('id', 'render');
    }

    init() {
        this.generateHeaderApp();
        this.generateKomikForm();

        // event listener
        this.formKomik.addEventListener('submit', this.handleKomikFormSubmit);
    }

    showUI() {
        this.generateSelectChapter();
        this.chapterOptionBuilder();

        this.rootElement.append(this.render);

        this.controllBuilder();
        this.controllBuilder(true);
    }

    generateHeaderApp() {
        const header = document.createElement('header');

        const appTitle = document.createElement('h1');
        appTitle.textContent = CONFIG_DEFAULT.appName;

        const appDesc = document.createElement('h3')
        appDesc.setAttribute('class', 'subtitle');
        appDesc.innerHTML = `
            Tempat paling sederhana untuk membaca komik dari
            <a href="https://komiku.id" target="_blank">komiku</a>
        `

        header.append(appTitle);
        header.append(appDesc);

        this.rootElement.append(header);
    }

    generateKomikForm() {
        const formContainer = document.createElement('div');
        formContainer.setAttribute('class', 'form-container');

        const formControll = document.createElement('div');
        formControll.setAttribute('class', 'form-control');

        const labelUrl = document.createElement('label');
        labelUrl.setAttribute('for', 'url');
        labelUrl.textContent = 'URL Komik:'

        const inputurl = document.createElement('input');
        inputurl.setAttribute('type', 'text');
        inputurl.setAttribute('name', 'url');
        inputurl.setAttribute('placeholder', 'url komik');

        const komik = MainApp.instance.komik;
        if (komik) {
            inputurl.setAttribute('value', komik);
        }

        const submitButton = document.createElement('button');
        submitButton.setAttribute('type', 'submit');
        submitButton.textContent = 'Submit';

        const clearSubmit = document.createElement('button');
        clearSubmit.setAttribute('type', 'reset');
        clearSubmit.textContent = 'Clear';

        formControll.append(labelUrl, inputurl);
        formContainer.append(formControll, submitButton, clearSubmit);

        this.formKomik.prepend(formContainer);

        this.rootElement.append(this.formKomik);
    }

    generateSelectChapter() {
        const chapterSelectConatiner = document.createElement('div');
        chapterSelectConatiner.setAttribute('class', 'chapter-select-container');

        const labelChapter = document.createElement('label');
        labelChapter.setAttribute('for', 'url');
        labelChapter.textContent = 'Pilih Chapter:'

        this.chapterElement = document.createElement('select');
        this.chapterElement.setAttribute('name', 'chapter');

        chapterSelectConatiner.append(labelChapter, this.chapterElement);

        this.chapterElement.addEventListener('change', this.handleChapterChange)

        this.rootElement.append(chapterSelectConatiner);
    }


    chapterOptionBuilder() {
        /** @type {{entities: {[key: string]: {chapter: string, url: string}}, ids: string[]}} */
        const chapters = MainApp.instance.chapters;
        const { ids } = chapters;

        const activeChapter = MainApp.instance.activeChapter;

        const options = []
        ids.forEach(key => {
            const option = document.createElement('option');
            option.setAttribute('value', key);
            option.textContent = key;

            if (key === activeChapter) {
                option.setAttribute('selected', true)
            }

            options.push(option);
        });

        if (this.chapterElement) {
            this, this.chapterElement.innerHTML = '';
            this.chapterElement.append(...options);
        }
    }

    komikTitleBuilder() {
        /**
        <div class="komik-title">
            <h3>Judul Komik Yang Bagus</h3>
        </div>
         */
        const title = MainApp.instance.chapterTitle;

        const komikTitle = document.createElement('div');
        komikTitle.setAttribute('class', 'komik-title');

        komikTitle.innerHTML = `<h3>${title}</h3>`;

        return komikTitle;
    }

    komikStatusBuilder(id = '', message = '', isError = false) {
        /**
        <div class="baca-status">
            <p>Loading...</p>
        </div>
         */
        const komikStatus = document.createElement('div');
        komikStatus.setAttribute('class', 'baca-status');

        if (id) {
            komikStatus.setAttribute('id', id);
        }

        const label = document.createElement('p');
        if (isError) {
            label.setAttribute('class', 'error');
        }
        label.textContent = message;

        komikStatus.append(label);

        this.render.append(komikStatus);
    }

    komikStatusRemove(id = '') {
        if (id) {
            const el = document.querySelector(id)
            if (el) {
                el.parentElement.removeChild(el);
            }
        }
        else {
            const childs = document.querySelectorAll('.baca-status')
            if (childs && childs.length > 0) {
                this.render.removeChild(...childs);
            }
        }
    }

    komikBacaBuilder() {
        const baca = document.createElement('div');
        baca.setAttribute('class', 'baca');

        /** @type {string[]} */
        const komikData = MainApp.instance.komikData

        komikData.forEach(data => {
            const img = new Image();
            img.src = data;

            baca.append(img);
        })

        return baca;
    }

    fetchKomikDataCallback(clear) {
        if (clear) {
            this.render.innerHTML = '';
        }
        else {
            this.komikStatusRemove();
        }

        const titleEl = this.komikTitleBuilder();
        const bacaEl = this.komikBacaBuilder();

        this.render.append(titleEl);
        titleEl.after(bacaEl);
    }

    controllBuilder(isTop = false) {
        const controllContainer = document.createElement('div');
        controllContainer.setAttribute('class', 'controll-container');

        const prevButton = document.createElement('button');
        prevButton.setAttribute('type', 'button');
        prevButton.textContent = 'Prev';

        const nextButton = document.createElement('button');
        nextButton.setAttribute('type', 'button');
        nextButton.textContent = 'Next';

        prevButton.addEventListener('click', function () {
            MainApp.instance.prevChapter()
        })

        nextButton.addEventListener('click', function () {
            MainApp.instance.nextChapter(isTop);
        })

        controllContainer.append(prevButton, nextButton);

        if (isTop) {
            this.render.before(controllContainer);
        }
        else {
            this.render.after(controllContainer);
        }
    }

    loadingLoadChapterList() {
        const loading = document.createElement('span');
        loading.setAttribute('class', 'loading-chapter-list');

        const komik = MainApp.instance.komik;

        loading.innerHTML = `Load chapters list for <a target="_blank" href="${komik}">${komik}`;

        this.formKomik.append(loading);
    }

    loadingLoadChapterListRemove() {
        const loadings = document.querySelectorAll('.loading-chapter-list');
        if (loadings.length > 0) {
            this.formKomik.removeChild(...loadings);
        }
    }

    updateSelectedChapter(value) {
        if (this.chapterElement) {
            this.chapterElement.value = value
        }
    }

    /**
     * @param {SubmitEvent} e 
     */
    handleKomikFormSubmit(e) {
        e.preventDefault();

        console.log('submit form komik');

        const formData = new FormData(MainUI.instance.formKomik);

        const url = validateAndFormatURL(formData.get('url'));
        if (!url) {
            console.log('abort form submit');
            return;
        }

        MainApp.instance.changeKomik(url)

    }

    /**
     * @param {Event} e 
     */
    handleChapterChange(e) {
        const chapter = e.target.value;

        console.log('chapter', chapter);

        MainApp.instance.changeChapter(chapter, true);
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