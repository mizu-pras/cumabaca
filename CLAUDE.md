# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cuma Baca (meaning "Just Read") is a minimalist comic scraper that fetches content from multiple comic websites (komiku.org, komikcast.fit, sektedoujin.cc) and provides a clean, distraction-free reading experience. It's a full-stack JavaScript application with no frontend framework dependencies. The site uses a multi-page architecture with separate pages for the comic reader (`/`) and about page (`/about.html`).

## Development Commands

```bash
# Install dependencies
npm install

# Build CSS (Tailwind v4 via PostCSS)
npm run build:css

# Development mode (auto-reload on changes)
npm run dev

# Production mode
npm start
```

## Docker Deployment

The project includes Docker support for containerized deployment.

### Docker Commands

```bash
# Build the image
docker build -t cumabaca .

# Run the container
docker run -d -p 3100:3100 --name cumabaca cumabaca

# Using Docker Compose (recommended)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down
```

### Docker Configuration

**Key files:**

- `Dockerfile` - Multi-stage build with development (hot-reload) and production stages
- `docker-compose.yml` - Production configuration with resource limits
- `docker-compose.dev.yml` - Development configuration with hot-reload volume mounts
- `.dockerignore` - Excludes unnecessary files from build context

**Container details:**

- **Base image:** `node:20-alpine` with Chromium for Puppeteer
- **Port:** 3100 (exposed)
- **User:** Runs as non-root user `appuser` (UID 1001)
- **Health check:** HTTP GET to `/` every 30s (10s timeout, 40s start period)
- **Resource limits:** 1 CPU, 1GB RAM (adjustable in `docker-compose.yml`)

**Volumes:**

- `./logs:/app/logs` - Persistent logs directory

### Docker Development (Hot-Reload)

Development mode supports live reloading without rebuilding the container.

**Prerequisites:**

```bash
# Install podman-compose (Fedora/CentOS/RHEL)
sudo dnf install podman-compose

# Or via pip
pip install podman-compose
```

**Development commands:**

```bash
# Initial setup (first time - builds and starts)
podman-compose -f docker-compose.dev.yml up --build

# Daily development (starts dev container with hot-reload)
podman-compose -f docker-compose.dev.yml up

# View logs
podman-compose -f docker-compose.dev.yml logs -f

# Stop dev container
podman-compose -f docker-compose.dev.yml down
```

**What works with hot-reload:**

| Change Type | Behavior |
|-------------|----------|
| **JS/Route/Scraper changes** | Nodemon auto-restarts instantly |
| **CSS changes** | PostCSS watcher rebuilds output.css automatically |
| **package.json changes** | Rebuild with `--build` flag |
| **Dockerfile changes** | Rebuild with `--build` flag |

**Development stage details:**

- Installs ALL dependencies (including devDependencies like nodemon)
- Runs both CSS watcher and nodemon in parallel
- Volume mounts source code for instant sync
- Preserves node_modules inside container

**Quick reference:**

```bash
# Start development
podman-compose -f docker-compose.dev.yml up

# Start production
podman-compose up -d

# Rebuild when dependencies change
podman-compose -f docker-compose.dev.yml up --build
```

## Architecture

### Backend (Express.js)

The backend is a standard Express.js application with modular scraper architecture and three main API endpoints:

- **`GET /komik/chapters?url=<comic-url>`** - Scrapes and returns chapter list for a comic
- **`GET /komik/data?url=<chapter-url>`** - Scrapes and returns images for a specific chapter
- **`GET /komik/image?url=<image-url>`** - Image proxy to bypass CORS and hotlink protection

**Key files:**

- `app.js` - Express app configuration
- `routes/komik.js` - Comic scraping routes with caching middleware and image proxy
- `scrapers/index.js` - Scraper registry/factory for domain-based scraper selection
- `scrapers/komiku.js` - Komiku scraper implementation
- `scrapers/komikcast.js` - Komikcast scraper implementation
- `scrapers/sektedoujin.js` - Sektedoujin scraper implementation
- `config/websites.js` - Website configuration (domains, base URLs, rendering mode)
- `utils/index.js` - Scraping utilities (axios, cheerio, puppeteer, playwright)
- `utils/cache.js` - Cache middleware using `memory-cache`
- `utils/test-scraper.js` - Scraper testing utilities for validating website scraping

### Scraper Testing

Use `utils/test-scraper.js` to test if a website can be scraped:

