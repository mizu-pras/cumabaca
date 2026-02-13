# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cuma Baca (meaning "Just Read") is a minimalist comic scraper that fetches content from multiple comic websites (komiku.org, komikcast.fit) and provides a clean, distraction-free reading experience. It's a full-stack JavaScript application with no frontend framework dependencies. The site uses a multi-page architecture with separate pages for the comic reader (`/`) and about page (`/about.html`).

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

- `Dockerfile` - Multi-stage build using Playwright base image (includes Chromium for headless browser scraping)
- `docker-compose.yml` - Service configuration with resource limits and volume mounts
- `.dockerignore` - Excludes unnecessary files from build context

**Container details:**

- **Base image:** `mcr.microsoft.com/playwright:v1.58.2-jammy`
- **Port:** 3100 (exposed)
- **User:** Runs as non-root user `appuser` (UID 1001)
- **Health check:** HTTP GET to `/` every 30s (10s timeout, 40s start period)
- **Resource limits:** 1 CPU, 1GB RAM (adjustable in `docker-compose.yml`)

**Volumes:**

- `./logs:/app/logs` - Persistent logs directory

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
- `config/websites.js` - Website configuration (domains, base URLs, rendering mode)
- `utils/index.js` - Scraping utilities (axios, cheerio, playwright)
- `utils/cache.js` - Cache middleware using `memory-cache`

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

### Web Scraping

Scraping utilities in `utils/index.js`:

- `fetchData(url)` - Fetches HTML using axios and loads into Cheerio
- `fetchDataWithBrowser(url)` - Fetches HTML using Playwright headless browser for JS-rendered content
- `validateUrl(url)` - Validates URL and extracts domain origin
- `getDomain(url)` - Extracts origin from URL
- `loadCheerio(html)` - Cleans whitespace and loads HTML into Cheerio

**Supported websites:**
- **komiku.org** (previously komiku.id) - Uses simple HTTP scraping
- **v1.komikcast.fit** - Requires headless browser (Playwright) + image proxy

## Important Context

1. **No test suite** - The project currently has no tests
2. **No authentication** - The app is completely open, no user system
3. **Environment** - Port is configurable via environment variable (defaults to Express standard)
4. **Deployment** - Supports Docker with multi-stage build using Playwright base image
4. **Styling** - Uses Tailwind CSS v4 via PostCSS. Run `npm run build:css` to compile `public/input.css` to `public/output.css`
5. **Image proxy** - Some sources (Komikcast) require hotlink bypass via `/komik/image` proxy
6. **Headless browser** - Playwright (chromium) is used for sites requiring JavaScript rendering
