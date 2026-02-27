# Backend-Scraper Service Separation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Separate the Cuma Baca backend into two services - a backend API that handles requests and a dedicated scraper service that handles all scraping operations.

**Architecture:** Microservice-style separation where Backend (Express API) handles HTTP requests, auth, admin CRUD, and response caching. Scraper (Express API) handles all HTML fetching, data parsing, and scraper-level caching. Services communicate via HTTP REST API on internal Docker network.

**Tech Stack:** Node.js 20, Express.js, MongoDB (shared), Puppeteer, Cheerio, Docker, pnpm workspace.

---

## Prerequisites

**Before starting:**
1. Read design document: `docs/plans/2025-02-27-backend-scraper-separation-design.md`
2. Read backend CLAUDE.md: `backend/CLAUDE.md`
3. Understand current scraper implementation in `backend/scrapers/`

---

## Task 1: Create Scraper Service Directory Structure

**Files:**
- Create: `scraper/src/`
- Create: `scraper/src/routes/`
- Create: `scraper/src/controllers/`
- Create: `scraper/src/middleware/`
- Create: `scraper/src/utils/`
- Create: `scraper/src/config/`
- Create: `scraper/src/scrapers/`
- Create: `scraper/src/bin/`

**Step 1: Create directory structure**

Run: `mkdir -p scraper/src/{routes,controllers,middleware,utils,config,scrapers,bin}`

**Step 2: Verify directories created**

Run: `tree scraper -L 3`
Expected output shows all created directories

**Step 3: Create .gitkeep in empty dirs**

Run: `touch scraper/src/routes/.gitkeep scraper/src/controllers/.gitkeep scraper/src/middleware/.gitkeep scraper/src/utils/.gitkeep scraper/src/config/.gitkeep scraper/src/scrapers/.gitkeep scraper/src/bin/.gitkeep`

**Step 4: Commit**

```bash
git add scraper/
git commit -m "feat(scraper): create scraper service directory structure"
```

---

## Task 2: Create Scraper Package Configuration

**Files:**
- Create: `scraper/package.json`
- Create: `scraper/.env.example`

**Step 1: Create package.json**

```json
{
  "name": "@cumabaca/scraper",
  "version": "1.0.0",
  "description": "Scraper service for Cuma Baca",
  "main": "src/app.js",
  "type": "module",
  "scripts": {
    "start": "node src/bin/www",
    "dev": "nodemon src/bin/www",
    "test": "echo \"No tests yet\""
  },
  "dependencies": {
    "axios": "^1.7.0",
    "cheerio": "^1.0.0",
    "express": "^4.19.0",
    "mongodb": "^6.8.0",
    "puppeteer": "^22.0.0"
  },
  "devDependencies": {
    "nodemon": "^3.1.0"
  }
}
```

**Step 2: Create .env.example**

```bash
NODE_ENV=development
PORT=3200
MONGODB_URI=mongodb://localhost:27017/cumabaca
SCRAPER_CACHE_TTL=172800
```

**Step 3: Commit**

```bash
git add scraper/package.json scraper/.env.example
git commit -m "feat(scraper): add package configuration"
```

---

## Task 3: Move Scrapers to Scraper Service

**Files:**
- Move: `backend/scrapers/` → `scraper/src/scrapers/`
- Modify: `scraper/src/scrapers/index.js` (update imports if needed)

**Step 1: Copy scrapers directory**

Run: `cp -r backend/scrapers/* scraper/src/scrapers/`

**Step 2: Verify copy**

Run: `ls -la scraper/src/scrapers/`
Expected: `index.js`, `komiku.js`, `komikcast.js`, `sektedoujin.js`

**Step 3: Review scraper index.js**

Read: `scraper/src/scrapers/index.js`
Verify: No backend-specific imports (should be self-contained)

**Step 4: Commit**

```bash
git add scraper/src/scrapers/
git commit -m "feat(scraper): move scrapers from backend"
```

---

## Task 4: Move Scraper Utilities and Config

