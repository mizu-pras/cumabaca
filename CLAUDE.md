# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cuma Baca (meaning "Just Read") is a minimalist comic scraper that fetches content from multiple comic websites (komiku.org, komikcast.fit, sektedoujin.cc) and provides a clean, distraction-free reading experience.

**Monorepo Architecture:** This project uses a pnpm/npm workspace monorepo structure with separate backend and frontend workspaces.

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


## Development Commands

### Root Workspace Commands

```bash
# Install all dependencies (root + all workspaces)
npm install
# OR with pnpm (recommended for monorepo)
pnpm install

# Full development (Backend + Frontend concurrently)
npm run dev

# Individual workspace development
npm run dev:backend    # Backend only with hot-reload
npm run dev:frontend   # Frontend only with Vite dev server

# Build all workspaces
npm run build

# Build individual workspaces
npm run build:backend
npm run build:frontend

# Start backend in production mode
npm start

# Clean all node_modules
npm run clean
```

### Backend Workspace Commands

Run from root with `npm run <script> --workspace=backend` or cd into `backend/`:

```bash
# Backend development with hot-reload (nodemon)
npm run dev

# Production mode
npm start

# Test scraper functionality
node test-scraper.js
```

### Frontend Workspace Commands

Run from root with `npm run <script> --workspace=frontend` or cd into `frontend/`:

```bash
# Frontend development (Vite dev server)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory or set via Docker:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Backend server port | `3100` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/cumabaca` |
| `CACHE_TTL` | Cache TTL in seconds | `86400` (24 hours) |
| `CORS_ORIGIN` | CORS allowed origin | `*` (all origins in dev) |

### Frontend Environment Variables

Create a `.env` file in the `frontend/` directory:

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `http://localhost:3100` |

**Note:** Frontend variables must be prefixed with `VITE_` to be exposed to the client-side code.

## Deployment

### Docker Deployment

The project includes Docker support for containerized deployment. See `DOCKER.md` for detailed documentation.

**Quick commands:**
```bash
# Start development (hot-reload)
docker-compose -f docker-compose.dev.yml up

# Start production
docker-compose up -d

# Stop containers
docker-compose down
```

### Frontend Deployment Options

The frontend can be deployed to various static hosting platforms:

#### Vercel Deployment

Configuration: `frontend/vercel.json`

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel
```

Update `VITE_API_URL` in Vercel project settings to point to your backend URL.

#### Netlify Deployment

Configuration: `frontend/netlify.toml`

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Deploy from frontend directory
cd frontend
netlify deploy --prod
```

Update `VITE_API_URL` in Netlify site settings to point to your backend URL.

### Backend Deployment

The backend can be deployed as:
- **Docker container** - Use `docker-compose.yml` for production
- **Node.js service** - Deploy to any Node.js hosting (Railway, Render, DigitalOcean, etc.)

**Backend build:**
```bash
# Build Docker image
docker build -t cumabaca-backend ./backend

# Or run directly
cd backend
npm install
npm start
```

## Project Structure

```
cumabaca/                          # Root workspace
├── package.json                   # Root workspace configuration
├── pnpm-workspace.yaml            # pnpm workspace definition
├── docker-compose.yml             # Production Docker compose
├── docker-compose.dev.yml         # Development Docker compose
├── CLAUDE.md                      # This file - AI assistant instructions
├── README.md                      # Project documentation
├── DOCKER.md                      # Docker documentation
│
├── backend/                       # Backend workspace
│   ├── package.json               # Backend dependencies
│   ├── Dockerfile                 # Backend Docker image
│   ├── .dockerignore              # Docker ignore rules
│   ├── app.js                     # Express app configuration
│   ├── bin/
│   │   └── www                    # Server entry point
│   ├── config/                    # Configuration files
│   │   ├── database.js            # MongoDB connection with indexes
│   │   └── websites.js            # Website scraper configuration
│   ├── controllers/               # Route controllers (business logic)
│   │   ├── komikController.js     # Comic scraping controller
│   │   ├── cacheController.js     # Cache management controller
│   │   └── imageProxyController.js # Image proxy controller
│   ├── routes/                    # Express route handlers
│   │   ├── index.js               # Route index
│   │   └── komik.js               # Comic scraping routes with caching
│   ├── scrapers/                  # Scraper implementations
│   │   ├── index.js               # Scraper registry/factory
│   │   ├── komiku.js              # Komiku scraper
│   │   ├── komikcast.js           # Komikcast scraper
│   │   └── sektedoujin.js         # Sektedoujin scraper (NSFW)
│   ├── utils/                     # Utility modules
│   │   ├── cache.js               # Cache middleware
│   │   ├── mongodb-cache.js       # MongoDB cache operations
│   │   ├── test-scraper.js        # Scraper testing utilities
│   │   └── index.js               # Scraping utilities
│   └── test-scraper.js            # CLI scraper testing tool
│
├── frontend/                      # Frontend workspace
│   ├── package.json               # Frontend dependencies
│   ├── vite.config.js             # Vite configuration
│   ├── postcss.config.js          # PostCSS configuration for Tailwind v4
│   ├── netlify.toml               # Netlify deployment config
│   ├── vercel.json                # Vercel deployment config
│   ├── index.html                 # HTML entry point
│   ├── public/                    # Static files
│   │   └── input.css              # Tailwind CSS v4 source
│   └── src/                       # React frontend source
│       ├── main.jsx               # React entry point
│       ├── App.jsx                # Root app component
│       ├── components/            # Shared React components
│       ├── pages/                 # Page components (Reader, Cached, Secret, etc.)
│       │   └── Reader/
│       │       └── hooks/         # Custom React hooks
│       ├── stores/                # Zustand state stores
│       ├── lib/                   # Utilities and API client
│       └── styles/                # Global styles
│
├── examples/                      # Reference HTML for scrapers
├── docs/                          # Project documentation
└── screenshot/                    # Device UI reference images
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

- `backend/app.js` - Express app configuration
- `backend/routes/komik.js` - Route definitions (thin layer, delegates to controllers)
- `backend/controllers/komikController.js` - Comic scraping business logic
- `backend/controllers/cacheController.js` - Cache management and statistics
- `backend/controllers/imageProxyController.js` - Image proxy for CORS/hotlink bypass
- `backend/scrapers/index.js` - Scraper registry/factory for domain-based scraper selection
- `backend/scrapers/komiku.js` - Komiku scraper implementation
- `backend/scrapers/komikcast.js` - Komikcast scraper implementation
- `backend/scrapers/sektedoujin.js` - Sektedoujin scraper implementation
- `backend/config/websites.js` - Website configuration (domains, base URLs, rendering mode)
- `backend/config/database.js` - MongoDB connection management with indexes
- `backend/utils/index.js` - Scraping utilities (axios, cheerio, puppeteer, playwright)
- `backend/utils/cache.js` - Cache middleware using MongoDB for persistence
- `backend/utils/mongodb-cache.js` - MongoDB cache operations (get, put, del, clear, getStats)
- `backend/utils/test-scraper.js` - Scraper testing utilities for validating website scraping

### Scraper Testing

Use `backend/utils/test-scraper.js` to test if a website can be scraped:

```javascript
const { testScraper, printTestResult, canScrape } = require('./backend/utils/test-scraper');

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

