# Design: Backend-Scraper Service Separation

**Date:** 2025-02-27
**Status:** Approved
**Author:** Claude + User

## Overview

Separate the Cuma Baca backend into two distinct services:
1. **Backend** - Express API that handles HTTP requests, authentication, admin CRUD, and response caching
2. **Scraper** - Dedicated scraping service that handles all HTML fetching and data parsing

**Goal:** Clean separation of concerns where the backend only handles API requests and delegates scraping work to a specialized service.

## Architecture

### Monorepo Structure

```
cumabaca/
├── backend/                    # Express API - handles requests only
│   ├── routes/
│   │   └── komik.js           # Forwards to scraper service
│   ├── controllers/
│   │   └── proxyController.js # Proxies requests to scraper
│   ├── middleware/
│   │   └── scraperClient.js   # HTTP client for scraper service
│   └── utils/
│       └── cache.js           # Response caching (stays)
│
├── scraper/                    # NEW: Scraper service
│   ├── src/
│   │   ├── routes/
│   │   │   └── scrape.js      # Scraping endpoints
│   │   ├── scrapers/          # All scraper classes (moved)
│   │   ├── controllers/
│   │   │   └── scrapeController.js
│   │   ├── utils/
│   │   │   ├── cache.js       # Scraper-level caching
│   │   │   └── mongodb-cache.js
│   │   └── config/
│   │       └── websites.js
│   ├── package.json
│   └── Dockerfile
│
├── frontend/                   # (unchanged)
└── admin/                      # (unchanged)
```

### Service Boundaries

| Concern | Backend | Scraper |
|---------|---------|---------|
| Auth/JWT | ✅ | ❌ |
| Admin CRUD | ✅ | ❌ |
| Response Cache | ✅ | ❌ |
| HTML Fetching | ❌ | ✅ |
| Data Parsing | ❌ | ✅ |
| Scraper Cache | ❌ | ✅ |
| Image Proxy | ✅ | ❌ |

### Communication

- **Backend:** `http://localhost:3100`
- **Scraper:** `http://localhost:3200` (internal Docker network)

## API Design

### Backend API (Client-facing - No Changes)

```
GET /komik/chapters?url=<comic-url>&mode=<normal|secret>
GET /komik/data?url=<chapter-url>&mode=<normal|secret>
GET /komik/image?url=<image-url>
```

### Scraper Service API (Internal Only)

```
POST /scrape/chapters
Request: { url: string, mode: 'normal' | 'secret' }
Response: {
  success: true,
  data: ChapterListResponse,
  cached: boolean,
  scrapeTime: number  // ms
}

POST /scrape/data
Request: { url: string, mode: 'normal' | 'secret' }
Response: {
  success: true,
  data: ChapterDataResponse,
  cached: boolean,
  scrapeTime: number
}

GET /health
Response: { status: 'ok', uptime: number }
```

## Data Flow

```
1. Client: GET /komik/chapters?url=...

2. Backend: Check response cache (MongoDB)
   └─ Cache hit? Return immediately ✅
   └─ Cache miss? Continue ↓

3. Backend: POST http://scraper:3200/scrape/chapters
   └─> Timeout: 30 seconds
   └─> Headers: { 'X-Forwarded-For': clientIP }

4. Scraper: Check scraper cache (MongoDB, separate collection)
   └─> Cache hit? Return { cached: true, data: ... } ✅
   └─> Cache miss? Continue ↓

5. Scraper: Fetch HTML (axios/puppeteer)
   └─> Parse with Cheerio
   └─> Extract data
   └─> Store in scraper cache (48hr TTL)

6. Scraper: Return { cached: false, data: ..., scrapeTime: 5000 }

7. Backend: Store in response cache (24hr TTL)
   └─> Return to client
```

## Database & Caching

### MongoDB Collections

```
cumabaca database:
├── cache_entries          # Response cache (Backend)
│   ├── key: "__express__/komik/chapters?url=..."
│   ├── value: { chapters: [...] }
│   ├── expiresAt: TTL (24 hours)
│   └── createdAt
│
├── scraper_cache          # Scraper cache (Scraper service)
│   ├── url: "https://komiku.org/..."
│   ├── mode: "normal" | "secret"
│   ├── data: { chapters: [...] } or { images: [...] }
│   ├── expiresAt: TTL (48 hours)
│   ├── scrapeTime: number (ms)
│   └── createdAt
│
└── admin_*                # Admin data (unchanged)
```

### Cache TTL Strategy

| Cache Layer | TTL | Purpose |
|-------------|-----|---------|
| Backend Response Cache | 24 hours | Quick response for repeated requests |
| Scraper Cache | 48 hours | Avoid re-scraping same content |

**Why Scraper Cache > Response Cache:**
- Scraping is expensive (5-10 seconds)
- Scraper cache survives backend restarts
- Multiple backend deployments can share scraper cache

## Error Handling

### Timeout Strategy

```
Backend → Scraper timeout/down
  ↓
Backend returns: 504 Gateway Timeout
{
  error: "Scraper service unavailable",
  retryAfter: 60  // seconds
}
```

### Scraper Client Configuration

