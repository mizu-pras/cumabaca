# React Refactor Design Document

**Date:** 2025-02-25
**Status:** Approved
**Approach:** Gradual Migration (Approach 1)

## Overview

Refactor the Cuma Baca frontend from vanilla JavaScript to React.js with React Router v7. The migration will be gradual, allowing existing vanilla pages to coexist with React pages during the transition period.

## Motivation

- **Modern SPA Experience:** True single-page app with smooth client-side transitions
- **Better Developer Experience:** Component-based architecture with hooks
- **Maintainability:** Easier to reason about state and data flow

## Architecture

### Hybrid State During Migration

```
Express Server
├── API Routes (unchanged)
│   ├── GET  /komik/chapters
│   ├── GET  /komik/data
│   ├── GET  /komik/image
│   ├── GET  /komik/cached-comics
│   └── DELETE /komik/cache
├── Static Assets (existing)
│   └── /output.css, /assets/*.js
└── React Build (new)
    └── /react/assets/* (migrated pages)
```

### Migration Order

| Phase | Route | Notes |
|-------|-------|-------|
| 1 | `/` (Home/Reader) | Most complex, core feature |
| 2 | `/cached.html` → `/cached` | Shares state with home |
| 3 | `/secret.html` → `/secret` | Settings page |
| 4 | `/websites.html` → `/websites` | Static content |
| 5 | `/about.html` → `/about` | Pure static |

## Project Structure

```
src/
├── main.jsx                    # React entry point
├── App.jsx                     # Root + Router
├── pages/                      # Route pages
│   ├── Reader/                 # Reader page + components
│   ├── Cached/                 # Cached page
│   ├── Secret/                 # NSFW settings
│   ├── Websites/               # Supported websites
│   └── About/                  # About page
├── components/                 # Shared components
│   ├── Header/
│   ├── BackToTop/
│   ├── LoadingSpinner/
│   └── ErrorMessage/
├── stores/                     # Zustand stores
│   ├── readerStore.js
│   ├── nsfwStore.js
│   └── cacheStore.js
├── hooks/                      # Shared hooks
│   ├── useApi.js
│   ├── useLocalStorage.js
│   └── useScroll.js
├── lib/                        # Utilities
│   ├── api.js
│   ├── url.js
│   └── format.js
└── styles/
    ├── globals.css
    └── variables.css
```

## State Management (Zustand)

### readerStore
```javascript
{
  // Comic state
  komik: null,
  activeChapter: null,

  // Chapter data
  chapters: { entities: {}, ids: [] },
  chapterData: [],
  chapterTitle: '',

  // Loading states
  isLoadingChapters: false,
  isLoadingData: false,

  // Preload state
  preloadedChapter: null,
  preloadedData: null,

  // Actions
  setKomik, setActiveChapter, setChapters,
  setChapterData, setLoadingChapters, setLoadingData,
  setPreloaded, clearPreload,
  nextChapter, prevChapter
}
```

### nsfwStore
```javascript
{
  nsfwEnabled: false,
  toggle(),
  setEnabled(enabled)
}
```

## Routing (React Router v7)

```jsx
<BrowserRouter>
  <Routes>
    <Route path="/" element={<Reader />} />
    <Route path="/about" element={<About />} />
    <Route path="/cached" element={<Cached />} />
    <Route path="/secret" element={<Secret />} />
    <Route path="/websites" element={<Websites />} />
  </Routes>
</BrowserRouter>
```

**URL Parameters:** Reader uses query params (`?url=xxx`) for shareability.

## Data Fetching (Suspense + use())

- React 19's `use()` hook for Suspense
- Custom data sources with promise caching
- Zustand stores hold UI state, not fetch state

## Build Configuration

**Vite:**
- Dev server on port 5173
- Proxy `/komik/*` to Express backend (port 3100)
- Output: `dist-react/`

**Scripts:**
- `npm run dev:react` - Both Express and Vite concurrently
- `npm run build:react` - Build React for production
- `npm run build:all` - Build CSS + React

## Dependencies

```json
{
  "dependencies": {
    "react": "^19.1.0",
    "react-dom": "^19.1.0",
    "react-router": "^7.4.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "concurrently": "^9.1.2",
    "vite": "^6.0.11"
  }
}
```

## Migration Phases

### Phase 1: Setup + Reader
- Install dependencies
- Set up Vite config
- Implement stores
- Build Reader page
- Test all reader functionality

### Phase 2: Cached Page
- Build Cached page
- Test NSFW filtering

### Phase 3: Secret Page
- Build Secret page
- Test localStorage sync

### Phase 4: Websites Page
- Build Websites page
- Test NSFW-aware rendering

### Phase 5: About Page + Cleanup
- Build About page
- Remove vanilla JS files
- Remove old HTML templates

## Testing Checklist

- [ ] Reader: Load comic, fetch chapters, select chapter, display images
- [ ] Navigation: Prev/Next buttons, chapter dropdown
- [ ] Preloading: Next chapter loads, indicator shows
- [ ] Scroll: Back-to-top, floating selector
- [ ] NSFW Mode: Toggle persists, filter updates, badge shows
- [ ] URL Sync: `?url=xxx` params work
- [ ] Cache: Cached page displays correctly
- [ ] Mobile: Responsive design
- [ ] Fallback: Error states, retry buttons