**Files:**
- Move: `backend/utils/index.js` → `scraper/src/utils/fetch.js`
- Move: `backend/config/websites.js` → `scraper/src/config/websites.js`

**Step 1: Copy scraping utilities**

Run: `cp backend/utils/index.js scraper/src/utils/fetch.js`

**Step 2: Copy website config**

Run: `mkdir -p scraper/src/config && cp backend/config/websites.js scraper/src/config/`

**Step 3: Verify files copied**

Run: `ls -la scraper/src/utils/ scraper/src/config/`
Expected: `fetch.js` in utils, `websites.js` in config

**Step 4: Commit**

```bash
git add scraper/src/utils/ scraper/src/config/
git commit -m "feat(scraper): move scraper utilities and config"
```

---

## Task 5: Create Scraper Express App

**Files:**
- Create: `scraper/src/app.js`

**Step 1: Create Express app**

```javascript
import express from 'express';
import cors from 'cors';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`);
  });
  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Routes (will be added in next tasks)
// app.use('/scrape', scrapeRoutes);

// Error handler
app.use((err, req, res, next) => {
  console.error('Scraper error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

export default app;
```

**Step 2: Commit**

```bash
git add scraper/src/app.js
git commit -m "feat(scraper): create Express app with health check"
```

---

## Task 6: Create Scraper Server Entry Point

**Files:**
- Create: `scraper/src/bin/www`

**Step 1: Create server entry point**

```javascript
#!/usr/bin/env node

import app from '../app.js';
import { connectDatabase } from '../utils/mongodb-cache.js';

const PORT = process.env.PORT || 3200;

const server = app.listen(PORT, async () => {
  console.log(`Scraper service listening on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);

  // Connect to MongoDB
  try {
    await connectDatabase();
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection failed:', error);
    process.exit(1);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
```

**Step 2: Make executable**

Run: `chmod +x scraper/src/bin/www`

**Step 3: Commit**

```bash
git add scraper/src/bin/www
git commit -m "feat(scraper): add server entry point with graceful shutdown"
```

---

## Task 7: Create MongoDB Cache Utility for Scraper

**Files:**
- Create: `scraper/src/utils/mongodb-cache.js`

**Step 1: Create cache utility**

```javascript
import { MongoClient } from 'mongodb';

let client = null;
let db = null;
let scraperCacheCollection = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cumabaca';
const SCRAPER_CACHE_TTL = parseInt(process.env.SCRAPER_CACHE_TTL || '172800'); // 48 hours default

export async function connectDatabase() {
  if (client) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();

  // Get or create scraper cache collection with TTL index
  scraperCacheCollection = db.collection('scraper_cache');
  await scraperCacheCollection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'ttl_index' }
  );
  await scraperCacheCollection.createIndex(
    { url: 1, mode: 1 },
    { name: 'url_mode_index' }
  );

  console.log('Scraper cache collection ready');
  return db;
}

// Generate cache key from URL and mode
function getCacheKey(url, mode) {
  return `${url}|${mode || 'normal'}`;
}

// Get cached scraping result
export async function getScraperCache(url, mode) {
  if (!scraperCacheCollection) {
    await connectDatabase();
  }

  const key = getCacheKey(url, mode);
  const cached = await scraperCacheCollection.findOne({ key });

  if (cached && cached.expiresAt > new Date()) {
    console.log(`Scraper cache hit: ${key}`);
    return {
      data: cached.data,
      scrapeTime: cached.scrapeTime,
      cached: true
    };
  }

  console.log(`Scraper cache miss: ${key}`);
  return null;
}

// Store scraping result in cache
export async function setScraperCache(url, mode, data, scrapeTime) {
  if (!scraperCacheCollection) {
    await connectDatabase();
  }

  const key = getCacheKey(url, mode);
  const expiresAt = new Date(Date.now() + SCRAPER_CACHE_TTL * 1000);

  await scraperCacheCollection.updateOne(
    { key },
    {
      $set: {
        key,
        url,
        mode: mode || 'normal',
        data,
        scrapeTime,
        expiresAt,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  console.log(`Scraper cache set: ${key} (TTL: ${SCRAPER_CACHE_TTL}s)`);
}

// Get cache statistics
export async function getScraperCacheStats() {
  if (!scraperCacheCollection) {
    await connectDatabase();
  }

  const total = await scraperCacheCollection.countDocuments();
  const expired = await scraperCacheCollection.countDocuments({
    expiresAt: { $lt: new Date() }
  });

  return {
    total,
    active: total - expired,
    expired,
    ttl: SCRAPER_CACHE_TTL
  };
}

// Clear all scraper cache
export async function clearScraperCache() {
  if (!scraperCacheCollection) {
    await connectDatabase();
  }

  const result = await scraperCacheCollection.deleteMany({});
  console.log(`Cleared ${result.deletedCount} scraper cache entries`);
  return result.deletedCount;
}

// Close database connection
export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    scraperCacheCollection = null;
  }
}
```

**Step 2: Commit**

```bash
git add scraper/src/utils/mongodb-cache.js
git commit -m "feat(scraper): add MongoDB cache utility for scraper"
```

---

## Task 8: Create Scraper Controller

**Files:**
- Create: `scraper/src/controllers/scrapeController.js`

**Step 1: Create scrape controller**

```javascript
import { getScraperCache, setScraperCache } from '../utils/mongodb-cache.js';
import { fetchData, fetchDataWithBrowser } from '../utils/fetch.js';
import { getScraperForDomain, getWebsiteConfig } from '../scrapers/index.js';

/**
 * Scrape chapter list from comic URL
 */
export async function scrapeChapters(req, res, next) {
  const { url, mode = 'normal' } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  const startTime = Date.now();

  try {
    // Check cache first
    const cached = await getScraperCache(url, mode);
    if (cached) {
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        scrapeTime: cached.scrapeTime
      });
    }

    // Get website configuration
    const config = getWebsiteConfig(url);
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported website'
      });
    }

    // Check NSFW mode requirement
    if (config.nsfw && mode !== 'secret') {
      return res.status(403).json({
        success: false,
        error: 'This content requires secret mode'
      });
    }

    // Fetch HTML
    const $ = config.useBrowser
      ? await fetchDataWithBrowser(url, config)
      : await fetchData(url);

    if (!$) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch page'
      });
    }

    // Get scraper and extract data
    const scraper = getScraperForDomain(url);
    const chapters = scraper.getChapters($, new URL(url).hostname);

    const scrapeTime = Date.now() - startTime;

    // Cache the result
    await setScraperCache(url, mode, chapters, scrapeTime);

    res.json({
      success: true,
      data: chapters,
      cached: false,
      scrapeTime
    });

  } catch (error) {
    console.error('Scrape chapters error:', error);
    next(error);
  }
}

/**
 * Scrape chapter data (images) from chapter URL
 */
export async function scrapeData(req, res, next) {
  const { url, mode = 'normal' } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  const startTime = Date.now();

  try {
    // Check cache first
    const cached = await getScraperCache(url, mode);
    if (cached) {
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        scrapeTime: cached.scrapeTime
      });
    }

    // Get website configuration
    const config = getWebsiteConfig(url);
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported website'
      });
    }

    // Check NSFW mode requirement
    if (config.nsfw && mode !== 'secret') {
      return res.status(403).json({
        success: false,
        error: 'This content requires secret mode'
      });
    }

    // Fetch HTML
    const $ = config.useBrowser
      ? await fetchDataWithBrowser(url, config)
      : await fetchData(url);

    if (!$) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch page'
      });
    }

    // Get scraper and extract data
    const scraper = getScraperForDomain(url);
    const data = scraper.getChapterData($, url);

    const scrapeTime = Date.now() - startTime;

    // Cache the result
    await setScraperCache(url, mode, data, scrapeTime);

    res.json({
      success: true,
      data,
      cached: false,
      scrapeTime
    });

  } catch (error) {
    console.error('Scrape data error:', error);
    next(error);
  }
}

/**
 * Get scraper cache statistics
 */
export async function getCacheStats(req, res) {
  try {
    const stats = await getScraperCacheStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Clear scraper cache
 */
export async function clearCache(req, res) {
  try {
    const deleted = await clearScraperCache();
    res.json({
      success: true,
      deleted
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
```

**Step 2: Commit**

```bash
git add scraper/src/controllers/scrapeController.js
git commit -m "feat(scraper): add scrape controller with caching"
```

---

## Task 9: Create Scraper Routes

**Files:**
- Create: `scraper/src/routes/scrape.js`

**Step 1: Create scrape routes**

```javascript
import express from 'express';
import {
  scrapeChapters,
  scrapeData,
  getCacheStats,
  clearCache
} from '../controllers/scrapeController.js';

const router = express.Router();

/**
 * POST /scrape/chapters
 * Scrape chapter list from comic URL
 */
router.post('/chapters', scrapeChapters);

/**
 * POST /scrape/data
 * Scrape chapter data (images) from chapter URL
 */
router.post('/data', scrapeData);

/**
 * GET /scrape/cache/stats
 * Get scraper cache statistics
 */
router.get('/cache/stats', getCacheStats);

/**
 * DELETE /scrape/cache
 * Clear all scraper cache
 */
router.delete('/cache', clearCache);

export default router;
```

**Step 2: Update app.js to use routes**

Read: `scraper/src/app.js`

Add after health check route:
```javascript
import scrapeRoutes from './routes/scrape.js';

// ... existing code ...

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Scraping routes
app.use('/scrape', scrapeRoutes);
```

**Step 3: Commit**

```bash
git add scraper/src/routes/scrape.js scraper/src/app.js
git commit -m "feat(scraper): add scraping routes"
```

---

## Task 10: Add CORS Dependency to Scraper

**Files:**
- Modify: `scraper/package.json`

**Step 1: Add cors dependency**

Read: `scraper/package.json`

Add to dependencies:
```json
"cors": "^2.8.5"
```

**Step 2: Install dependencies**

Run: `cd scraper && pnpm install`

**Step 3: Verify installation**

Run: `ls scraper/node_modules/cors`
Expected: cors directory exists

**Step 4: Commit**

```bash
git add scraper/package.json scraper/pnpm-lock.yaml
git commit -m "feat(scraper): add cors dependency"
```

---

## Task 11: Test Scraper Service Locally

**Files:**
- Create: `scraper/.env`

**Step 1: Create test .env file**

```bash
NODE_ENV=development
PORT=3200
MONGODB_URI=mongodb://localhost:27017/cumabaca
SCRAPER_CACHE_TTL=172800
```

**Step 2: Start MongoDB (if not running)**

Run: `podman-compose -f docker-compose.dev.yml up -d mongodb`

**Step 3: Start scraper service**

Run: `cd scraper && pnpm run dev`

Expected output: "Scraper service listening on port 3200"

**Step 4: Test health endpoint**

Run: `curl http://localhost:3200/health`

Expected:
```json
{"status":"ok","uptime":...,"timestamp":"..."}
```

**Step 5: Test scrape endpoint (requires valid comic URL)**

Run: `curl -X POST http://localhost:3200/scrape/chapters -H "Content-Type: application/json" -d '{"url":"https://komiku.org/manga/one-piece/","mode":"normal"}'`

Expected: Response with success: true and chapters data

**Step 6: Commit .env.example update**

```bash
git add scraper/.env.example
git commit -m "chore(scraper): add .env.example"
```
**Note:** Don't commit the actual `.env` file (it should already be in .gitignore)

---

## Task 12: Create Scraper Dockerfile

**Files:**
- Create: `scraper/Dockerfile`

**Step 1: Create production Dockerfile**

```dockerfile
FROM node:20-alpine AS base

# Install dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Dependencies stage
FROM base AS deps
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile

# Development stage
FROM base AS development
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=development
CMD ["pnpm", "run", "dev"]

# Builder stage
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NODE_ENV=production
RUN pnpm run build

# Production stage
FROM base AS production
COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
ENV NODE_ENV=production
CMD ["node", "src/bin/www"]
```

**Step 2: Commit**

```bash
git add scraper/Dockerfile
git commit -m "feat(scraper): add Dockerfile with multi-stage build"
```

---

## Task 13: Create Backend Scraper Client

**Files:**
- Create: `backend/middleware/scraperClient.js`

**Step 1: Create scraper client**

```javascript
import axios from 'axios';

const SCRAPER_URL = process.env.SCRAPER_URL || 'http://localhost:3200';
const SCRAPER_TIMEOUT = parseInt(process.env.SCRAPER_TIMEOUT || '30000');

class ScraperClient {
  constructor() {
    this.healthy = true;
    this.lastCheck = null;
    this.client = axios.create({
      baseURL: SCRAPER_URL,
      timeout: SCRAPER_TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // Start health check interval
    this.startHealthCheck();
  }

  /**
   * Check scraper service health
   */
  async healthCheck() {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      this.healthy = response.data.status === 'ok';
    } catch (error) {
      this.healthy = false;
      console.error('Scraper service unhealthy:', error.message);
    }
    this.lastCheck = new Date();
    return this.healthy;
  }

  /**
   * Start periodic health checks
   */
  startHealthCheck() {
    // Check every 30 seconds
    this.healthCheckInterval = setInterval(() => {
      this.healthCheck();
    }, 30000);

    // Initial check
    this.healthCheck();
  }

  /**
   * Stop health checks
   */
  stopHealthCheck() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }
  }

  /**
   * Get chapter list from scraper
   */
  async getChapters(url, mode = 'normal') {
    try {
      const response = await this.client.post('/scrape/chapters', { url, mode });
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        throw new Error('Scraper service unavailable');
      }
      throw error;
    }
  }

  /**
   * Get chapter data from scraper
   */
  async getData(url, mode = 'normal') {
    try {
      const response = await this.client.post('/scrape/data', { url, mode });
      return {
        success: true,
        ...response.data
      };
    } catch (error) {
      if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
        throw new Error('Scraper service unavailable');
      }
      throw error;
    }
  }

  /**
   * Check if scraper is healthy
   */
  isHealthy() {
    return this.healthy;
  }

  /**
   * Get scraper cache statistics
   */
  async getCacheStats() {
    try {
      const response = await this.client.get('/scrape/cache/stats');
      return response.data;
    } catch (error) {
      console.error('Failed to get scraper cache stats:', error.message);
      return null;
    }
  }

  /**
   * Clear scraper cache
   */
  async clearCache() {
    try {
      const response = await this.client.delete('/scrape/cache');
      return response.data;
    } catch (error) {
      console.error('Failed to clear scraper cache:', error.message);
      return null;
    }
  }
}

// Singleton instance
const scraperClient = new ScraperClient();

export default scraperClient;
```

**Step 2: Commit**

```bash
git add backend/middleware/scraperClient.js
git commit -m "feat(backend): add scraper client middleware"
```

---

## Task 14: Update Backend Environment Variables

**Files:**
- Modify: `backend/.env.example`

**Step 1: Read current .env.example**

Run: `cat backend/.env.example`

**Step 2: Add scraper variables**

Add to end of file:
```bash
# Scraper Service
SCRAPER_URL=http://localhost:3200
SCRAPER_TIMEOUT=30000
```

**Step 3: Commit**

```bash
git add backend/.env.example
git commit -m "chore(backend): add scraper environment variables"
```

---

## Task 15: Update Backend Komik Controller

**Files:**
- Modify: `backend/controllers/komikController.js`

**Step 1: Read current controller**

Read: `backend/controllers/komikController.js`

**Step 2: Replace direct scraper calls with scraper client**

The controller should now:
1. Remove direct imports of scrapers
2. Import scraperClient instead
3. Replace scraper calls with scraperClient methods

New implementation:

```javascript
import scraperClient from '../middleware/scraperClient.js';
import { getWebsiteConfig } from '../config/websites.js';

/**
 * Get chapter list for a comic
 */
export const getChapters = async (req, res, next) => {
  const { url, mode = 'normal' } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required'
    });
  }

  try {
    // Validate URL is from supported website
    const config = getWebsiteConfig(url);
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported website URL'
      });
    }

    // Check NSFW mode requirement
    if (config.nsfw && mode !== 'secret') {
      return res.status(403).json({
        success: false,
        error: 'This content requires secret mode'
      });
    }

    // Call scraper service
    const result = await scraperClient.getChapters(url, mode);

    res.json(result);

  } catch (error) {
    if (error.message === 'Scraper service unavailable') {
      return res.status(504).json({
        success: false,
        error: 'Scraper service unavailable. Please try again later.',
        retryAfter: 60
      });
    }
    next(error);
  }
};

/**
 * Get chapter data (images)
 */
export const getChapterData = async (req, res, next) => {
  const { url, mode = 'normal' } = req.query;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL parameter is required'
    });
  }

  try {
    // Validate URL is from supported website
    const config = getWebsiteConfig(url);
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported website URL'
      });
    }

    // Check NSFW mode requirement
    if (config.nsfw && mode !== 'secret') {
      return res.status(403).json({
        success: false,
        error: 'This content requires secret mode'
      });
    }

    // Call scraper service
    const result = await scraperClient.getData(url, mode);

    res.json(result);

  } catch (error) {
    if (error.message === 'Scraper service unavailable') {
      return res.status(504).json({
        success: false,
        error: 'Scraper service unavailable. Please try again later.',
        retryAfter: 60
      });
    }
    next(error);
  }
};

// Keep existing cache stats and image proxy functions
// They don't use scrapers directly
```

**Step 3: Commit**

```bash
git add backend/controllers/komikController.js
git commit -m "refactor(backend): use scraper client instead of direct scrapers"
```

---

## Task 16: Remove Scrapers Directory from Backend

**Files:**
- Delete: `backend/scrapers/`

**Step 1: Verify scraper service is working**

Run: `curl http://localhost:3200/health`

**Step 2: Remove scrapers directory**

Run: `rm -rf backend/scrapers/`

**Step 3: Remove scraper-specific utilities from backend**

Run: `rm backend/utils/index.js`

**Step 4: Update backend routes to remove scraper imports**

Read: `backend/routes/komik.js`

Remove any imports from scrapers directory (should now use controller only)

**Step 5: Commit**

```bash
git add backend/
git commit -m "refactor(backend): remove scrapers and scraping utilities"
```

---

## Task 17: Update Backend Package Scripts

**Files:**
- Modify: `backend/package.json`

**Step 1: Read package.json**

Read: `backend/package.json`

**Step 2: Remove scraper dependencies**

Remove these dependencies (if present):
- `puppeteer`
- `cheerio` (keep if used elsewhere)

**Step 3: Commit**

```bash
git add backend/package.json
git commit -m "chore(backend): remove scraper dependencies"
```

---

## Task 18: Update Root Workspace Configuration

**Files:**
- Modify: `pnpm-workspace.yaml`
- Modify: `package.json`

**Step 1: Add scraper to workspace**

Read: `pnpm-workspace.yaml`

Add to packages list:
```yaml
packages:
  - 'backend'
  - 'frontend'
  - 'admin'
  - 'scraper'
```

**Step 2: Update root package.json scripts**

Read: `package.json`

Add/update scripts:
```json
"scripts": {
  "dev": "pnpm --filter \"./backend/**\" --filter \"./frontend/**\" --filter \"./admin/**\" --filter \"./scraper/**\" dev",
  "dev:backend": "pnpm --filter backend dev",
  "dev:frontend": "pnpm --filter frontend dev",
  "dev:admin": "pnpm --filter admin dev",
  "dev:scraper": "pnpm --filter scraper dev",
  "dev:all": "concurrently \"pnpm:dev:scraper\" \"pnpm:dev:backend\" \"pnpm:dev:frontend\" \"pnpm:dev:admin\"",
  "build": "pnpm --filter \"./backend/**\" --filter \"./frontend/**\" --filter \"./admin/**\" --filter \"./scraper/**\" build"
}
```

**Step 3: Add concurrently if not present**

Run: `pnpm add -D concurrently`

**Step 4: Commit**

```bash
git add pnpm-workspace.yaml package.json pnpm-lock.yaml
git commit -m "chore: add scraper to workspace and update scripts"
```

---

## Task 19: Update Docker Compose Production

**Files:**
- Modify: `docker-compose.yml`

**Step 1: Read current docker-compose.yml**

Read: `docker-compose.yml`

**Step 2: Add scraper service**

Add after backend service:

```yaml
  scraper:
    build:
      context: ./scraper
      dockerfile: Dockerfile
      target: production
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
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3200/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

**Step 3: Update backend service to depend on scraper**

Add to backend depends_on:
```yaml
    depends_on:
      - mongodb
      - scraper
```

Add to backend environment:
```yaml
      - SCRAPER_URL=http://scraper:3200
```

**Step 4: Commit**

```bash
git add docker-compose.yml
git commit -m "chore: add scraper service to docker-compose"
```

---

## Task 20: Update Docker Compose Development

**Files:**
- Modify: `docker-compose.dev.yml`

**Step 1: Read current docker-compose.dev.yml**

Read: `docker-compose.dev.yml`

**Step 2: Add scraper service**

Add after backend service:

```yaml
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
```

**Step 3: Update backend service**

Add to backend environment:
```yaml
      - SCRAPER_URL=http://scraper:3200
```

Add to backend depends_on:
```yaml
    depends_on:
      - mongodb
      - scraper
```

**Step 4: Add scraper node modules volume**

Add to volumes section:
```yaml
  scraper_node_modules:
```

**Step 5: Commit**

```bash
git add docker-compose.dev.yml
git commit -m "chore: add scraper service to docker-compose.dev"
```

---

## Task 21: Add Backend Health Check with Scraper Status

**Files:**
- Modify: `backend/app.js` or create `backend/routes/health.js`

**Step 1: Create health check route**

Create: `backend/routes/health.js`

```javascript
import express from 'express';
import scraperClient from '../middleware/scraperClient.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const health = {
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    services: {
      scraper: {
        status: scraperClient.isHealthy() ? 'connected' : 'disconnected',
        lastCheck: scraperClient.lastCheck
      }
    }
  };

  // Return 503 if scraper is unhealthy
  if (!scraperClient.isHealthy()) {
    return res.status(503).json(health);
  }

  res.json(health);
});

export default router;
```

**Step 2: Register health route in app.js**

Read: `backend/app.js`

Add before error handler:
```javascript
import healthRoutes from './routes/health.js';

// ... existing code ...

app.use('/health', healthRoutes);
```

**Step 3: Commit**

```bash
git add backend/routes/health.js backend/app.js
git commit -m "feat(backend): add health check with scraper status"
```

---

## Task 22: Test Complete Integration

**Files:**
- No files created/modified (testing task)

**Step 1: Start all services with docker-compose**

Run: `podman-compose -f docker-compose.dev.yml up -d`

**Step 2: Wait for services to be healthy**

Run: `podman-compose -f docker-compose.dev.yml ps`

Expected: All services show "Up"

**Step 3: Test backend health check**

Run: `curl http://localhost:3100/health`

Expected: Response showing scraper as "connected"

**Step 4: Test scraper health check**

Run: `curl http://localhost:3200/health`

Expected: Response with status "ok"

**Step 5: Test full scraping flow**

Run: `curl "http://localhost:3100/komik/chapters?url=https://komiku.org/manga/one-piece/&mode=normal"`

Expected: Response with chapters data

**Step 6: Verify caching works**

Run the same command again - should be faster (cached)

**Step 7: Test scraper cache stats**

Run: `curl http://localhost:3200/scrape/cache/stats`

Expected: Response with cache statistics

**Step 8: Stop services**

Run: `podman-compose -f docker-compose.dev.yml down`

**Step 9: Document test results**

Create note about any issues found and fixes applied

---

## Task 23: Update Documentation

**Files:**
- Modify: `CLAUDE.md`
- Modify: `README.md`

**Step 1: Update root CLAUDE.md**

Read: `CLAUDE.md`

Update workspace overview table to include scraper:

```markdown
| Workspace | Port | Purpose | CLAUDE.md |
|-----------|------|---------|-----------|
| `backend/` | 3100 | Express API + proxy to scraper | [backend/CLAUDE.md](./backend/CLAUDE.md) |
| `scraper/` | 3200 | Scraping service | [scraper/CLAUDE.md](./scraper/CLAUDE.md) |
| `frontend/` | 5173 | Public comic reader (React 19 + Vite) | [frontend/CLAUDE.md](./frontend/CLAUDE.md) |
| `admin/` | 5174 | Admin panel for managing content | [admin/CLAUDE.md](./admin/CLAUDE.md) |
```

Update development commands:
```markdown
# Individual workspaces
pnpm run dev:backend    # Backend with MongoDB (podman-compose), port 3100
pnpm run dev:scraper    # Scraper service, port 3200
pnpm run dev:frontend   # Frontend (Vite), port 5173
pnpm run dev:admin      # Admin panel (Vite), port 5174
```

**Step 2: Create scraper CLAUDE.md**

Create: `scraper/CLAUDE.md`

```markdown
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
```

**Step 3: Update backend CLAUDE.md**

Read: `backend/CLAUDE.md`

Update to reflect that scraping is now done by scraper service:

```markdown
## Architecture

The backend is now a lightweight API that:
- Handles HTTP requests from clients
- Manages authentication and admin CRUD
- Caches API responses
- Proxies scraping requests to the scraper service

Scraping operations are handled by the separate `scraper/` service.
```

**Step 4: Commit**

```bash
git add CLAUDE.md scraper/CLAUDE.md backend/CLAUDE.md
git commit -m "docs: update documentation for backend-scraper separation"
```

---

## Task 24: Final Verification and Cleanup

**Files:**
- Various (verification and cleanup)

**Step 1: Check for unused dependencies in backend**

Run: `cd backend && pnpm ls --depth=0`

Identify any scraper-related dependencies that can be removed

**Step 2: Check for unused files**

Run: `git status`

Look for any temporary files or unused code

**Step 3: Run linter**

Run: `pnpm run lint` (if configured)

**Step 4: Run full integration test**

Run: `podman-compose -f docker-compose.dev.yml up --build`

Test all endpoints:
- Backend health: `curl http://localhost:3100/health`
- Scraper health: `curl http://localhost:3200/health`
- Comic chapters: `curl "http://localhost:3100/komik/chapters?url=..."`
- Admin login: (test admin still works)

**Step 5: Stop services**

Run: `podman-compose -f docker-compose.dev.yml down`

**Step 6: Final commit**

```bash
git add .
git commit -m "chore: final cleanup and verification"
```

---

## Summary

This implementation plan separates the Cuma Baca backend into two services:

1. **Backend** - Lightweight API that handles requests, auth, admin CRUD, and response caching
2. **Scraper** - Dedicated scraping service that fetches and parses HTML

The services communicate via HTTP REST API and share a MongoDB instance for caching.

**Benefits:**
- Clear separation of concerns
- Independent scaling
- Better resilience
- Easier monitoring and debugging

**Total estimated time:** 3-4 hours for full implementation

---

**Next Steps:**
- Review and approve this plan
- Choose execution method (subagent-driven or parallel session)
- Begin implementation
