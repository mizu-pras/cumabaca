# Cuma Baca - Backend Workspace

This is the backend workspace for Cuma Baca, a minimalist comic scraper API.

## Overview

Express.js REST API that handles HTTP requests, authentication, admin CRUD, response caching, and proxies scraping requests to the dedicated scraper service.

## Architecture

The backend is now a lightweight API that:
- Handles HTTP requests from clients
- Manages authentication and admin CRUD
- Caches API responses (24-hour TTL)
- Proxies scraping requests to the scraper service via HTTP

Scraping operations are handled by the separate `scraper/` service.

## Tech Stack

- **Express.js** - Web framework
- **MongoDB** - Persistent cache storage
- **Axios** - HTTP client for scraper communication
- **JWT** - Authentication for admin routes

## Development Commands

**Note:** MongoDB and scraper service must be running before starting the backend.

```bash
# Development with hot-reload (runs on port 3100)
pnpm run dev

# Production mode
pnpm run start
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
| `JWT_SECRET` | Secret for signing JWT tokens | `change-this-secret-in-production` |
| `ADMIN_JWT_EXPIRY` | Token expiry time | `24h` |
| `SCRAPER_URL` | Scraper service URL | `http://localhost:3200` |
| `SCRAPER_TIMEOUT` | Scraper request timeout (ms) | `30000` |

## API Endpoints

### Health Check

- **`GET /health`** - Service health status including scraper connection status
  - Returns 503 if scraper is unhealthy

### Comic Scraping (proxied to scraper service)

- **`GET /komik/chapters?url=<comic-url>&mode=<normal|secret>`** - Get chapter list for a comic
- **`GET /komik/data?url=<chapter-url>&mode=<normal|secret>`** - Get images for a specific chapter
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

## Project Structure

```
backend/
├── app.js                     # Express app configuration
├── bin/www                    # Server entry point
├── config/
│   ├── database.js            # MongoDB connection with indexes
│   └── websites.js            # Website configuration (for validation)
├── controllers/
│   ├── komikController.js     # Comic scraping logic (proxies to scraper)
│   ├── cacheController.js     # Cache management
│   ├── imageProxyController.js # Image proxy
│   ├── adminController.js     # Admin auth logic
│   ├── languageController.js  # Languages CRUD
│   ├── websiteController.js   # Websites CRUD
│   └── komikController.js     # Komiks CRUD
├── middleware/
│   ├── auth.js                # JWT auth middleware (requireAuth)
│   └── scraperClient.js       # HTTP client for scraper service
├── models/
│   └── AdminUser.js           # Admin user model with password hashing
├── routes/
│   ├── index.js               # Route index
│   ├── komik.js               # Comic scraping routes
│   ├── health.js              # Health check with scraper status
│   ├── admin.js               # Admin auth routes
│   └── admin/                 # Admin CRUD routes (protected)
│       ├── languages.js
│       ├── websites.js
│       ├── komiks.js
│       └── komik-websites.js
└── utils/
    ├── cache.js               # Cache middleware
    ├── mongodb-cache.js       # MongoDB cache operations
    └── asyncHandler.js        # Async error wrapper
```

## Scraper Client

The backend communicates with the scraper service via HTTP:

```javascript
import scraperClient from '../middleware/scraperClient.js';

// Get chapters from scraper
const result = await scraperClient.getChapters(url, mode);

// Get chapter data from scraper
const data = await scraperClient.getData(url, mode);

// Check scraper health
const isHealthy = scraperClient.isHealthy();
```

The scraper client:
- Automatically health-checks the scraper service every 30 seconds
- Returns 504 errors when scraper is unavailable
- Handles connection failures gracefully

## Important Constraints

- **Scraper service required** - Backend cannot scrape without scraper service
- **NO Cloudflare sites** - Headless browsers are detected by scraper
- **NSFW filtering** - Requires `mode=secret` parameter
- **Image proxy** - Some sources require `/komik/image` proxy for hotlink bypass

## Cache Architecture

- MongoDB-based persistent cache (backend level)
- 1-day TTL (configurable via `CACHE_TTL`)
- Survives server restarts
- Scraper service has its own 48-hour cache for scraped content
