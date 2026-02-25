# React Refactor Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor the Cuma Baca frontend from vanilla JavaScript to React.js with React Router v7 using a gradual migration approach.

**Architecture:** Gradual migration - React pages coexist with vanilla pages during transition. Express serves API routes and static assets. React app built with Vite, proxied to Express backend during development. State managed with Zustand. Data fetching with React 19 Suspense + use().

**Tech Stack:** React 19, React Router v7, Vite, Zustand, Tailwind CSS v4 (PostCSS)

---

## Task 1: Install Dependencies and Setup Vite

**Files:**
- Create: `vite.config.js`
- Create: `index.html` (React entry)
- Create: `src/main.jsx`
- Create: `src/App.jsx`
- Create: `src/styles/globals.css`
- Modify: `package.json`

**Step 1: Install React and Vite dependencies**

```bash
npm install react react-dom react-router zustand
npm install -D @vitejs/plugin-react vite concurrently
```

**Step 2: Create Vite configuration**

```javascript
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist-react',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    proxy: {
      '/komik': {
        target: 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
});
```

**Step 3: Create React HTML entry**

```html
<!-- index.html -->
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="referrer" content="no-referrer" />
    <title>Cuma Baca</title>
  </head>
  <body class="overflow-x-hidden">
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Step 4: Create React entry point**

```jsx
// src/main.jsx
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/globals.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
```

**Step 5: Create root App component**

```jsx
// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router';
import { Reader } from './pages/Reader/Reader';
import { About } from './pages/About/About';
import { Cached } from './pages/Cached/Cached';
import { Secret } from './pages/Secret/Secret';
import { Websites } from './pages/Websites/Websites';
import { Header } from './components/Header/Header';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen overflow-x-hidden bg-white">
        <Header />
        <Routes>
          <Route path="/" element={<Reader />} />
          <Route path="/about" element={<About />} />
          <Route path="/cached" element={<Cached />} />
          <Route path="/secret" element={<Secret />} />
          <Route path="/websites" element={<Websites />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

**Step 6: Create global styles**

```css
/* src/styles/globals.css */
@import '../public/output.css';

/* Additional global styles if needed */
```

**Step 7: Update package.json scripts**

```json
{
  "scripts": {
    "start": "node ./bin/www",
    "dev": "nodemon ./bin/www",
    "dev:react": "concurrently \"npm run dev\" \"npm run dev:vite\"",
    "dev:vite": "vite",
    "build:css": "postcss public/input.css -o public/output.css",
    "build:react": "vite build",
    "build:all": "npm run build:css && npm run build:react"
  }
}
```

**Step 8: Commit**

```bash
git add vite.config.js index.html src/ package.json
git commit -m "feat: setup Vite and React project structure"
```

---

## Task 2: Create Zustand Stores

**Files:**
- Create: `src/stores/readerStore.js`
- Create: `src/stores/nsfwStore.js`

**Step 1: Create reader store**

```javascript
// src/stores/readerStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useReaderStore = create(
  persist(
    (set, get) => ({
      // Current comic state
      komik: null,
      activeChapter: null,

      // Chapter data
      chapters: {
        entities: {},
        ids: []
      },
      chapterData: [],
      chapterTitle: '',

      // Loading states
      isLoadingChapters: false,
      isLoadingData: false,

      // Preload state
      preloadedChapter: null,
      preloadedData: null,

      // Actions
      setKomik: (url) => set({ komik: url }),
      setActiveChapter: (id) => set({ activeChapter: id }),
      setChapters: (chapters) => set({ chapters }),
      setChapterData: (data, title) => set({ chapterData: data, chapterTitle: title }),
      setLoadingChapters: (loading) => set({ isLoadingChapters: loading }),
      setLoadingData: (loading) => set({ isLoadingData: loading }),
      setPreloaded: (chapter, data) => set({ preloadedChapter: chapter, preloadedData: data }),
      clearPreload: () => set({ preloadedChapter: null, preloadedData: null }),

      // Navigation
      nextChapter: () => {
        const { activeChapter, chapters } = get();
        const idx = chapters.ids.indexOf(activeChapter);
        if (idx > 0) set({ activeChapter: chapters.ids[idx - 1] });
      },
      prevChapter: () => {
        const { activeChapter, chapters } = get();
        const idx = chapters.ids.indexOf(activeChapter);
        if (idx < chapters.ids.length - 1) set({ activeChapter: chapters.ids[idx + 1] });
      },
    }),
    {
      name: 'cumabaca-reader',
      partialize: (state) => ({
        komik: state.komik,
        activeChapter: state.activeChapter,
      }),
    }
  )
);
```

**Step 2: Create NSFW store with migration**

```javascript
// src/stores/nsfwStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useNsfwStore = create(
  persist(
    (set) => ({
      nsfwEnabled: false,
      toggle: () => set((state) => ({ nsfwEnabled: !state.nsfwEnabled })),
      setEnabled: (enabled) => set({ nsfwEnabled: enabled }),
    }),
    {
      name: 'cumabaca-nsfw',
      migrate: (state) => {
        // Migrate from old 'secretMode' to 'nsfwEnabled'
        if (state.secretMode !== undefined) {
          return { nsfwEnabled: state.secretMode };
        }
        return state;
      },
    }
  )
);
```

**Step 3: Commit**

```bash
git add src/stores/
git commit -m "feat: add Zustand stores for reader and NSFW state"
```

---

## Task 3: Create API Client and Data Sources

**Files:**
- Create: `src/lib/api.js`
- Create: `src/lib/data-sources.js`

**Step 1: Create API client**

```javascript
// src/lib/api.js
const API_BASE = '/komik';

async function fetchWithError(url, options = {}) {
  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  return response.json();
}

export async function getChapters(comicUrl, mode = 'normal') {
  const params = new URLSearchParams({ url: comicUrl });
  if (mode === 'nsfw') params.append('mode', 'secret');
  return fetchWithError(`${API_BASE}/chapters?${params}`);
}

export async function getChapterData(chapterUrl, mode = 'normal') {
  const params = new URLSearchParams({ url: chapterUrl });
  if (mode === 'nsfw') params.append('mode', 'secret');
  return fetchWithError(`${API_BASE}/data?${params}`);
}

export async function getCachedComics() {
  return fetchWithError(`${API_BASE}/cached-comics`);
}
```

**Step 2: Create data sources for Suspense**

```javascript
// src/lib/data-sources.js
import { getChapters, getChapterData } from './api';

let cache = new Map();

export function fetchChapters(comicUrl, nsfwEnabled) {
  const key = `chapters-${comicUrl}-${nsfwEnabled}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const promise = getChapters(comicUrl, nsfwEnabled ? 'nsfw' : 'normal')
    .then(data => {
      cache.set(key, { data, status: 'success' });
      return data;
    })
    .catch(error => {
      cache.set(key, { error, status: 'error' });
      throw error;
    });

  cache.set(key, { promise, status: 'pending' });
  return promise;
}