```javascript
// middleware/scraperClient.js
class ScraperClient {
  async getChapters(url, mode) {
    const response = await axios.post(
      'http://scraper:3200/scrape/chapters',
      { url, mode },
      { timeout: 30000 }  // 30 second timeout
    );
    return response.data;
  }
}
```

## Docker Configuration

### docker-compose.yml (Production)

```yaml
services:
  mongodb:
    image: mongo:8
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "3100:3100"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/cumabaca
      - SCRAPER_URL=http://scraper:3200
    depends_on:
      - mongodb
      - scraper
    restart: unless-stopped

  scraper:
    build:
      context: ./scraper
      dockerfile: Dockerfile
    ports:
      - "3200:3200"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongodb:27017/cumabaca
      - PORT=3200
      - SCRAPER_CACHE_TTL=172800
    depends_on:
      - mongodb
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3200/health"]
      interval: 30s
      timeout: 10s
      retries: 3

volumes:
  mongodb_data:
```

### docker-compose.dev.yml (Development)

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: cumabaca-mongo-dev
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: cumabaca-backend-dev
    ports:
      - "3100:3100"
    volumes:
      - ./backend:/app:Z
      - backend_node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/cumabaca
      - SCRAPER_URL=http://scraper:3200
      - CORS_ORIGIN=http://localhost:5173,http://localhost:5174
    depends_on:
      - mongodb
      - scraper

  scraper:
    build:
      context: ./scraper
      dockerfile: Dockerfile
      target: development
    container_name: cumabaca-scraper-dev
    ports:
      - "3200:3200"
    volumes:
      - ./scraper:/app:Z
      - scraper_node_modules:/app/node_modules
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/cumabaca
      - PORT=3200
      - SCRAPER_CACHE_TTL=172800
    depends_on:
      - mongodb

volumes:
  mongodb_data:
  backend_node_modules:
  scraper_node_modules:
```

### Environment Variables

**Backend (.env):**
```bash
NODE_ENV=production
PORT=3100
MONGODB_URI=mongodb://localhost:27017/cumabaca
CACHE_TTL=86400              # 24 hours
SCRAPER_URL=http://localhost:3200  # Docker: http://scraper:3200
SCRAPER_TIMEOUT=30000        # 30 seconds
CORS_ORIGIN=*
JWT_SECRET=...
```

**Scraper (.env):**
```bash
NODE_ENV=production
PORT=3200
MONGODB_URI=mongodb://localhost:27017/cumabaca
SCRAPER_CACHE_TTL=172800     # 48 hours
```

## Monitoring & Observability

### Health Check Endpoints

**Backend:**
```
GET /health
Response: {
  status: "ok",
  uptime: 12345,
  services: {
    mongodb: "connected",
    scraper: "connected" | "disconnected"
  }
}
```

**Scraper:**
```
GET /health
Response: {
  status: "ok",
  uptime: 54321,
  mongodb: "connected"
}
```

### Logging Strategy

| Component | Logs |
|-----------|------|
| Backend | Requests, cache hits/misses, scraper call duration |
| Scraper | Scraping requests, cache hits/misses, scrape duration, errors |

### Metrics to Track

- `scraper_request_duration` - Time for scraper to respond
- `scraper_cache_hit_rate` - Percentage of scraper cache hits
- `backend_cache_hit_rate` - Percentage of backend cache hits
- `scraper_errors` - Count of scraper failures

## Implementation Phases

### Phase 1: Create Scraper Service
1. Create `scraper/` directory structure
2. Move `scrapers/` from backend to scraper
3. Move `utils/index.js` (scraping utilities) to scraper
4. Move `config/websites.js` to scraper
5. Create scraper Express app (`src/app.js`, `src/bin/www`)
6. Implement scraper API routes (`/scrape/chapters`, `/scrape/data`)
7. Implement scraper cache logic (`scraper_cache` collection)
8. Create scraper package.json and Dockerfile

### Phase 2: Modify Backend
1. Remove `scrapers/` directory
2. Remove scraping-specific utilities (keep generic ones)
3. Create `middleware/scraperClient.js` for HTTP calls to scraper
4. Update `komikController.js` to use scraper client instead of direct scrapers
5. Update response cache to handle scraper responses
6. Add timeout handling for scraper calls

### Phase 3: Update Monorepo Configuration
1. Add `scraper` to `pnpm-workspace.yaml`
2. Update root `package.json` scripts:
   - `pnpm run dev:scraper`
   - `pnpm run dev:all` (starts backend + scraper + mongodb)
3. Update `docker-compose.yml` with scraper service
4. Update `docker-compose.dev.yml` with scraper service

### Phase 4: Testing & Migration
1. Test scraper service standalone
2. Test backend → scraper communication
3. Verify caching works at both layers
4. Test error handling (scraper down, timeout)
5. Update documentation (CLAUDE.md, README.md)

## Benefits

1. **Separation of Concerns:** Backend focuses on API, scraper focuses on scraping
2. **Independent Scaling:** Each service can be scaled based on load
3. **Resilience:** Scraper crashes don't affect backend availability
4. **Flexibility:** Easier to add new scrapers or change scraping logic
5. **Monitoring:** Clear visibility into scraping performance vs API performance
