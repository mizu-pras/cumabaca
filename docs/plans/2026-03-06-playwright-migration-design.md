# Playwright Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace Puppeteer with Playwright + stealth config for browser-based scraping in the scraper service.

**Architecture:** Only `useBrowser: true` sites (komikcast, sektedoujin) are affected. Playwright launches Chromium per-request with anti-detection stealth scripts. komiku stays on axios+cheerio. The scraper interface (`fetchDataWithBrowser`) remains identical so no controller/scraper changes needed.

**Tech Stack:** Playwright (Chromium), Cheerio, Node.js 20, Docker (node:20-slim)

---

### Task 1: Swap dependencies (Puppeteer -> Playwright)

**Files:**
- Modify: `scraper/package.json`

**Step 1: Remove puppeteer, add playwright**

In `scraper/package.json`, replace the `puppeteer` dependency:

```json
// Remove this line:
"puppeteer": "^22.0.0"

// Add this line:
"playwright": "^1.52.0"
```

**Step 2: Install dependencies**

Run from repo root:
```bash
cd scraper && pnpm install
```

Expected: `pnpm-lock.yaml` updates, `node_modules` has `playwright` instead of `puppeteer`.

**Step 3: Install Playwright Chromium browser**

```bash
cd scraper && npx playwright install chromium
```

Expected: Chromium binary downloaded to Playwright cache.

**Step 4: Commit**

```bash
git add scraper/package.json pnpm-lock.yaml
git commit -m "chore(scraper): swap puppeteer for playwright"
```

---

### Task 2: Create rotating user-agent utility

**Files:**
- Create: `scraper/src/utils/user-agents.js`
- Create: `scraper/src/__tests__/unit/utils/user-agents.test.js`

**Step 1: Write the failing test**

Create `scraper/src/__tests__/unit/utils/user-agents.test.js`:

```javascript
import { getRandomUserAgent, USER_AGENTS } from '../../../utils/user-agents.js';

describe('user-agents', () => {
  describe('USER_AGENTS', () => {
    it('has at least 5 user agents', () => {
      expect(USER_AGENTS.length).toBeGreaterThanOrEqual(5);
    });

    it('all entries contain Chrome/', () => {
      USER_AGENTS.forEach(ua => {
        expect(ua).toContain('Chrome/');
      });
    });
  });

  describe('getRandomUserAgent', () => {
    it('returns a string from the USER_AGENTS array', () => {
      const ua = getRandomUserAgent();
      expect(USER_AGENTS).toContain(ua);
    });

    it('returns different values over multiple calls (not always the same)', () => {
      const results = new Set();
      for (let i = 0; i < 50; i++) {
        results.add(getRandomUserAgent());
      }
      expect(results.size).toBeGreaterThan(1);
    });
  });
});
```

**Step 2: Run test to verify it fails**

```bash
cd scraper && pnpm test -- --testPathPattern=user-agents
```

Expected: FAIL — module not found.

**Step 3: Write the implementation**

Create `scraper/src/utils/user-agents.js`:

```javascript
export const USER_AGENTS = [
  // Chrome 131 - Windows 10
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // Chrome 131 - macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // Chrome 131 - Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  // Chrome 130 - Windows 10
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  // Chrome 130 - macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36',
  // Chrome 129 - Windows 11
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  // Chrome 129 - Linux
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36',
  // Chrome 128 - macOS
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
];

export function getRandomUserAgent() {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}
```

**Step 4: Run test to verify it passes**

```bash
cd scraper && pnpm test -- --testPathPattern=user-agents
```

Expected: PASS (all 4 tests).

**Step 5: Commit**

```bash
git add scraper/src/utils/user-agents.js scraper/src/__tests__/unit/utils/user-agents.test.js
git commit -m "feat(scraper): add rotating user-agent utility"
```

---

### Task 3: Replace fetchDataWithBrowser with Playwright

**Files:**
- Modify: `scraper/src/utils/fetch.js`

**Step 1: Replace the implementation**

In `scraper/src/utils/fetch.js`, replace the puppeteer import and `fetchDataWithBrowser` function.

