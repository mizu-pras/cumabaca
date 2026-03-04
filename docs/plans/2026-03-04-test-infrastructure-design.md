# Test Infrastructure Design

**Date:** 2026-03-04
**Status:** Approved

## Overview

Implement comprehensive test coverage across the entire Cuma Baca monorepo. The project currently has zero automated tests.

## Decisions

- **Backend & Scraper:** Jest + Supertest (Node.js, natural fit)
- **Frontend & Admin:** Vitest + @testing-library/react (native Vite integration)
- **E2E:** Playwright (lightweight, multi-browser)
- **Coverage levels:** Unit + Integration + E2E

## Directory Structure

### Backend (Jest + Supertest)

```
backend/
├── jest.config.js
├── __tests__/
│   ├── unit/
│   │   ├── controllers/
│   │   │   ├── komikController.test.js
│   │   │   ├── adminController.test.js
│   │   │   ├── imageProxyController.test.js
│   │   │   └── cacheController.test.js
│   │   ├── middleware/
│   │   │   ├── auth.test.js
│   │   │   └── scraperClient.test.js
│   │   ├── models/
│   │   │   └── AdminUser.test.js
│   │   └── utils/
│   │       ├── mongodb-cache.test.js
│   │       └── asyncHandler.test.js
│   └── integration/
│       ├── komik.routes.test.js
│       ├── admin.auth.routes.test.js
│       └── admin.crud.routes.test.js
```

### Scraper (Jest)

```
scraper/
├── jest.config.js
├── src/__tests__/
│   ├── unit/
│   │   ├── scrapers/
│   │   │   ├── komiku.test.js
│   │   │   ├── komikcast.test.js
│   │   │   ├── sektedoujin.test.js
│   │   │   └── index.test.js
│   │   ├── controllers/
│   │   │   └── scrapeController.test.js
│   │   └── utils/
│   │       ├── fetch.test.js
│   │       └── mongodb-cache.test.js
│   ├── integration/
│   │   └── scrape.routes.test.js
│   └── fixtures/
│       ├── komikcast.chapter.html       (copy from examples/)
│       ├── komikcast.chapter-data.html  (copy from examples/)
│       ├── komiku.chapter.html          (new minimal fixture)
│       ├── komiku.chapter-data.html     (new minimal fixture)
│       ├── sektedoujin.chapter.html     (new minimal fixture)
│       └── sektedoujin.chapter-data.html (new minimal fixture)
```

### Frontend (Vitest + @testing-library/react)

```
frontend/
├── vitest.config.js
├── src/__tests__/
│   ├── stores/
│   │   ├── nsfwStore.test.js
│   │   └── readerStore.test.js
│   ├── hooks/
│   │   ├── useInfiniteChapters.test.js
│   │   ├── useChapterNavigation.test.js
│   │   └── useActiveChapterDetection.test.js
│   └── lib/
│       ├── api.test.js
│       └── data-sources.test.js
```

### Admin (Vitest + @testing-library/react)

```
admin/
├── vitest.config.js
├── src/__tests__/
│   ├── stores/
│   │   └── authStore.test.js
│   ├── lib/
│   │   ├── api.test.js
│   │   └── adminApi.test.js
│   └── components/
│       └── ProtectedRoute.test.jsx
```

### E2E (Playwright)

```
e2e/
├── package.json
├── playwright.config.js
├── tests/
│   ├── reader.spec.js
│   ├── admin-auth.spec.js
│   └── admin-crud.spec.js
└── fixtures/
    └── test-data.js
```

### Root Scripts

```json
{
  "test": "pnpm -r run test",
  "test:backend": "pnpm --filter backend test",
  "test:scraper": "pnpm --filter scraper test",
  "test:frontend": "pnpm --filter frontend test",
  "test:admin": "pnpm --filter admin test",
  "test:e2e": "pnpm --filter e2e test"
}
```

## Test Coverage Plan

### Backend

#### Unit — Controllers

**komikController.js:**
- Missing URL parameter → 400
- Unsupported domain → 400
- Protocol auto-fix (prepends `https://` if missing)
- NSFW gating: config.nsfw && mode !== 'secret' → 403
- Scraper connection error (ECONNREFUSED/ECONNABORTED) → 504
- Empty results from scraper → 404
- Successful response formatting and backward-compat unwrapping

**adminController.js:**
- Login: missing fields → 400, wrong username → 401, wrong password → 401
- Login: success → JWT cookie set (httpOnly, secure flag based on NODE_ENV)
- Logout: clears cookie
- getMe: valid token → user data, expired token → 401, invalid token → 401

**imageProxyController.js:**
- URL validation, proxy request forwarding