```javascript
const { testScraper, printTestResult, canScrape } = require('./utils/test-scraper');

// Full test with detailed output
const result = await testScraper('https://komiku.org/manga/one-piece', {
    verbose: true,      // Show detailed logs
    testChapter: true   // Also test first chapter data extraction
});
printTestResult(result);

// Quick check
const works = await canScrape('https://komiku.org/manga/one-piece');
```

**Test results include:**
- URL validation check
- Scraper availability (domain matching)
- Connectivity (can fetch HTML)
- Chapter extraction (count and data)
- Optional: First chapter data/images extraction

**Use this function when:**
- Adding a new scraper - verify it works before deployment
- Troubleshooting - diagnose why a website isn't working
- Monitoring - periodically check if websites are still accessible

**Caching:** Routes use in-memory caching (1 day TTL) via `memory-cache` to avoid redundant scraping requests.

### Modular Scraper System

Scrapers are organized using a class-based architecture in `scrapers/`:

Each scraper class implements:
- `getSelectors()` - Returns CSS selectors for the target website
- `getChapters($, domain)` - Extracts chapter list from cheerio instance
- `getChapterData($, url)` - Extracts images and title for a chapter

The `scrapers/index.js` acts as a registry that:
1. Maps domains to appropriate scrapers using `config/websites.js`
2. Provides `getScraperForDomain(domain)` for dynamic scraper selection
3. Provides `getWebsiteConfig(domain)` for website configuration

**Adding a new scraper:**
1. Create a new scraper class in `scrapers/` (e.g., `scrapers/foocomic.js`)
2. Add website config to `config/websites.js`
3. Import and register in `scrapers/index.js`

### Frontend (Vanilla JavaScript)

The frontend uses vanilla JavaScript with a singleton pattern. The site is a **multi-page website** (not SPA):

- **`public/assets/main.js`** - MainApp class handles data fetching, state management, and chapter navigation
- **`public/assets/ui.js`** - MainUI class handles DOM manipulation and user interactions
- **`public/index.html`** - Main page (comic reader)
- **`public/about.html`** - About page (static HTML, no JS dependencies)
- **`public/input.css`** - Tailwind CSS v4 imports (compiled to `public/output.css`)

**UI Components:**
- Form submission with loading states (spinner animation, disabled inputs)
- Floating chapter selector with back-to-top button
- Chapter dropdown for navigation
- Prev/Next chapter controls
- Image proxy integration for hotlink-protected sources

**State persistence:** Uses localStorage to remember the current chapter between sessions.

**Secret Mode:** NSFW/Secret mode (`?mode=secret`) persists across navigation and API calls:
- URL parameter is preserved in all navigation links (Home, Tentang Kami, Website yang Didukung)
- Secret mode state is saved to localStorage for persistence across sessions
- API requests automatically include `&mode=secret` when secret mode is active
- Enables access to NSFW websites (e.g., sektedoujin.cc) without 403 errors

### Web Scraping

Scraping utilities in `utils/index.js`:

- `fetchData(url)` - Fetches HTML using axios and loads into Cheerio
- `fetchDataWithBrowser(url)` - Fetches HTML using Puppeteer headless browser for JS-rendered content
- `validateUrl(url)` - Validates URL and extracts domain origin
- `getDomain(url)` - Extracts origin from URL
- `loadCheerio(html)` - Cleans whitespace and loads HTML into Cheerio

**Supported websites:**
- **komiku.org** (previously komiku.id) - Uses simple HTTP scraping
- **v1.komikcast.fit** - Requires headless browser (Puppeteer) + image proxy
- **sektedoujin.cc** - Requires headless browser (Puppeteer) for lazy-loaded images

## Important Context

1. **No test suite** - The project currently has no tests
2. **No authentication** - The app is completely open, no user system
3. **Environment** - Port is configurable via environment variable (defaults to Express standard)
4. **Deployment** - Supports Docker with multi-stage build (development + production stages)
5. **Styling** - Uses Tailwind CSS v4 via PostCSS. Run `npm run build:css` to compile `public/input.css` to `public/output.css`
6. **Image proxy** - Some sources (Komikcast) require hotlink bypass via `/komik/image` proxy
7. **Headless browser** - Playwright and Puppeteer with Chromium are used for sites requiring JavaScript rendering
8. **Hot-reload** - Docker development mode supports instant reload for JS/CSS changes
9. **NO Cloudflare-protected websites** - Do NOT add websites protected by Cloudflare. Headless browsers are easily detected by Cloudflare and the content cannot be scraped. This includes websites that show "Just a moment..." or "Performing security verification..." pages.
