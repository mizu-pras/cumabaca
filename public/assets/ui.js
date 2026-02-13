class MainUI {
    rootElement = document.querySelector('#root');

    formKomik = document.createElement('form');
    render = document.createElement('div');

    /** @type {HTMLSelectElement} */
    chapterElement = null;

    /** @type {HTMLButtonElement | null} */
    backToTopButton = null;

    /** @type {HTMLDivElement | null} */
    floatingChapterSelector = null;

    /** @type {HTMLButtonElement | null} */
    chapterTriggerButton = null;

    /** @type {HTMLInputElement | null} */
    urlInput = null;

    /** @type {HTMLButtonElement | null} */
    submitButton = null;

    /** @type {HTMLButtonElement | null} */
    clearButton = null;

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
        this.backToTopButton = this.generateBackToTopButton();
        this.chapterTriggerButton = this.generateChapterTrigger();
        this.floatingChapterSelector = this.generateFloatingChapterSelector();

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
        header.className = 'px-4 py-4';

        const appTitle = document.createElement('h1');
        appTitle.className = 'text-4xl m-0';
        appTitle.textContent = CONFIG_DEFAULT.appName;

        const appDesc = document.createElement('h3');
        appDesc.className = 'font-normal m-0';
        appDesc.innerHTML = `
            Tempat paling efisien untuk membaca komik
        `;

        // Navigation
        const nav = document.createElement('nav');
        nav.className = 'flex gap-6 mt-4';

        // Check if we should add mode parameter
        const isSecretMode = MainApp.isSecretMode();
        const modeParam = isSecretMode ? '?mode=secret' : '';

        const homeLink = document.createElement('a');
        homeLink.href = '/' + modeParam;
        homeLink.className = 'text-gray-800 border-b-2 border-gray-800';
        homeLink.textContent = 'Home';

        const aboutLink = document.createElement('a');
        aboutLink.href = '/about.html' + modeParam;
        aboutLink.className =
            'text-gray-600 hover:text-gray-800 transition-colors';
        aboutLink.textContent = 'Tentang Kami';

        const websitesLink = document.createElement('a');
        websitesLink.href = '/websites.html' + modeParam;
        websitesLink.className =
            'text-gray-600 hover:text-gray-800 transition-colors';
        websitesLink.textContent = 'Website yang Didukung';

        nav.append(homeLink, aboutLink, websitesLink);

        header.append(appTitle);
        header.append(appDesc);
        header.append(nav);

        this.rootElement.append(header);
    }

    generateKomikForm() {
        const formContainer = document.createElement('div');
        formContainer.className =
            'px-4 py-[0.3em] flex items-center flex-wrap gap-2';

        const formControll = document.createElement('div');
        formControll.className = 'flex items-center gap-1';

        const labelUrl = document.createElement('label');
        labelUrl.setAttribute('for', 'url');
        labelUrl.textContent = 'URL Komik:';

        this.urlInput = document.createElement('input');
        this.urlInput.className =
            'w-[250px] px-4 py-2 border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-gray-500 transition-colors';
        this.urlInput.setAttribute('type', 'text');
        this.urlInput.setAttribute('name', 'url');
        this.urlInput.setAttribute('placeholder', 'url komik');

        const komik = MainApp.instance.komik;
        if (komik) {
            this.urlInput.setAttribute('value', komik);
        }

        this.submitButton = document.createElement('button');
        this.submitButton.className =
            'px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors flex items-center gap-1';
        this.submitButton.setAttribute('type', 'submit');
        this.submitButton.innerHTML =
            '<span class="btn-text">Kirim</span><span class="spinner hidden flex items-center gap-1"><svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Loading...</span>';

        this.clearButton = document.createElement('button');
        this.clearButton.className =
            'px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors';
        this.clearButton.setAttribute('type', 'reset');
        this.clearButton.textContent = 'Hapus';

        formControll.append(labelUrl, this.urlInput);
        formContainer.append(formControll, this.submitButton, this.clearButton);

        this.formKomik.prepend(formContainer);

        this.rootElement.append(this.formKomik);
    }

    generateSelectChapter() {
        const chapterSelectConatiner = document.createElement('div');
        chapterSelectConatiner.className =
            'px-4 py-[0.3em] mt-4 flex items-center gap-2';

        const labelChapter = document.createElement('label');
        labelChapter.setAttribute('for', 'url');
        labelChapter.textContent = 'Pilih Bab:';

        this.chapterElement = document.createElement('select');
        this.chapterElement.className =
            'px-4 py-2 border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-gray-500 transition-colors';
        this.chapterElement.setAttribute('name', 'chapter');

        chapterSelectConatiner.append(labelChapter, this.chapterElement);

        this.chapterElement.addEventListener(
            'change',
            this.handleChapterChange,
        );

        this.rootElement.append(chapterSelectConatiner);
    }

    chapterOptionBuilder() {
        /** @type {{entities: {[key: string]: {chapter: string, url: string}}, ids: string[]}} */
        const chapters = MainApp.instance.chapters;
        const { ids } = chapters;

        const activeChapter = MainApp.instance.activeChapter;

        const options = [];
        ids.forEach((key) => {
            const option = document.createElement('option');
            option.setAttribute('value', key);
            option.textContent = key;

            if (key === activeChapter) {
                option.setAttribute('selected', true);
            }

            options.push(option);
        });

        // Update main select
        if (this.chapterElement) {
            this.chapterElement.innerHTML = '';
            this.chapterElement.append(...options);
        }

        // Update floating select
        const floatingSelect = document.querySelector(
            '[data-floating-chapter-select]',
        );
        if (floatingSelect) {
            floatingSelect.innerHTML = '';
            const clonedOptions = options.map((opt) => opt.cloneNode(true));
            floatingSelect.append(...clonedOptions);
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
        komikTitle.className = 'my-2';

        komikTitle.innerHTML = `<h3 class="m-0 text-center text-2xl">${title}</h3>`;

        return komikTitle;
    }

    komikStatusBuilder(id = '', message = '', isError = false) {
        /**
        <div class="baca-status">
            <p>Loading...</p>
        </div>
         */
        const komikStatus = document.createElement('div');
        komikStatus.className = 'px-4 py-4 flex items-center justify-center';
        komikStatus.dataset.bacaStatus = '';

        if (id) {
            komikStatus.setAttribute('id', id);
        }

        const label = document.createElement('p');
        if (isError) {
            label.className = 'text-red-500';
        }
        label.textContent = message;

        komikStatus.append(label);

        this.render.append(komikStatus);
    }

    komikStatusRemove(id = '') {
        if (id) {
            const el = document.querySelector(id);
            if (el) {
                el.parentElement.removeChild(el);
            }
        } else {
            const childs = this.render.querySelectorAll('[data-baca-status]');
            if (childs && childs.length > 0) {
                this.render.removeChild(...childs);
            }
        }
    }

    komikBacaBuilder() {
        const baca = document.createElement('div');
        baca.className = 'flex flex-col items-center mb-16';

        /** @type {string[]} */
        const komikData = MainApp.instance.komikData;

        komikData.forEach((data) => {
            const img = new Image();
            img.className = 'w-full max-w-[1000px]';
            // Use proxy for Komikcast images to bypass CORS/hotlink protection
            img.src = this.getImageUrl(data);

            baca.append(img);
        });

        return baca;
    }

    /**
     * Get the appropriate image URL - use proxy for Komikcast images
     * @param {string} url
     * @returns {string}
     */
    getImageUrl(url) {
        // Check if URL needs proxy (Komikcast images)
        // if (url.includes('imgkc1') || url.includes('komikcast')) {
        //     return '/komik/image?url=' + encodeURIComponent(url);
        //     // return 'https://wsrv.nl/?url=' + encodeURIComponent(url);
        // }
        return url;
    }

    fetchKomikDataCallback(clear) {
        if (clear) {
            this.render.innerHTML = '';
        } else {
            this.komikStatusRemove();
        }

        const titleEl = this.komikTitleBuilder();
        const bacaEl = this.komikBacaBuilder();

        this.render.append(titleEl);
        titleEl.after(bacaEl);
    }

    controllBuilder(isTop = false) {
        const controllContainer = document.createElement('div');
        controllContainer.className =
            'px-4 py-[0.3em] my-4 flex items-center justify-between';

        const prevButton = document.createElement('button');
        prevButton.className = 'px-4 py-2 border-none border-b border-gray-300';
        prevButton.setAttribute('type', 'button');
        prevButton.textContent = 'Prev';

        const nextButton = document.createElement('button');
        nextButton.className = 'px-4 py-2 border-none border-b border-gray-300';
        nextButton.setAttribute('type', 'button');
        nextButton.textContent = 'Next';

        prevButton.addEventListener('click', function () {
            MainApp.instance.prevChapter();
        });

        nextButton.addEventListener('click', function () {
            MainApp.instance.nextChapter(isTop);
        });

        controllContainer.append(prevButton, nextButton);

        if (isTop) {
            this.render.before(controllContainer);
        } else {
            this.render.after(controllContainer);
        }
    }

    loadingLoadChapterList() {
        const loading = document.createElement('span');
        loading.className = 'inline-block px-4 text-green-500';
        loading.dataset.loadingChapterList = '';

        const komik = MainApp.instance.komik;

        loading.innerHTML = `Load chapters list for <a target="_blank" href="${komik}">${komik}`;

        this.formKomik.append(loading);
    }

    loadingLoadChapterListRemove() {
        const loadings = this.formKomik.querySelectorAll(
            '[data-loading-chapter-list]',
        );
        if (loadings.length > 0) {
            this.formKomik.removeChild(...loadings);
        }
    }

    setFormLoading(isLoading) {
        if (!this.submitButton || !this.urlInput || !this.clearButton) {
            return;
        }

        const btnText = this.submitButton.querySelector('.btn-text');
        const spinner = this.submitButton.querySelector('.spinner');

        if (isLoading) {
            this.urlInput.disabled = true;
            this.submitButton.disabled = true;
            this.clearButton.disabled = true;

            if (btnText) btnText.classList.add('hidden');
            if (spinner) spinner.classList.remove('hidden');
        } else {
            this.urlInput.disabled = false;
            this.submitButton.disabled = false;
            this.clearButton.disabled = false;

            if (btnText) btnText.classList.remove('hidden');
            if (spinner) spinner.classList.add('hidden');
        }
    }

    setChapterSelectLoading(isLoading) {
        if (this.chapterElement) {
            this.chapterElement.disabled = isLoading;
            this.chapterElement.classList.toggle('opacity-50', isLoading);
            this.chapterElement.classList.toggle(
                'cursor-not-allowed',
                isLoading,
            );
        }
    }

    updateSelectedChapter(value) {
        if (this.chapterElement) {
            this.chapterElement.value = value;
        }
        const floatingSelect = document.querySelector(
            '[data-floating-chapter-select]',
        );
        if (floatingSelect) {
            floatingSelect.value = value;
        }
    }

    generateBackToTopButton() {
        const button = document.createElement('button');
        button.className =
            'fixed bottom-8 right-8 w-12 h-12 rounded-full bg-gray-800 text-white opacity-0 pointer-events-none transition-all duration-300 hover:bg-gray-700 flex items-center justify-center text-xl';
        button.innerHTML = '↑';
        button.setAttribute('aria-label', 'Back to top');
        button.dataset.backToTop = '';

        button.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });

        this.rootElement.append(button);
        return button;
    }

    handleScrollForBackToTop() {
        const backToTopBtn = document.querySelector('[data-back-to-top]');
        if (!backToTopBtn) return;

        if (window.scrollY > 300) {
            backToTopBtn.classList.remove('opacity-0', 'pointer-events-none');
            backToTopBtn.classList.add('opacity-100');
            this.showChapterTrigger();
        } else {
            backToTopBtn.classList.add('opacity-0', 'pointer-events-none');
            backToTopBtn.classList.remove('opacity-100');
        }
    }

    generateChapterTrigger() {
        const trigger = document.createElement('button');
        trigger.className =
            'fixed top-4 right-4 px-4 py-2 bg-gray-800 text-white rounded opacity-0 pointer-events-none transition-all duration-300 hover:bg-gray-700 text-sm';
        trigger.innerHTML = '☰ Chapters';
        trigger.setAttribute('aria-label', 'Show chapter selector');
        trigger.dataset.chapterTrigger = '';

        trigger.addEventListener('click', () => {
            this.toggleChapterSelector();
        });

        this.rootElement.append(trigger);
        return trigger;
    }

    generateFloatingChapterSelector() {
        const selector = document.createElement('div');
        selector.className =
            'fixed top-0 left-0 right-0 bg-white border-b border-gray-300 px-4 py-3 flex items-center gap-4 transform -translate-y-full transition-transform duration-300 z-50';
        selector.dataset.floatingSelector = '';

        // Prev button
        const prevButton = document.createElement('button');
        prevButton.className =
            'px-3 py-2 border-b border-gray-300 whitespace-nowrap';
        prevButton.textContent = '← Prev';

        // Chapter dropdown
        const chapterSelect = document.createElement('select');
        chapterSelect.className =
            'px-4 py-2 border-b border-gray-300 flex-1 min-w-0';
        chapterSelect.dataset.floatingChapterSelect = '';

        // Next button
        const nextButton = document.createElement('button');
        nextButton.className =
            'px-3 py-2 border-b border-gray-300 whitespace-nowrap';
        nextButton.textContent = 'Next →';

        // Close button
        const closeButton = document.createElement('button');
        closeButton.className =
            'px-3 py-1 text-gray-500 hover:text-gray-700 text-xl';
        closeButton.textContent = '×';
        closeButton.addEventListener('click', () => {
            this.toggleChapterSelector();
        });

        selector.append(prevButton, chapterSelect, nextButton, closeButton);

        // Event listeners
        prevButton.addEventListener('click', () =>
            MainApp.instance.prevChapter(),
        );
        nextButton.addEventListener('click', () =>
            MainApp.instance.nextChapter(true),
        );
        chapterSelect.addEventListener('change', (e) => {
            MainApp.instance.changeChapter(e.target.value, true);
        });

        this.rootElement.append(selector);
        return selector;
    }

    toggleChapterSelector() {
        const selector = document.querySelector('[data-floating-selector]');
        const trigger = document.querySelector('[data-chapter-trigger]');

        if (!selector || !trigger) return;

        const isHidden = selector.classList.contains('-translate-y-full');

        if (isHidden) {
            selector.classList.remove('-translate-y-full');
            selector.classList.add('translate-y-0');
            trigger.classList.add('opacity-0', 'pointer-events-none');
        } else {
            selector.classList.add('-translate-y-full');
            selector.classList.remove('translate-y-0');
            trigger.classList.remove('opacity-0', 'pointer-events-none');
        }
    }

    showChapterTrigger() {
        const trigger = document.querySelector('[data-chapter-trigger]');
        if (trigger) {
            trigger.classList.remove('opacity-0', 'pointer-events-none');
            trigger.classList.add('opacity-100');
        }
    }

    handleTabKey(e) {
        if (e.key === 'Tab') {
            this.showChapterTrigger();
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

        MainApp.instance.changeKomik(url);
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
        console.error('URL tidak valid:', url);
        return null;
    }
}