**cacheController.js:**
- Cache stats retrieval, cache clearing

#### Unit — Middleware

**auth.js:**
- Missing token → 401
- Expired token → 401 "Token expired"
- Invalid token → 401 "Invalid token"
- Valid token → sets `req.user`, calls `next()`

**scraperClient.js:**
- Health check cycling (healthy/unhealthy states)
- getChapters/getData response wrapping
- Connection error detection (ECONNREFUSED/ECONNABORTED → throws)
- Timeout handling

#### Unit — Models

**AdminUser.js:**
- create: hashes password with bcrypt (SALT_ROUNDS=12)
- findByUsername: found returns user object, not found returns null
- verifyPassword: correct password → true, incorrect → false
- toJSON: strips password_hash field

#### Unit — Utils

**mongodb-cache.js:**
- get: cache hit, cache miss, expired entry
- put: upsert with TTL calculation
- del: deletes specific key
- clear: deletes all entries
- getStats: aggregation pipeline
- getCachedComics: key parsing, URL deduplication, title extraction, domain extraction

**asyncHandler.js:**
- Catches async errors and passes to `next()`
- Successful handlers pass through normally

#### Integration — Routes

- `GET /komik/chapters` — full request lifecycle with mocked scraperClient
- `GET /komik/data` — full request lifecycle
- `POST /admin/auth/login` — auth flow with mocked AdminUser
- `GET /admin/auth/me` — cookie-based auth check
- Admin CRUD routes — basic create/read/update/delete operations

### Scraper

#### Unit — Scrapers (HTML fixture-based)

**komiku.js:**
- `getChapters()`: extracts chapters from `.judulseries` elements, constructs URLs with domain prefix
- `getChapterData()`: extracts title from `#Judul h1`, images from `#Baca_Komik img`
- Edge: malformed HTML with missing selectors → empty array
- Edge: `<a>` tags without `href` → skipped gracefully
- Edge: unicode/special characters in chapter names

**komikcast.js:**
- `getChapters()`: extracts from `a[href*="/chapter/"]` with `.font-semibold` names
- `getChapterData()`: derives title from URL regex, extracts `img[alt^="Page"]` with proxy wrapping
- Edge: empty `.font-semibold` text → skipped
- Edge: images without alt starting with "Page" → filtered out
- Edge: URL not matching title regex → graceful fallback

**sektedoujin.js:**
- `getChapters()`: from `#chapterlist li` with absolute URLs (no domain prepending)
- `getChapterData()`: from `#readerarea img` with `data-src` lazy loading, proxy wrapping
- Edge: `img` with `data-src` but no `src` → uses `data-src`
- Edge: broken/empty `data-src` and `src` → skipped

**index.js:**
- `getScraperForDomain()`: correct scraper for each domain
- `getWebsiteConfig()`: correct config for each domain
- Edge: URL with port number (`komiku.org:443`)
- Edge: subdomain matching (`www.komiku.org`)
- Edge: URL without protocol → regex fallback
- Edge: completely invalid string → throws

#### Unit — Controller

**scrapeController.js:**
- Cache hit → returns cached data immediately
- Cache miss → fetches, caches, returns
- NSFW gating (config.nsfw && mode !== 'secret' → 403)
- Unsupported domain → 400
- Browser vs standard fetch routing based on `config.useBrowser`
- Edge: scraper returns empty chapters array
- Edge: scraper throws mid-parse → no partial cache written
- Edge: cache write fails after successful scrape → still returns data
- Edge: concurrent requests for same URL (race on cache write)

#### Unit — Utils

**fetch.js:**
- `getDomain()`: valid URL → origin, invalid → null
- `loadCheerio()`: removes tabs/newlines/carriage returns
- `validateUrl()`: valid URLs pass, invalid throw
- `fetchData()`: mocked axios → returns Cheerio instance
- `fetchDataWithBrowser()`: mocked Puppeteer → returns Cheerio instance
- Edge: axios timeout
- Edge: HTTP 403/503 from target site
- Edge: empty response body
- Edge: Puppeteer browser crash → error propagated
- Edge: Puppeteer page.goto timeout
- Edge: browser always closes in finally block (even on error)
- Edge: various malformed URL formats (`ftp://`, spaces, unicode)

**mongodb-cache.js:**
- connectDatabase: idempotent (returns early if connected)
- getScraperCache: hit (valid + not expired), miss, expired
- setScraperCache: upsert with TTL calculation
- clearScraperCache: returns deleted count
- getScraperCacheStats: total, active, expired counts

#### Integration

- `POST /scrape/chapters` — full request with mocked fetch + cache
- `POST /scrape/data` — full request with mocked fetch + cache

### Frontend

#### Unit — Stores

