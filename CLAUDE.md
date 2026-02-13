# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cuma Baca (meaning "Just Read") is a minimalist comic scraper that fetches content from komiku.org and provides a clean, distraction-free reading experience. It's a full-stack JavaScript application with no frontend framework dependencies.

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

## Architecture

### Backend (Express.js)

The backend is a standard Express.js application with two main API endpoints:

- **`GET /komik/chapters?url=<comic-url>`** - Scrapes and returns chapter list for a comic
- **`GET /komik/data?url=<chapter-url>`** - Scrapes and returns images for a specific chapter

**Key files:**

- `app.js` - Express app configuration
- `routes/komik.js` - Comic scraping routes with caching middleware
- `utils/index.js` - Scraping utilities (axios + cheerio)

**Caching:** Routes use in-memory caching (1 day TTL) via `memory-cache` to avoid redundant scraping requests.

### Frontend (Vanilla JavaScript)

The frontend is a single-page application using vanilla JavaScript with a singleton pattern:

- **`public/assets/main.js`** - MainApp class handles data fetching, state management, and chapter navigation
- **`public/assets/ui.js`** - MainUI class handles DOM manipulation and user interactions
- **`public/index.html`** - Single HTML entry point
- **`public/input.css`** - Tailwind CSS v4 imports (compiled to `public/output.css`)

**UI Components:**
- Form submission with loading states (spinner animation, disabled inputs)
- Floating chapter selector with back-to-top button
- Chapter dropdown for navigation
- Prev/Next chapter controls

**State persistence:** Uses localStorage to remember the current chapter between sessions.

### Web Scraping

Scraping utilities in `utils/index.js`:

- `fetchData(url)` - Fetches HTML and loads into Cheerio
- `validateUrl(url)` - Validates URL and extracts domain origin
- `getDomain(url)` - Extracts origin from URL
- `loadCheerio(html)` - Cleans whitespace and loads HTML into Cheerio

**Target site:** komiku.org (previously komiku.id - recent domain change)

## Important Context

1. **No test suite** - The project currently has no tests
2. **No authentication** - The app is completely open, no user system
3. **Environment** - Port is configurable via environment variable (defaults to Express standard)
4. **Styling** - Uses Tailwind CSS v4 via PostCSS. Run `npm run build:css` to compile `public/input.css` to `public/output.css`
