# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cuma Baca (meaning "Just Read") is a minimalist comic scraper that fetches content from multiple comic websites (komiku.org, komikcast.fit, sektedoujin.cc) and provides a clean, distraction-free reading experience. It's a full-stack JavaScript application with no frontend framework dependencies. The site uses a multi-page architecture with separate pages for the comic reader (`/`), about page (`/about.html`), cached comics (`/cached.html`), NSFW settings (`/secret.html`), and supported websites (`/websites.html`).

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update 'tasks/lessons.md' with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests -> then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management
1. Plan First: Write plan to 'tasks/todo.md' with checkable items
2. Verify Plan: Check in before starting implementation
3. Track Progress: Mark items complete as you go
4. Explain Changes: High-level summary at each step
5. Document Results: Add review to 'tasks/todo.md'
6. Capture Lessons: Update 'tasks/lessons.md' after corrections

## Core Principles
- Simplicity First: Make every change as simple as possible. Impact minimal code.
- No Laziness: Find root causes. No temporary fixes. Senior developer standards.
- Minimal Impact: Changes should only touch what's necessary. Avoid introducing bugs.

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

# Test scraper functionality
node test-scraper.js
```

## Docker Deployment

The project includes Docker support for containerized deployment.

### Docker Commands

```bash
# Build the image
docker build -t cumabaca .

# Run the container (requires external MongoDB)
docker run -d -p 3100:3100 --name cumabaca -e MONGODB_URI=mongodb://host.docker.internal:27017/cumabaca cumabaca

# Using Docker Compose (recommended - includes MongoDB)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the container
docker-compose down

# Stop and remove all data (including cache)
docker-compose down -v
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

**Services:**

- `web` - Application container (port 3100)
- `mongodb` - MongoDB 7 for persistent cache (port 27017)

**Volumes:**

- `./logs:/app/logs` - Persistent logs directory
- `mongodb_data` - MongoDB data directory (production)
- `mongodb_data_dev` - MongoDB data directory (development)

**Environment variables:**

- `MONGODB_URI` - MongoDB connection string (default: `mongodb://mongodb:27017/cumabaca`)
- `CACHE_TTL` - Cache TTL in seconds (default: `86400` = 24 hours)

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

# Stop dev container (including MongoDB)
podman-compose -f docker-compose.dev.yml down

# Stop and remove all data (including cache)
podman-compose -f docker-compose.dev.yml down -v
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

## Project Structure

```
cumabaca/
├── app.js                    # Express app configuration and server entry point
├── package.json              # Dependencies and npm scripts
├── postcss.config.js         # PostCSS configuration for Tailwind v4
├── test-scraper.js           # CLI tool for testing scraper functionality
│
├── config/                   # Configuration files
│   ├── database.js          # MongoDB connection management with indexes
│   └── websites.js          # Website configuration (domains, base URLs, rendering mode)
│
├── routes/                   # Express route handlers
│   └── komik.js             # Comic scraping routes with caching middleware
│
├── scrapers/                 # Scraper implementations
│   ├── index.js             # Scraper registry/factory for domain-based selection
│   ├── komiku.js           # Komiku scraper implementation
│   ├── komikcast.js         # Komikcast scraper implementation
│   └── sektedoujin.js       # Sektedoujin scraper implementation (NSFW)
│
├── utils/                    # Utility modules
│   ├── cache.js             # Cache middleware using MongoDB for persistence
│   ├── index.js             # Scraping utilities (axios, cheerio, puppeteer, playwright)
│   ├── mongodb-cache.js     # MongoDB cache operations (get, put, del, clear, getStats)
│   └── test-scraper.js      # Scraper testing utilities for validating website scraping
│
├── public/                   # Static files and frontend
│   ├── index.html           # Main page (comic reader)
│   ├── about.html           # About page (static HTML, no JS dependencies)
│   ├── cached.html          # Cached comics management page
│   ├── secret.html          # NSFW/Secret mode settings page
│   ├── websites.html        # Supported websites listing page
│   ├── input.css            # Tailwind CSS v4 imports (source)
│   ├── output.css           # Compiled CSS (generated, DO NOT edit)
│   └── assets/              # Frontend JavaScript
│       ├── main.js          # MainApp class (data fetching, state, navigation)
│       ├── ui.js            # MainUI class (DOM manipulation, user interactions)
│       ├── cached.js        # CachedApp class (cached comics functionality)
│       └── secret.js        # SecretApp class (NSFW settings functionality)
│
├── examples/                 # Reference HTML files for scraper development
│   ├── komikcast.chapter-data.html
│   ├── komikcast.chapter.html
│   └── toongod.chapter.html
│
├── screenshot/               # Device UI reference images
│   ├── desktop.png
│   ├── mobile.PNG
│   └── tablet.jpg
│
├── logs/                     # Application logs (persistent in Docker)
│
├── Dockerfile                # Multi-stage build (development + production)
├── docker-compose.yml        # Production configuration with resource limits
├── docker-compose.dev.yml    # Development configuration with hot-reload
├── .dockerignore             # Excludes unnecessary files from build context
│
└── CLAUDE.md                 # This file - project documentation and guidance
```

