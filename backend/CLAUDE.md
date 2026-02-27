# Cuma Baca - Backend Workspace

This is the backend workspace for Cuma Baca, a minimalist comic scraper API.

## Overview

Express.js REST API that scrapes comic content from multiple websites (komiku.org, komikcast.fit, sektedoujin.cc) and provides a clean API with caching support.

## Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Persistent cache storage
- **Cheerio** - HTML parsing
- **Puppeteer** - Headless browser for JS-rendered content
- **Axios** - HTTP client

## Development Commands

**Note:** MongoDB must be running before starting the backend. Use `pnpm run dev:backend` from root (includes MongoDB via podman-compose).

```bash
# Development with hot-reload (runs on port 3100)
pnpm run dev

# Production mode
pnpm run start

# Test scraper functionality
node test-scraper.js
```

## Environment Variables

Create a `.env` file in the `backend/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3100` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cumabaca` |
| `CACHE_TTL` | Cache TTL in seconds | `86400` (24 hours) |
| `CORS_ORIGIN` | CORS allowed origins (comma-separated) | `http://localhost:5173` |

## API Endpoints

### Comic Scraping

- **`GET /komik/chapters?url=<comic-url>`** - Get chapter list for a comic
- **`GET /komik/data?url=<chapter-url>`** - Get images for a specific chapter
- **`GET /komik/image?url=<image-url>`** - Image proxy (bypasses CORS/hotlink protection)

### Cache Management

- **`GET /komik/cache/stats`** - View cache statistics
- **`DELETE /komik/cache?key=<key>`** - Delete specific cache entry
- **`DELETE /komik/cache`** - Clear all cache entries

### Admin API

All admin routes are prefixed with `/admin`.

#### Authentication

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/admin/auth/login` | POST | Login with `{username, password}` → sets httpOnly `admin_token` cookie |
| `/admin/auth/logout` | POST | Clears `admin_token` cookie |
| `/admin/auth/me` | GET | Returns current admin user (requires valid token) |

**Auth:** JWT via httpOnly cookie (`admin_token`)
**Middleware:** `middleware/auth.js` → `requireAuth()`

#### Management Routes (authenticated)

| Resource | Endpoints |
|----------|-----------|
| **Languages** | `GET /admin/languages`, `GET /admin/languages/:id`, `POST /admin/languages`, `PUT /admin/languages/:id`, `DELETE /admin/languages/:id` |
| **Websites** | `GET /admin/websites`, `GET /admin/websites/:id`, `POST /admin/websites`, `PUT /admin/websites/:id`, `DELETE /admin/websites/:id` |
| **Komiks** | `GET /admin/komiks`, `GET /admin/komiks/:id`, `POST /admin/komiks`, `PUT /admin/komiks/:id`, `DELETE /admin/komiks/:id` |
| **Komik-Websites** | `GET /admin/komik-websites`, `GET /admin/komik-websites/:id`, `POST /admin/komik-websites`, `PUT /admin/komik-websites/:id`, `DELETE /admin/komik-websites/:id` |

**Environment Variables:**
| Variable | Description | Default |
|----------|-------------|---------|
| `JWT_SECRET` | Secret for signing JWT tokens | `change-this-secret-in-production` |
| `ADMIN_JWT_EXPIRY` | Token expiry time | `24h` |

## Project Structure

```
backend/
├── app.js                     # Express app configuration
├── bin/www                    # Server entry point
├── config/
│   ├── database.js            # MongoDB connection with indexes
│   └── websites.js            # Website scraper configuration
├── controllers/
│   ├── komikController.js     # Comic scraping logic
│   ├── cacheController.js     # Cache management
│   ├── imageProxyController.js # Image proxy
│   ├── adminController.js     # Admin auth logic
│   ├── languageController.js  # Languages CRUD
│   ├── websiteController.js   # Websites CRUD
│   └── komikController.js     # Komiks CRUD
├── middleware/
│   ├── auth.js                # JWT auth middleware (requireAuth)
│   └── adminAuth.js           # Admin-specific auth (if exists)
├── models/
│   └── AdminUser.js           # Admin user model with password hashing
├── routes/
│   ├── index.js               # Route index
│   ├── komik.js               # Comic scraping routes
│   ├── admin.js               # Admin auth routes
│   └── admin/                 # Admin CRUD routes (protected)
│       ├── languages.js
│       ├── websites.js
│       ├── komiks.js
│       └── komik-websites.js
├── scrapers/
│   ├── index.js               # Scraper registry/factory
│   ├── komiku.js              # Komiku scraper
│   ├── komikcast.js           # Komikcast scraper
│   └── sektedoujin.js         # Sektedoujin scraper (NSFW)
├── utils/
│   ├── cache.js               # Cache middleware
│   ├── mongodb-cache.js       # MongoDB cache operations
│   ├── test-scraper.js        # Scraper testing utilities
│   ├── asyncHandler.js        # Async error wrapper
│   └── index.js               # Scraping utilities (axios, cheerio, puppeteer)
└── test-scraper.js            # CLI scraper testing tool
```

## Adding a New Scraper

1. Create a scraper class in `scrapers/` (e.g., `foocomic.js`):
   ```javascript
   class FooComicScraper {
     getSelectors() { return { /* CSS selectors */ }; }
     getChapters($, domain) { /* Extract chapter list */ }
     getChapterData($, url) { /* Extract images and title */ }
   }
   ```

2. Add website config to `config/websites.js`:
   ```javascript
   {
     domain: 'foocomic.com',
     baseUrl: 'https://foocomic.com',
     mode: 'http' // or 'browser' for JS-rendered sites
   }
   ```

3. Register in `scrapers/index.js`:
   ```javascript
   const FooComicScraper = require('./foocomic');
   // Add to SCRAPER_MAP
   ```

4. Test with:
   ```bash
   node test-scraper.js https://foocomic.com/manga/some-comic
   ```

## Scraper Testing

Use `backend/utils/test-scraper.js` or CLI tool:

```javascript
const { testScraper, printTestResult, canScrape } = require('./utils/test-scraper');

// Full test
const result = await testScraper('https://komiku.org/manga/one-piece', {
    verbose: true,
    testChapter: true
});
printTestResult(result);

// Quick check
const works = await canScrape('https://komiku.org/manga/one-piece');
```

**Test results include:**
- URL validation
- Scraper availability
- Connectivity
- Chapter extraction
- Optional: First chapter data/images

## Important Constraints

- **NO Cloudflare sites** - Headless browsers are detected
- **NSFW websites** - Require `mode=secret` parameter
- **Image proxy** - Some sources require `/komik/image` proxy for hotlink bypass

## Cache Architecture

- MongoDB-based persistent cache
- 1-day TTL (configurable via `CACHE_TTL`)
- Survives server restarts
- First scrape: ~5-10s, subsequent: <50ms