export function getChaptersResource(comicUrl, nsfwEnabled) {
  const key = `chapters-${comicUrl}-${nsfwEnabled}`;
  const resource = cache.get(key);

  if (resource?.status === 'success') return resource.data;
  if (resource?.status === 'error') throw resource.error;
  if (resource?.status === 'pending') throw resource.promise;

  return fetchChapters(comicUrl, nsfwEnabled);
}

export function fetchChapterData(chapterUrl, nsfwEnabled) {
  const key = `chapter-${chapterUrl}-${nsfwEnabled}`;

  if (cache.has(key)) {
    return cache.get(key);
  }

  const promise = getChapterData(chapterUrl, nsfwEnabled ? 'nsfw' : 'normal')
    .then(data => {
      cache.set(key, { data, status: 'success' });
      return data;
    })
    .catch(error => {
      cache.set(key, { error, status: 'error' });
      throw error;
    });

  cache.set(key, { promise, status: 'pending' });
  return promise;
}

export function getChapterDataResource(chapterUrl, nsfwEnabled) {
  const key = `chapter-${chapterUrl}-${nsfwEnabled}`;
  const resource = cache.get(key);

  if (resource?.status === 'success') return resource;
  if (resource?.status === 'error') throw resource.error;
  if (resource?.status === 'pending') throw resource.promise;

  return fetchChapterData(chapterUrl, nsfwEnabled);
}

export function clearDataCache() {
  cache.clear();
}
```

**Step 3: Commit**

```bash
git add src/lib/
git commit -m "feat: add API client and Suspense data sources"
```

---

## Task 4: Create Shared Components

**Files:**
- Create: `src/components/Header/Header.jsx`
- Create: `src/components/LoadingSpinner/LoadingSpinner.jsx`
- Create: `src/components/ErrorMessage/ErrorMessage.jsx`
- Create: `src/components/BackToTop/BackToTop.jsx`

**Step 1: Create Header component**

```jsx
// src/components/Header/Header.jsx
import { Link, useLocation } from 'react-router';
import { useNsfwStore } from '@/stores/nsfwStore';

export function Header() {
  const location = useLocation();
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);

  const navItems = [
    { path: '/', label: 'Home' },
    { path: '/about', label: 'Tentang Kami' },
    { path: '/websites', label: 'Website yang Didukung' },
    { path: '/cached', label: 'Ter-Cache' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <header className="px-4 py-4">
      <h1 className="text-4xl m-0 flex items-center gap-3">
        Cuma Baca
        {nsfwEnabled && (
          <span className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded font-medium">
            NSFW
          </span>
        )}
      </h1>
      <nav className="flex gap-6 mt-4">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={
              isActive(item.path)
                ? 'text-gray-800 border-b-2 border-gray-800'
                : 'text-gray-600 hover:text-gray-800 transition-colors'
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
```

**Step 2: Create LoadingSpinner component**

```jsx
// src/components/LoadingSpinner/LoadingSpinner.jsx
export function LoadingSpinner({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="animate-spin w-12 h-12 border-4 border-gray-300 border-t-gray-800 rounded-full mb-4" />
      <p className="text-gray-600">{message}</p>
    </div>
  );
}
```

**Step 3: Create ErrorMessage component**

```jsx
// src/components/ErrorMessage/ErrorMessage.jsx
export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="bg-red-50 border-l-4 border-red-400 p-6 mb-6">
      <h2 className="text-xl font-semibold text-red-800 mb-2">Terjadi Kesalahan</h2>
      <p className="text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 px-4 py-2 bg-red-800 text-white rounded hover:bg-red-700 transition-colors"
        >
          Coba Lagi
        </button>
      )}
    </div>
  );
}
```

**Step 4: Create BackToTop component**

```jsx
// src/components/BackToTop/BackToTop.jsx
import { useState, useEffect } from 'react';

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-8 right-8 w-12 h-12 rounded-full bg-gray-800 text-white flex items-center justify-center text-xl transition-all duration-300 hover:bg-gray-700 ${
        visible ? 'opacity-100' : 'opacity-0 pointer-events-none'
      }`}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
```

**Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add shared components (Header, LoadingSpinner, ErrorMessage, BackToTop)"
```

---

## Task 5: Create Reader Page Hooks

**Files:**
- Create: `src/pages/Reader/hooks/useChapterList.js`
- Create: `src/pages/Reader/hooks/useChapterData.js`
- Create: `src/pages/Reader/hooks/useChapterPreload.js`

**Step 1: Create useChapterList hook**

```javascript
// src/pages/Reader/hooks/useChapterList.js
import { use } from 'react';
import { getChaptersResource } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

export function useChapterList() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const komik = useReaderStore(state => state.komik);
  const setChapters = useReaderStore(state => state.setChapters);

  if (!komik) {
    return { entities: {}, ids: [], isLoading: true };
  }

  try {
    const data = use(getChaptersResource(komik, nsfwEnabled));
    const entities = data.data?.reduce((acc, item) => {
      acc[item.chapter] = item;
      return acc;
    }, {}) || {};
    const ids = data.data?.map(item => item.chapter) || [];

    // Update store with fetched data
    setChapters({ entities, ids });

    return { entities, ids, isLoading: false };
  } catch (promise) {
    return { entities: {}, ids: [], isLoading: true };
  }
}
```

**Step 2: Create useChapterData hook**

```javascript
// src/pages/Reader/hooks/useChapterData.js
import { use } from 'react';
import { getChapterDataResource } from '@/lib/data-sources';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useReaderStore } from '@/stores/readerStore';

export function useChapterData() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const activeChapter = useReaderStore(state => state.activeChapter);
  const chapters = useReaderStore(state => state.chapters.entities);
  const setChapterData = useReaderStore(state => state.setChapterData);

  const chapterUrl = chapters[activeChapter]?.url;

  if (!chapterUrl) {
    return { data: [], title: '', isLoading: true };
  }

  try {
    const resource = use(getChapterDataResource(chapterUrl, nsfwEnabled));
    const data = resource.data?.data || [];
    const title = resource.data?.title || '';

    // Update store with fetched data
    setChapterData(data, title);

    return { data, title, isLoading: false };
  } catch (promise) {
    return { data: [], title: '', isLoading: true };
  }
}
```

**Step 3: Create useChapterPreload hook**

```javascript
// src/pages/Reader/hooks/useChapterPreload.js
import { useEffect, useRef } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { useNsfwStore } from '@/stores/nsfwStore';
import { fetchChapterData } from '@/lib/data-sources';

export function useChapterPreload() {
  const { activeChapter, chapters, chapterData, setPreloaded } = useReaderStore(state => ({
    activeChapter: state.activeChapter,
    chapters: state.chapters,
    chapterData: state.chapterData,
    setPreloaded: state.setPreloaded,
  }));
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const hasPreloadedRef = useRef(false);

  useEffect(() => {
    // Reset preload flag when chapter changes
    hasPreloadedRef.current = false;
  }, [activeChapter]);

  useEffect(() => {
    if (hasPreloadedRef.current) return;

    // Check if all images are loaded
    if (chapterData.length === 0) return;

    // Simple preload trigger - preload next chapter
    const curChapterIndex = chapters.ids.indexOf(activeChapter);
    const nextChapterIndex = curChapterIndex - 1;

    if (nextChapterIndex < 0) return;

    const nextChapter = chapters.ids[nextChapterIndex];
    const nextChapterUrl = chapters.entities[nextChapter]?.url;

    if (!nextChapterUrl) return;

    // Preload next chapter
    fetchChapterData(nextChapterUrl, nsfwEnabled)
      .then((data) => {
        setPreloaded(nextChapter, { data: data.data, title: data.title });
        hasPreloadedRef.current = true;
      })
      .catch((err) => {
        console.log('Preload failed:', err);
      });
  }, [chapterData.length, activeChapter, chapters, nsfwEnabled, setPreloaded]);
}
```

**Step 4: Commit**

```bash
git add src/pages/Reader/hooks/
git commit -m "feat: add Reader page hooks (useChapterList, useChapterData, useChapterPreload)"
```

---

## Task 6: Create Reader Page Components

**Files:**
- Create: `src/pages/Reader/Reader.jsx`
- Create: `src/pages/Reader/components/ChapterForm.jsx`
- Create: `src/pages/Reader/components/ChapterSelector.jsx`
- Create: `src/pages/Reader/components/ChapterContent.jsx`
- Create: `src/pages/Reader/components/NavigationControls.jsx`
- Create: `src/pages/Reader/components/FloatingChapterSelector.jsx`

**Step 1: Create ChapterForm component**

```jsx
// src/pages/Reader/components/ChapterForm.jsx
import { useSearchParams } from 'react-router';
import { useReaderStore } from '@/stores/readerStore';
import { useNsfwStore } from '@/stores/nsfwStore';