## Architecture

### Backend (Express.js)

The backend is a standard Express.js application with modular scraper architecture and main API endpoints:

**Comic endpoints:**
- **`GET /komik/chapters?url=<comic-url>`** - Scrapes and returns chapter list for a comic
- **`GET /komik/data?url=<chapter-url>`** - Scrapes and returns images for a specific chapter
- **`GET /komik/image?url=<image-url>`** - Image proxy to bypass CORS and hotlink protection
- **`GET /komik/cached-comics`** - Retrieve cached comic data from MongoDB

**Key files:**

- `app.js` - Express app configuration
- `routes/komik.js` - Comic scraping routes with caching middleware and image proxy
- `scrapers/index.js` - Scraper registry/factory for domain-based scraper selection
- `scrapers/komiku.js` - Komiku scraper implementation
- `scrapers/komikcast.js` - Komikcast scraper implementation
- `scrapers/sektedoujin.js` - Sektedoujin scraper implementation
- `config/websites.js` - Website configuration (domains, base URLs, rendering mode)
- `config/database.js` - MongoDB connection management with indexes
- `utils/index.js` - Scraping utilities (axios, cheerio, puppeteer, playwright)
- `utils/cache.js` - Cache middleware using MongoDB for persistence
- `utils/mongodb-cache.js` - MongoDB cache operations (get, put, del, clear, getStats)
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

### CLI Testing Tool

Root directory contains `test-scraper.js` for quick CLI testing:

```bash
# Test a specific URL
node test-scraper.js https://komiku.org/manga/one-piece

# View detailed output
node test-scraper.js https://komiku.org/manga/one-piece --verbose
```


**Caching:** Routes use MongoDB for persistent caching (1 day TTL) to avoid redundant scraping requests. Cache persists across server restarts.

**Cache Admin Endpoints:**

```bash
# View cache statistics
curl "http://localhost:3100/komik/cache/stats"

# Clear all cache entries
curl -X DELETE "http://localhost:3100/komik/cache"

# Delete specific cache entry
curl -X DELETE "http://localhost:3100/komik/cache?key=__express__/komik/chapters?url=https://..."
```

**Cache Stats Response:**
```json
{
  "totalEntries": 42,
  "expiredEntries": 0,
  "totalSize": 125000,
  "avgSize": 2976
}
```

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
4. Test with `node test-scraper.js` or `utils/test-scraper.js`

### Examples Directory

The `examples/` directory contains reference HTML files for scraper development:

- **`examples/komikcast.chapter-data.html`** - Reference for chapter data extraction
- **`examples/komikcast.chapter.html`** - Reference for chapter page structure
- **`examples/toongod.chapter.html`** - Reference for alternative website structure