Backend directory contains `test-scraper.js` for quick CLI testing:

```bash
# From root directory
node backend/test-scraper.js https://komiku.org/manga/one-piece

# View detailed output
node backend/test-scraper.js https://komiku.org/manga/one-piece --verbose
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

Scrapers are organized using a class-based architecture in `backend/scrapers/`:

Each scraper class implements:
- `getSelectors()` - Returns CSS selectors for the target website
- `getChapters($, domain)` - Extracts chapter list from cheerio instance
- `getChapterData($, url)` - Extracts images and title for a chapter

The `backend/scrapers/index.js` acts as a registry that:
1. Maps domains to appropriate scrapers using `backend/config/websites.js`
2. Provides `getScraperForDomain(domain)` for dynamic scraper selection
3. Provides `getWebsiteConfig(domain)` for website configuration

**Adding a new scraper:**
1. Create a new scraper class in `backend/scrapers/` (e.g., `backend/scrapers/foocomic.js`)
2. Add website config to `backend/config/websites.js`
3. Import and register in `backend/scrapers/index.js`
4. Test with `node backend/test-scraper.js` or `backend/utils/test-scraper.js`

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

### Frontend (React + Vite)

The frontend uses React with Vite as the build tool.

**Tech stack:**
- React 19 with JSX
- React Router for routing
- Zustand for state management
- Lucide React for icons
- Tailwind CSS v4 for styling
- Vite for build tooling

**Pages (frontend/src/pages/):**
- **Reader** - Main comic reader with infinite scroll
- **Cached** - Cached comics management
- **Secret** - NSFW mode settings
- **Websites** - Supported websites listing
- **About** - About page

**State stores (frontend/src/stores/):**
- `nsfwStore.js` - NSFW mode state (Zustand)
- `readerStore.js` - Reader state with infinite scroll

**Key hooks (frontend/src/pages/Reader/hooks/):**
- `useInfiniteChapters.js` - Infinite scroll chapter loading
- `useScrollPosition.js` - Scroll position tracking
- `useActiveChapterDetection.js` - Detect active chapter from scroll
- `useChapterNavigation.js` - Chapter navigation logic

**Secret/NSFW Mode:**
- Zustand store with localStorage persistence (`nsfwEnabled` key)
- Client-side toggle with warning messages
- Server-side validation via `mode=secret` parameter
- NSFW websites (e.g., sektedoujin.cc) filtered by default

### Web Scraping

Scraping utilities in `backend/utils/index.js`:

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

1. **Monorepo structure** - Project uses pnpm/npm workspaces with separate backend/frontend workspaces
2. **No test suite** - The project currently has no automated tests
3. **No authentication** - The app is completely open, no user system
4. **Port** - Backend configurable via environment variable (defaults to 3100)
5. **Image proxy** - Some sources (Komikcast) require hotlink bypass via `/komik/image` proxy
6. **Headless browser** - Puppeteer with Chromium used for JS-rendered sites
7. **Persistent cache** - MongoDB caching survives restarts. First scrape ~5-10s, subsequent <50ms
8. **NO Cloudflare sites** - Do NOT add Cloudflare-protected websites (headless browsers are detected)
9. **NSFW filtering** - NSFW websites require secret mode enabled via settings or URL parameter
10. **Infinite scroll** - Reader loads chapters dynamically as user scrolls
11. **Manual testing** - Always use `docker-compose -f docker-compose.dev.yml up` for manual testing to ensure consistent environment with MongoDB and hot-reload
12. **Environment-specific configs** - Backend CORS must be configured for production deployments
13. **Frontend API URL** - Update `VITE_API_URL` when deploying frontend to point to backend URL