function validateAndFormatURL(url) {
  try {
    let parsedUrl = new URL(url);
    let formattedUrl = parsedUrl.origin + parsedUrl.pathname;
    if (formattedUrl.endsWith('/')) {
      formattedUrl = formattedUrl.slice(0, -1);
    }
    return formattedUrl;
  } catch (e) {
    console.error('URL tidak valid:', url);
    return null;
  }
}

export function ChapterForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { komik, setKomik, isLoadingChapters } = useReaderStore();
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const url = validateAndFormatURL(formData.get('url'));
    if (!url) return;

    setKomik(url);
    setSearchParams({ url });
  };

  return (
    <form onSubmit={handleSubmit} className="px-4 py-1 flex items-center flex-wrap gap-2">
      <div className="flex items-center gap-1">
        <label htmlFor="url">URL Komik:</label>
        <input
          type="text"
          name="url"
          placeholder="url komik"
          defaultValue={komik || ''}
          disabled={isLoadingChapters}
          className="w-[250px] px-4 py-2 border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-gray-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        disabled={isLoadingChapters}
        className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        {isLoadingChapters ? 'Loading...' : 'Kirim'}
      </button>
      <button
        type="reset"
        disabled={isLoadingChapters}
        className="px-4 py-2 bg-gray-800 text-white rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700 transition-colors"
      >
        Hapus
      </button>
      {nsfwEnabled && (
        <input type="hidden" name="mode" value="secret" />
      )}
    </form>
  );
}
```

**Step 2: Create ChapterSelector component**

```jsx
// src/pages/Reader/components/ChapterSelector.jsx
import { useReaderStore } from '@/stores/readerStore';
import { useChapterList } from '../hooks/useChapterList';
import { Suspense } from 'react';

function ChapterSelectorInner() {
  const { ids, isLoading } = useChapterList();
  const { activeChapter, setActiveChapter, isLoadingData } = useReaderStore();

  return (
    <div className="px-4 py-1 mt-4 flex items-center gap-2">
      <label htmlFor="chapter">Pilih Bab:</label>
      <select
        id="chapter"
        name="chapter"
        value={activeChapter || ''}
        onChange={(e) => setActiveChapter(e.target.value)}
        disabled={isLoading || isLoadingData}
        className="px-4 py-2 border-b border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:border-gray-500 transition-colors"
      >
        {ids.map(id => (
          <option key={id} value={id}>{id}</option>
        ))}
      </select>
    </div>
  );
}

export function ChapterSelector() {
  return (
    <Suspense fallback={<div className="px-4 py-4">Loading chapters...</div>}>
      <ChapterSelectorInner />
    </Suspense>
  );
}
```

**Step 3: Create ChapterContent component**

```jsx
// src/pages/Reader/components/ChapterContent.jsx
import { useChapterData } from '../hooks/useChapterData';
import { Suspense } from 'react';
import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';
import { ErrorMessage } from '@/components/ErrorMessage/ErrorMessage';

function ChapterContentInner() {
  const { data, title, isLoading } = useChapterData();

  if (isLoading) {
    return <LoadingSpinner message="Loading images..." />;
  }

  return (
    <div id="render" className="flex flex-col items-center mb-16">
      <div className="my-2">
        <h3 className="m-0 text-center text-2xl">{title}</h3>
      </div>
      <div className="flex flex-col items-center">
        {data.map((imgUrl, index) => (
          <img
            key={index}
            src={imgUrl}
            alt={`Page ${index + 1}`}
            className="w-full max-w-[1000px]"
            loading="lazy"
          />
        ))}
      </div>
    </div>
  );
}

export function ChapterContent() {
  return (
    <Suspense fallback={<LoadingSpinner message="Loading chapter..." />}>
      <ChapterContentInner />
    </Suspense>
  );
}
```

**Step 4: Create NavigationControls component**

```jsx
// src/pages/Reader/components/NavigationControls.jsx
import { useReaderStore } from '@/stores/readerStore';

export function NavigationControls({ position = 'top' }) {
  const { nextChapter, prevChapter } = useReaderStore();

  return (
    <div className="px-4 py-1 my-4 flex items-center justify-between">
      <button
        onClick={prevChapter}
        type="button"
        className="px-4 py-2 border-b border-gray-300"
      >
        Prev
      </button>
      <button
        onClick={nextChapter}
        type="button"
        className="px-4 py-2 border-b border-gray-300"
      >
        Next
      </button>
    </div>
  );
}
```

**Step 5: Create FloatingChapterSelector component**

```jsx
// src/pages/Reader/components/FloatingChapterSelector.jsx
import { useState, useEffect } from 'react';
import { useReaderStore } from '@/stores/readerStore';
import { useChapterList } from '../hooks/useChapterList';

