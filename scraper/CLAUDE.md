# Scraper Service

This service handles all scraping operations for the Cuma Baca project.

## Purpose

- Fetch and parse HTML from comic websites
- Extract chapter lists and image data
- Cache scraping results in MongoDB
- Provide HTTP API for backend to consume

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `development` | Environment |
| `PORT` | `3200` | Server port |
| `MONGODB_URI` | `mongodb://localhost:27017/cumabaca` | MongoDB connection |
| `SCRAPER_CACHE_TTL` | `172800` (48 hours) | Cache TTL in seconds |

## API Endpoints

### Internal API (Backend only)

- `POST /scrape/chapters` - Scrape chapter list
- `POST /scrape/data` - Scrape chapter images
- `GET /scrape/cache/stats` - Get cache statistics
- `DELETE /scrape/cache` - Clear cache

### Health Check

- `GET /health` - Service health status

## Running Locally

```bash
# Install dependencies
pnpm install

# Start MongoDB
podman-compose -f ../docker-compose.dev.yml up -d mongodb

# Run in development
pnpm run dev

# Run in production
pnpm start
```

## Architecture

- `src/scrapers/` - Website-specific scraper implementations
- `src/controllers/` - Request handlers
- `src/routes/` - API route definitions
- `src/utils/` - Cache and fetch utilities
- `src/config/` - Website configurations

## Adding a New Scraper

1. Create a scraper class in `src/scrapers/`:
   ```javascript
   export class FooComicScraper {
     getSelectors() { return { /* CSS selectors */ }; }
     getChapters($, domain) { /* Extract chapter list */ }
     getChapterData($, url) { /* Extract images and title */ }
   }
   ```

2. Add website config to `src/config/websites.js`:
   ```javascript
   {
     name: 'FooComic',
     domains: ['foocomic.com'],
     baseUrl: 'https://foocomic.com',
     lang: 'en',
     useBrowser: false,  // or true for JS-rendered sites
     nsfw: false
   }
   ```

3. Register in `src/scrapers/index.js`:
   ```javascript
   import { FooComicScraper } from './foocomic.js';
   // Add to scrapers object and websites mapping
   ```

## Important Constraints

- **NO Cloudflare sites** - Headless browsers are detected
- **NSFW websites** - Require `mode=secret` parameter
- **Cache is MongoDB-based** - Survives service restarts