**nsfwStore.js:**
- toggle: flips nsfwEnabled
- setEnabled: sets to specific value
- Persistence: saves to localStorage under `cumabaca-nsfw`
- Edge: legacy migration from `secretMode` → `nsfwEnabled`
- Edge: localStorage full (quota exceeded)
- Edge: localStorage disabled (incognito mode)

**readerStore.js:**
- upsertLoadedChapter: adds new, updates existing (no duplicates)
- clearAndLoadChapter: resets loadedChapters, marks target as loading
- Persistence: only saves `komik` and `activeChapter` (not loadedChapters)
- Edge: upsert with duplicate chapter ID → updates not duplicates
- Edge: clearAndLoadChapter while chapters are mid-load
- Edge: rehydration with stale komik/activeChapter

#### Unit — Hooks

**useInfiniteChapters.js:**
- Loads active chapter on mount
- Prevents duplicate loads (deduplication)
- Handles fetch errors → error state set
- getNextChapterId/getPreviousChapterId navigation (inverted array)
- handleSentinelIntersection triggers next chapter load
- Edge: rapid chapter switching → old requests abandoned
- Edge: loading same chapter twice concurrently → deduplicated
- Edge: retryChapter() clears error and reloads
- Edge: comic URL changes mid-load → old requests abandoned
- Edge: network failure during fetch → not stuck in loading
- Edge: getNextChapterId when chapter list fetch fails
- Edge: empty chapter list from API
- Edge: sentinel fires while already loading

**useChapterNavigation.js:**
- nextChapter/prevChapter navigation
- hasNext/hasPrev boundary flags
- Edge: navigation at boundaries → no-op
- Edge: inverted array logic correctness
- Edge: chapter list changes between navigation calls

#### Unit — Lib

**api.js:**
- Builds correct URLs with query params
- Appends `mode=secret` when NSFW enabled
- Throws on non-OK HTTP response
- getCachedComics calls correct endpoint

**data-sources.js:**
- Promise caching: same reference returned for same key
- Failed promise removed from cache → next call creates new
- clearDataCache empties all entries
- NSFW mode mapping (true → 'nsfw', false → 'normal')
- Edge: concurrent calls for same resource → only one fetch fires

### Admin

#### Unit — Stores

**authStore.js:**
- login: success → sets user + isAuthenticated, failure → returns error message
- logout: always clears state (even if API call fails)
- checkAuth: verifies session, sets state accordingly
- Persistence: only `user` and `isAuthenticated`, not `isLoading`
- onRehydrateStorage resets isLoading to false

#### Unit — Lib

**api.js:**
- 401 interceptor redirects to `/login`
- Skips redirect when already on `/login` page
- Skips redirect for `/admin/auth/login` endpoint
- withCredentials: true for cookie handling

**adminApi.js:**
- All CRUD methods (getAll, getById, create, update, delete) call correct endpoints
- getAll passes params correctly
- komiksApi.getWebsites calls correct nested endpoint

#### Unit — Components

**ProtectedRoute.jsx:**
- Shows loading spinner when `isLoading: true`
- Redirects to `/login` when `!isAuthenticated`
- Renders children when `isAuthenticated`
- Calls checkAuth on mount when `!isAuthenticated && !isLoading`

### E2E (Playwright)

**reader.spec.js:**
- Navigate to reader → enter comic URL → chapter list renders → click chapter → images load → scroll triggers next chapter load

**admin-auth.spec.js:**
- Login page → valid credentials → dashboard → logout → redirect to login
- Login with wrong credentials → error message shown

**admin-crud.spec.js:**
- Login → websites list → create website → edit → delete → verify

## Dependencies to Install

### Backend
```
jest supertest @types/jest
```

### Scraper
```
jest @types/jest
```

### Frontend
```
vitest @testing-library/react @testing-library/jest-dom jsdom
```

### Admin
```
vitest @testing-library/react @testing-library/jest-dom jsdom
```

### E2E (new workspace)
```
@playwright/test
```

## Mocking Strategy

### Backend/Scraper (Jest)
- `jest.mock()` for module-level mocks (MongoDB, bcrypt, jwt, axios)
- `jest.fn()` for individual function mocks
- Supertest for HTTP integration tests (no real server needed)

### Frontend/Admin (Vitest)
- `vi.mock()` for modules (zustand stores, API clients)
- `@testing-library/react` `renderHook()` for custom hooks
- `vi.useFakeTimers()` for throttle/timeout testing
- Mock `localStorage`, `window.scrollY`, `window.addEventListener`

### E2E (Playwright)
- Real services running (dev mode or test containers)
- Test data seeded via API calls in fixtures
- No mocking — tests the full stack