export function FloatingChapterSelector() {
  const [visible, setVisible] = useState(false);
  const [showTrigger, setShowTrigger] = useState(false);
  const { ids, activeChapter, setActiveChapter, nextChapter, prevChapter } = useReaderStore();

  useEffect(() => {
    const handleScroll = () => {
      const shouldShow = window.scrollY > 300;
      setShowTrigger(shouldShow);
      if (!visible) return;
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [visible]);

  const toggle = () => {
    setVisible(v => !v);
    setShowTrigger(false);
  };

  return (
    <>
      {showTrigger && !visible && (
        <button
          onClick={toggle}
          className="fixed top-4 right-4 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
          aria-label="Show chapter selector"
        >
          Chapters
        </button>
      )}
      {visible && (
        <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-300 px-4 py-3 flex items-center gap-4 z-50">
          <button onClick={prevChapter} className="px-3 py-2 border-b border-gray-300 whitespace-nowrap">
            Prev
          </button>
          <select
            value={activeChapter || ''}
            onChange={(e) => setActiveChapter(e.target.value)}
            className="px-4 py-2 border-b border-gray-300 flex-1 min-w-0"
          >
            {ids.map(id => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
          <button onClick={nextChapter} className="px-3 py-2 border-b border-gray-300 whitespace-nowrap">
            Next
          </button>
          <button onClick={toggle} className="px-3 py-1 text-gray-500 hover:text-gray-700 text-xl">
            ×
          </button>
        </div>
      )}
    </>
  );
}
```

**Step 6: Create Reader page**

```jsx
// src/pages/Reader/Reader.jsx
import { Suspense, useEffect } from 'react';
import { useSearchParams } from 'react-router';
import { useReaderStore } from '@/stores/readerStore';
import { ChapterForm } from './components/ChapterForm';
import { ChapterSelector } from './components/ChapterSelector';
import { ChapterContent } from './components/ChapterContent';
import { NavigationControls } from './components/NavigationControls';
import { BackToTop } from '@/components/BackToTop/BackToTop';
import { FloatingChapterSelector } from './components/FloatingChapterSelector';
import { useChapterPreload } from './hooks/useChapterPreload';

function ReaderContent() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { komik, setKomik, activeChapter } = useReaderStore();

  // Sync URL -> store on mount
  useEffect(() => {
    const urlFromQuery = searchParams.get('url');
    if (urlFromQuery && urlFromQuery !== komik) {
      setKomik(urlFromQuery);
    }
  }, [searchParams, komik, setKomik]);

  // Enable preloading
  useChapterPreload();

  return (
    <>
      <ChapterForm />
      {komik && <ChapterSelector />}
      <NavigationControls position="top" />
      {activeChapter && <ChapterContent />}
      <NavigationControls position="bottom" />
      <BackToTop />
      <FloatingChapterSelector />
    </>
  );
}

export function Reader() {
  return (
    <Suspense fallback={<div className="px-4 py-8">Loading...</div>}>
      <ReaderContent />
    </Suspense>
  );
}
```

**Step 7: Commit**

```bash
git add src/pages/Reader/
git commit -m "feat: add Reader page with all components"
```

---

## Task 7: Create Cached Page

**Files:**
- Create: `src/pages/Cached/Cached.jsx`
- Create: `src/pages/Cached/components/ComicCard.jsx`
- Create: `src/pages/Cached/hooks/useCachedComics.js`

**Step 1: Create useCachedComics hook**

```javascript
// src/pages/Cached/hooks/useCachedComics.js
import { use } from 'react';
import { getCachedComics } from '@/lib/api';

let cache = new Map();

export function useCachedComics() {
  const key = 'cached-comics';

  if (cache.has(key)) {
    const resource = cache.get(key);
    if (resource.status === 'success') return resource.data;
    if (resource.status === 'error') throw resource.error;
    if (resource.status === 'pending') throw resource.promise;
  }

  const promise = getCachedComics()
    .then(data => {
      cache.set(key, { data, status: 'success' });
      return data;
    })
    .catch(error => {
      cache.set(key, { error, status: 'error' });
      throw error;
    });

  cache.set(key, { promise, status: 'pending' });
  throw promise;
}
```

**Step 2: Create ComicCard component**

```jsx
// src/pages/Cached/components/ComicCard.jsx
import { Link } from 'react-router';

function getDomainBadgeColor(hostname) {
  if (hostname.includes('komiku')) return 'bg-blue-100 text-blue-800';
  if (hostname.includes('komikcast')) return 'bg-green-100 text-green-800';
  if (hostname.includes('sektedoujin')) return 'bg-purple-100 text-purple-800';
  return 'bg-gray-100 text-gray-800';
}

function getDomainDisplayName(hostname) {
  if (hostname.includes('komiku')) return 'komiku.org';
  if (hostname.includes('komikcast')) return 'komikcast.fit';
  if (hostname.includes('sektedoujin')) return 'sektedoujin.cc';
  return hostname;
}

function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffSec < 60) return 'Baru saja';
  if (diffMin < 60) return `${diffMin} menit lalu`;
  if (diffHour < 24) return `${diffHour} jam lalu`;
  if (diffDay === 1) return 'Kemarin';
  if (diffDay < 7) return `${diffDay} hari lalu`;
  const weeks = Math.floor(diffDay / 7);
  if (weeks < 4) return `${weeks} minggu lalu`;
  const months = Math.floor(diffDay / 30);
  return `${months} bulan lalu`;
}

export function ComicCard({ comic }) {
  const badgeColor = getDomainBadgeColor(comic.domain);
  const domainName = getDomainDisplayName(comic.domain);
  const relativeTime = formatRelativeTime(comic.cachedAt);

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow flex flex-col">
      <div className="flex items-start justify-between mb-4">
        <span className={`${badgeColor} text-xs font-medium px-2.5 py-0.5 rounded`}>
          {domainName}
        </span>
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
        {comic.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4 truncate" title={comic.url}>
        {comic.url}
      </p>
      <p className="text-sm text-gray-600 mb-4">
        Di-cache {relativeTime}
      </p>
      <div className="flex-grow" />
      <Link
        to={`/`}
        search={`url=${encodeURIComponent(comic.url)}`}
        className="w-full inline-block text-center px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
      >
        Baca
      </Link>
    </div>
  );
}
```

**Step 3: Create Cached page**

```jsx
// src/pages/Cached/Cached.jsx
import { Suspense } from 'react';
import { useNsfwStore } from '@/stores/nsfwStore';
import { useCachedComics } from './hooks/useCachedComics';
import { ComicCard } from './components/ComicCard';
import { LoadingSpinner } from '@/components/LoadingSpinner/LoadingSpinner';

function CachedContent() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);
  const comics = useCachedComics();

  const visibleComics = comics.filter(comic =>
    !comic.isNsfw || nsfwEnabled
  );

  if (comics.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="text-6xl mb-4">📚</div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">
          Belum ada komik yang di-cache
        </h2>
        <p className="text-gray-600">
          Baca komik pertama Anda untuk melihatnya muncul di sini.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {visibleComics.map(comic => (
        <ComicCard key={comic.url} comic={comic} />
      ))}
    </div>
  );
}