Remove:
```javascript
import puppeteer from 'puppeteer';
```

Add:
```javascript
import { chromium } from 'playwright';
import { getRandomUserAgent } from './user-agents.js';
```

Replace the entire `fetchDataWithBrowser` function with:

```javascript
export const fetchDataWithBrowser = async (url, config) => {
    let browser = null;
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
            ],
        });

        const context = await browser.newContext({
            userAgent: getRandomUserAgent(),
            viewport: { width: 1920, height: 1080 },
            locale: 'id-ID',
            timezoneId: 'Asia/Jakarta',
        });

        const page = await context.newPage();

        // Stealth: override navigator properties before any page scripts run
        await page.addInitScript(() => {
            // Hide webdriver flag
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });

            // Fake plugins (Chrome PDF Plugin, Chrome PDF Viewer, Native Client)
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                    { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
                ],
            });

            // Fake languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['id-ID', 'id', 'en-US', 'en'],
            });

            // Fake chrome.runtime to appear as real Chrome
            if (!window.chrome) {
                window.chrome = {};
            }
            window.chrome.runtime = {
                connect: () => {},
                sendMessage: () => {},
            };
        });

        // Map Puppeteer waitUntil values to Playwright equivalents
        let waitUntil = config.waitUntil || 'domcontentloaded';
        if (waitUntil === 'networkidle0' || waitUntil === 'networkidle2') {
            waitUntil = 'networkidle';
        }

        await page.goto(url, {
            waitUntil,
            timeout: 60000,
        });

        const html = await page.content();

        return loadCheerio(html);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
```

**Step 2: Run existing tests to verify nothing breaks**

```bash
cd scraper && pnpm test
```

Expected: All existing tests PASS. The fetch utility tests only test `getDomain`, `loadCheerio`, `validateUrl` — none mock puppeteer.

**Step 3: Commit**

```bash
git add scraper/src/utils/fetch.js
git commit -m "feat(scraper): replace puppeteer with playwright + stealth config"
```

---

### Task 4: Update Dockerfile

**Files:**
- Modify: `scraper/Dockerfile`

**Step 1: Rewrite Dockerfile**

Replace the entire `scraper/Dockerfile` with:

```dockerfile
FROM node:20-slim AS base

# Install dependencies for Playwright Chromium
RUN apt-get update && \
    npx playwright install --with-deps chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Development stage
FROM base AS development

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install

COPY . .

ENV NODE_ENV=development
EXPOSE 3200

CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

COPY package.json ./
RUN npm install --production

# Install Playwright Chromium browser
RUN npx playwright install chromium

COPY . .

ENV NODE_ENV=production
EXPOSE 3200

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3200/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/bin/www"]
```

**Step 2: Verify Docker build**

```bash
cd scraper && podman build --target development -t cumabaca-scraper-dev .
```

Expected: Build succeeds, Playwright Chromium installed.

**Step 3: Commit**

```bash
git add scraper/Dockerfile
git commit -m "chore(scraper): update dockerfile for playwright (node:20-slim)"
```

---

### Task 5: Manual integration test

**Step 1: Start services**

```bash
pnpm run dev:backend
```

Wait for MongoDB + backend + scraper to start.

**Step 2: Test komiku (axios path, should still work)**

```bash
curl -X POST http://localhost:3200/scrape/chapters \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://komiku.org/manga/one-piece/"}'
```

Expected: JSON response with `success: true` and chapter list.

**Step 3: Test komikcast (Playwright path)**

```bash
curl -X POST http://localhost:3200/scrape/chapters \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://v1.komikcast.fit/series/magic-emperor/"}'
```

Expected: JSON response with `success: true` and chapter list. No bot detection errors.

**Step 4: Test sektedoujin (Playwright path, NSFW)**

```bash
curl -X POST http://localhost:3200/scrape/chapters \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://sektedoujin.cc/manga/some-manga/", "mode": "secret"}'
```

Expected: JSON response with `success: true`.

**Step 5: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix(scraper): integration fixes for playwright migration"
```