Use these examples when:
- Adding new scrapers - understand HTML structure patterns
- Debugging selectors - compare against working examples
- Learning scraping patterns - reference implementations

### Screenshot Directory

The `screenshot/` directory contains device UI reference images:

- **`screenshot/desktop.png`** - Desktop view reference
- **`screenshot/mobile.PNG`** - Mobile view reference
- **`screenshot/tablet.jpg`** - Tablet view reference

### Frontend (Vanilla JavaScript)

The frontend uses vanilla JavaScript with a singleton pattern. The site is a **multi-page website** (not SPA):

**Core pages:**
- **`public/index.html`** - Main page (comic reader)
- **`public/about.html`** - About page (static HTML, no JS dependencies)

**Management pages:**
- **`public/cached.html`** - Cached comics management page with relative time display
- **`public/secret.html`** - NSFW/Secret mode settings page with persistent toggle
- **`public/websites.html`** - Supported websites listing page

**JavaScript files:**
- **`public/assets/main.js`** - MainApp class handles data fetching, state management, and chapter navigation
- **`public/assets/ui.js`** - MainUI class handles DOM manipulation and user interactions
- **`public/assets/cached.js`** - CachedApp class manages cached comics functionality
- **`public/assets/secret.js`** - SecretApp class handles NSFW settings and preferences
- **`public/input.css`** - Tailwind CSS v4 imports (compiled to `public/output.css`)

**UI Components:**
- Form submission with loading states (spinner animation, disabled inputs)
- Floating chapter selector with back-to-top button
- Chapter dropdown for navigation
- Prev/Next chapter controls
- Image proxy integration for hotlink-protected sources
- Domain-specific colored badges for cached comics
- Relative time display (e.g., "2 jam lalu", "Kemarin")

**State persistence:** Uses localStorage to remember:
- Current chapter between sessions
- NSFW mode preference (`nsfwEnabled` key)
- Navigation state for chapter preloading

**Chapter Preloading:**
- Instant navigation between chapters with preloading
- Memory cache optimization for better performance
- Reduces wait time when switching chapters

**Secret/NSFW Mode:**
- Client-side toggle with warning messages
- Persistent settings via localStorage (`nsfwEnabled` key)
- Migration system from old `secretMode` to new `nsfwEnabled` key
- Server-side validation - backend checks for `mode=secret` parameter
- NSFW content filtering - websites tagged with `data-nsfw="true"` are hidden by default
- Visual NSFW badge - red badge appears in header when mode is active
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

1. **No test suite** - The project currently has no automated tests
2. **No authentication** - The app is completely open, no user system
3. **Environment** - Port is configurable via environment variable (defaults to Express standard)
4. **Deployment** - Supports Docker with multi-stage build (development + production stages)
5. **Styling** - Uses Tailwind CSS v4 via PostCSS. Run `npm run build:css` to compile `public/input.css` to `public/output.css`
6. **Image proxy** - Some sources (Komikcast) require hotlink bypass via `/komik/image` proxy
7. **Headless browser** - Playwright and Puppeteer with Chromium are used for sites requiring JavaScript rendering
8. **Hot-reload** - Docker development mode supports instant reload for JS/CSS changes
9. **Persistent cache** - MongoDB provides persistent caching that survives server restarts. First scrape is slow (~5-10s), subsequent requests are instant (<50ms)
10. **NO Cloudflare-protected websites** - Do NOT add websites protected by Cloudflare. Headless browsers are easily detected by Cloudflare and the content cannot be scraped. This includes websites that show "Just a moment..." or "Performing security verification..." pages.
11. **NSFW content filtering** - NSFW websites (e.g., sektedoujin.cc) require secret mode to be enabled via settings page or URL parameter
12. **Chapter preloading** - Next/previous chapters are preloaded in memory for instant navigation
13. **Cache TTL** - Default is 24 hours (86400 seconds), configurable via `CACHE_TTL` environment variable
14. **LocalStorage keys** - `currentChapter`, `nsfwEnabled` (migrated from `secretMode`)