export function Cached() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-2">Komik Ter-Cache</h1>
      <p className="text-gray-600 mb-8">
        Daftar komik yang sudah di-scrape dan tersimpan di cache.
      </p>
      <Suspense fallback={<LoadingSpinner message="Memuat daftar komik ter-cache..." />}>
        <CachedContent />
      </Suspense>
    </div>
  );
}
```

**Step 4: Commit**

```bash
git add src/pages/Cached/
git commit -m "feat: add Cached page with NSFW filtering"
```

---

## Task 8: Create Secret Page

**Files:**
- Create: `src/pages/Secret/Secret.jsx`
- Create: `src/pages/Secret/components/NsfwToggle.jsx`

**Step 1: Create NsfwToggle component**

```jsx
// src/pages/Secret/components/NsfwToggle.jsx
import { useNsfwStore } from '@/stores/nsfwStore';
import { useState } from 'react';

export function NsfwToggle() {
  const { nsfwEnabled, toggle } = useNsfwStore();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleChange = () => {
    toggle();
    setShowConfirm(true);
    setTimeout(() => setShowConfirm(false), 3000);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-xl font-semibold mb-2">Aktifkan Konten NSFW</h3>
          <p className="text-gray-600 text-sm">
            Tampilkan website dan komik yang mengandung konten dewasa.
          </p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={nsfwEnabled}
            onChange={handleChange}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-gray-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-800" />
        </label>
      </div>

      {!nsfwEnabled && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mt-4">
          <p className="text-yellow-800 text-sm">
            <strong>Peringatan:</strong> Konten NSFW hanya boleh diakses
            oleh pengguna yang telah cukup umur sesuai dengan peraturan
            setempat.
          </p>
        </div>
      )}

      {showConfirm && nsfwEnabled && (
        <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
          <p className="text-green-800 text-sm">
            Pengaturan telah disimpan. Konten NSFW akan ditampilkan.
          </p>
        </div>
      )}

      {showConfirm && !nsfwEnabled && (
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mt-4">
          <p className="text-blue-800 text-sm">
            Mode NSFW dinonaktifkan. Konten sensitif akan disembunyikan.
          </p>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Create Secret page**

```jsx
// src/pages/Secret/Secret.jsx
import { Link } from 'react-router';
import { NsfwToggle } from './components/NsfwToggle';

export function Secret() {
  return (
    <div className="settings-page max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-8">Mode Konten NSFW</h1>

      <section className="mb-12">
        <NsfwToggle />
      </section>

      <section className="mb-12">
        <h3 className="text-xl font-semibold mb-4">Website dengan Konten NSFW</h3>
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
          <ul className="space-y-2 text-gray-700">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-purple-500 rounded-full" />
              <strong>Sektedoujin</strong>
              <span className="text-gray-500 text-sm">(sektedoujin.cc)</span>
            </li>
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            Website ini ditandai sebagai NSFW dan hanya akan muncul di daftar
            Website yang Didukung jika mode NSFW diaktifkan.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <Link
          to="/"
          className="inline-block px-6 py-3 bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Kembali ke Beranda
        </Link>
      </section>

      <section className="mb-12">
        <div className="bg-gray-50 border-l-4 border-gray-400 p-4 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Privasi:</strong> Pengaturan NSFW disimpan secara lokal di
            browser Anda menggunakan localStorage. Tidak ada data yang dikirim
            ke server.
          </p>
          <p>
            <strong>Persistence:</strong> Pengaturan akan tetap ada meskipun Anda
            menutup browser atau me-refresh halaman.
          </p>
        </div>
      </section>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/pages/Secret/
git commit -m "feat: add Secret/NSFW settings page"
```

---

## Task 9: Create Websites and About Pages

**Files:**
- Create: `src/pages/Websites/Websites.jsx`
- Create: `src/pages/About/About.jsx`

**Step 1: Create Websites page**

```jsx
// src/pages/Websites/Websites.jsx
import { useNsfwStore } from '@/stores/nsfwStore';

const websites = [
  {
    name: 'Komiku',
    baseUrl: 'https://komiku.org',
    domains: 'komiku.org, komiku.id',
    language: 'Indonesia',
    method: 'HTTP Scraping',
    isNsfw: false,
  },
  {
    name: 'Komikcast',
    baseUrl: 'https://v1.komikcast.fit',
    domains: 'v1.komikcast.fit',
    language: 'Indonesia',
    method: 'Browser Rendering (Playwright)',
    isNsfw: false,
  },
  {
    name: 'Sektedoujin',
    baseUrl: 'https://sektedoujin.cc',
    domains: 'sektedoujin.cc',
    language: 'Indonesia',
    method: 'Browser Rendering (Puppeteer)',
    isNsfw: true,
  },
];

export function Websites() {
  const nsfwEnabled = useNsfwStore(state => state.nsfwEnabled);

  const visibleWebsites = websites.filter(w => !w.isNsfw || nsfwEnabled);

  return (
    <div className="about-page max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-4">Website yang Didukung</h1>
      <p className="text-gray-600 mb-8">
        Berikut adalah daftar website komik yang saat ini didukung
        oleh Cuma Baca:
      </p>

      <section className="mb-12">
        {visibleWebsites.map(site => (
          <div
            key={site.name}
            className="bg-white border border-gray-200 rounded-lg p-6 mb-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h2 className="text-2xl font-semibold">{site.name}</h2>
              <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                Aktif
              </span>
            </div>
            <div className="space-y-2 text-gray-700">
              <p>
                <strong>Base URL:</strong>{' '}
                <a
                  href={site.baseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {site.baseUrl.replace('https://', '')}
                </a>
              </p>
              <p><strong>Domain:</strong> {site.domains}</p>
              <p><strong>Bahasa:</strong> {site.language}</p>
              <p><strong>Metode:</strong> {site.method}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Cara Menggunakan</h2>
        <ol className="list-decimal list-inside space-y-3 text-gray-700">
          <li>Kunjungi salah satu website yang didukung di atas</li>
          <li>Cari komik yang ingin Anda baca</li>
          <li>Salin URL halaman komik tersebut</li>
          <li>Kembali ke Cuma Baca dan tempel URL ke formulir</li>
          <li>Klik "Kirim" dan nikmati membaca tanpa gangguan!</li>
        </ol>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Catatan Penting</h2>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 text-gray-700 text-sm leading-relaxed">
          <p className="mb-2">
            <strong>Ketersediaan:</strong> Website yang didukung
            dapat berubah sewaktu-waktu tergantung ketersediaan
            dan kebijakan dari website sumber.
          </p>
          <p>
            <strong>Request Website Baru:</strong> Jika Anda
            ingin kami menambahkan website lain, silakan hubungi
            kami atau buat issue di repository GitHub kami.
          </p>
        </div>
      </section>
    </div>
  );
}
```

**Step 2: Create About page**

```jsx
// src/pages/About/About.jsx
export function About() {
  return (
    <div className="about-page max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold mb-8">Tentang Cuma Baca</h1>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Ruang Baca yang Jujur
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Cuma Baca adalah proyek sederhana yang lahir dari
          keinginan untuk membaca komik tanpa gangguan. Kami
          menyadari bahwa terkadang, mencari bab terbaru di
          internet bisa sangat melelahkan karena banyaknya iklan
          dan navigasi yang rumit. Di sini, kami membuang itu
          semua.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Bagaimana Kami Bekerja
        </h2>
        <p className="text-gray-700 leading-relaxed">
          Situs ini beroperasi secara otomatis. Kami menggunakan
          alat khusus untuk mengumpulkan konten yang tersedia
          secara publik di internet dan menyajikannya kembali
          dalam antarmuka yang bersih dan minimalis.
        </p>
        <p className="text-gray-700 leading-relaxed mt-4">
          Kami tidak menyimpan file di server kami sendiri; kami
          menggunakan sistem hotlinking untuk memastikan beban
          server tetap ringan dan akses tetap cepat bagi kamu.
          Fokus kami hanya satu: Memberikan pengalaman membaca
          yang paling nyaman.
        </p>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Disclaimer & Hak Cipta
        </h2>
        <p className="text-gray-700 leading-relaxed mb-4">
          Transparansi adalah prioritas kami. Perlu diketahui
          bahwa:
        </p>
        <div className="bg-gray-100 border-l-4 border-gray-400 p-4 text-gray-600 text-sm leading-relaxed">
          <p className="mb-2">
            <strong>Disclaimer:</strong> Semua konten (gambar
            dan teks) di situs ini dikumpulkan dari sumber
            publik yang tersedia secara bebas di internet
            melalui alat otomatis. Kami tidak menyimpan file di
            server kami sendiri dan tidak memiliki hak cipta
            atas karya tersebut. Hak cipta sepenuhnya milik
            pengarang, artis, dan penerbit masing-masing.
          </p>
          <p>
            Kami sangat menghargai kerja keras para kreator.
            Jika Anda adalah pemilik sah dari konten yang
            ditampilkan di sini dan ingin konten tersebut
            dihapus atau memiliki keberatan lainnya, silakan
            hubungi kami. Kami akan segera menindaklanjuti
            permintaan Anda.
          </p>
        </div>
      </section>

      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Mengapa Tanpa Iklan?
        </h2>
        <p className="text-gray-700 leading-relaxed mb-6">
          Karena kami juga pembaca. Kami percaya bahwa karya seni
          dan cerita yang bagus layak dinikmati tanpa interupsi
          pop-up atau spanduk yang mengganggu pandangan. Situs ini
          adalah bentuk apresiasi kami terhadap dunia komik.
        </p>
        <blockquote className="border-l-4 border-gray-800 pl-4 italic text-gray-600">
          "Karena setiap garis dan dialog dalam komik layak
          mendapatkan perhatian penuh tanpa gangguan."
        </blockquote>
      </section>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/pages/Websites/ src/pages/About/
git commit -m "feat: add Websites and About pages"
```

---

## Task 10: Update Express for React Build

**Files:**
- Modify: `app.js`

**Step 1: Add React build serving to Express**

```javascript
// Add to app.js after existing routes
import path from 'path';

// Serve React static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use('/react/assets', express.static(path.join(__dirname, 'dist-react/assets')));

  // Serve React app for migrated routes (Phase 2+)
  // For now, we only serve the root path with React
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });

  // Fallback for React routes (serves index.html for SPA routing)
  app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });
  app.get('/cached', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });
  app.get('/secret', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });
  app.get('/websites', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist-react/index.html'));
  });
}
```

**Step 2: Build React app**

```bash
npm run build:react
```

**Step 3: Commit**

```bash
git add app.js dist-react/
git commit -m "feat: serve React build from Express"
```

---

## Task 11: Clean Up Vanilla Files

**Files:**
- Delete: `public/index.html`
- Delete: `public/about.html`
- Delete: `public/cached.html`
- Delete: `public/secret.html`
- Delete: `public/websites.html`
- Delete: `public/assets/main.js`
- Delete: `public/assets/ui.js`
- Delete: `public/assets/cached.js`
- Delete: `public/assets/secret.js`

**Step 1: Remove old HTML and JS files**

```bash
rm public/index.html public/about.html public/cached.html public/secret.html public/websites.html
rm public/assets/main.js public/assets/ui.js public/assets/cached.js public/assets/secret.js
```

**Step 2: Commit**

```bash
git add -A
git commit -m "chore: remove vanilla JS files after React migration"
```

---

## Task 12: Final Testing

**Step 1: Start development servers**

```bash
npm run dev:react
```

**Step 2: Test all functionality**

- [ ] Navigate to `/` - Reader page loads
- [ ] Enter comic URL, click submit - Chapters load
- [ ] Select chapter - Images display
- [ ] Click Next/Prev - Navigation works
- [ ] Scroll down - Back to top button appears
- [ ] Scroll down - Floating chapter selector appears
- [ ] Navigate to `/cached` - Cached comics display
- [ ] Navigate to `/secret` - Toggle NSFW, badge appears
- [ ] Navigate to `/websites` - Websites list displays (NSFW filtered)
- [ ] Navigate to `/about` - About page displays
- [ ] Share URL with `?url=xxx` - Works on load

**Step 3: Build for production and test**

```bash
NODE_ENV=production npm run build:all
npm start
```

**Step 4: Final commit**

```bash
git commit --allow-empty -m "feat: React refactor complete - all tests passing"
```

---

## Summary

This implementation plan follows the gradual migration approach:

1. **Setup**: Install dependencies, configure Vite
2. **State**: Create Zustand stores
3. **Data**: Build API client and Suspense data sources
4. **Components**: Create shared components
5. **Reader**: Build full Reader page with hooks
6. **Pages**: Build Cached, Secret, Websites, About pages
7. **Backend**: Update Express to serve React build
8. **Cleanup**: Remove vanilla files
9. **Test**: Full end-to-end testing

Each task is bite-sized and commit-ready.
