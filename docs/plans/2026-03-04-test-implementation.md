# Test Infrastructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add comprehensive test coverage (unit + integration + E2E) across all 4 workspaces of the Cuma Baca monorepo.

**Architecture:** Jest + Supertest for backend/scraper (CommonJS & ESM Node), Vitest + @testing-library/react for frontend/admin (Vite + React 19), Playwright for E2E. Each workspace gets its own test config. Root package.json gets unified test scripts.

**Tech Stack:** Jest, Supertest, Vitest, @testing-library/react, @testing-library/jest-dom, jsdom, Playwright

---

## Task 1: Root — Add Test Scripts to Root package.json

**Files:**
- Modify: `package.json`

**Step 1: Add test scripts**

Add these scripts to `package.json`:

```json
"test": "pnpm -r run test",
"test:backend": "pnpm --filter cumabaca-backend test",
"test:scraper": "pnpm --filter @cumabaca/scraper test",
"test:frontend": "pnpm --filter cumabaca-frontend test",
"test:admin": "pnpm --filter cumabaca-admin test",
"test:e2e": "pnpm --filter cumabaca-e2e test"
```

**Step 2: Add e2e to pnpm-workspace.yaml**

Add `'e2e'` to the packages list in `pnpm-workspace.yaml`.

**Step 3: Commit**

```bash
git add package.json pnpm-workspace.yaml
git commit -m "chore: add test scripts to root package.json"
```

---

## Task 2: Scraper — Install Jest & Configure

**Files:**
- Modify: `scraper/package.json`
- Create: `scraper/jest.config.js`

**Step 1: Install Jest for ESM**

```bash
cd scraper && pnpm add -D jest @jest/globals
```

**Step 2: Create Jest config**

Create `scraper/jest.config.js`:

```javascript
export default {
  testEnvironment: 'node',
  transform: {},
  extensionsToTreatAsEsm: [],
  testMatch: ['**/src/__tests__/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
};
```

Note: The scraper uses `"type": "module"` in package.json, so Jest needs the `--experimental-vm-modules` flag.

**Step 3: Update test script in package.json**

Change the test script to:

```json
"test": "node --experimental-vm-modules node_modules/.bin/jest"
```

**Step 4: Verify Jest runs (no tests yet)**

```bash
cd scraper && pnpm test
```

Expected: "No tests found" (not an error)

**Step 5: Commit**

```bash
git add scraper/package.json scraper/jest.config.js scraper/pnpm-lock.yaml
git commit -m "chore(scraper): configure Jest for ESM"
```

---

## Task 3: Scraper — Create HTML Fixtures

**Files:**
- Create: `scraper/src/__tests__/fixtures/komiku.chapter.html`
- Create: `scraper/src/__tests__/fixtures/komiku.chapter-data.html`
- Create: `scraper/src/__tests__/fixtures/sektedoujin.chapter.html`
- Create: `scraper/src/__tests__/fixtures/sektedoujin.chapter-data.html`
- Copy: `examples/komikcast.chapter.html` → `scraper/src/__tests__/fixtures/komikcast.chapter.html`
- Copy: `examples/komikcast.chapter-data.html` → `scraper/src/__tests__/fixtures/komikcast.chapter-data.html`

**Step 1: Create fixture directories**

```bash
mkdir -p scraper/src/__tests__/fixtures
```

**Step 2: Copy existing Komikcast fixtures**

```bash
cp examples/komikcast.chapter.html scraper/src/__tests__/fixtures/
cp examples/komikcast.chapter-data.html scraper/src/__tests__/fixtures/
```

**Step 3: Create minimal Komiku chapter list fixture**

Create `scraper/src/__tests__/fixtures/komiku.chapter.html`:

```html
<html><body>
<div class="judulseries">
  <a href="/ch/manga-title/chapter-3/">
    <span itemprop="name">Chapter 3</span>
  </a>
</div>
<div class="judulseries">
  <a href="/ch/manga-title/chapter-2/">
    <span itemprop="name">Chapter 2</span>
  </a>
</div>
<div class="judulseries">
  <a href="/ch/manga-title/chapter-1/">
    <span itemprop="name">Chapter 1</span>
  </a>
</div>
<!-- Edge case: no href -->
<div class="judulseries">
  <a>
    <span itemprop="name">Broken Link</span>
  </a>
</div>
</body></html>
```

**Step 4: Create minimal Komiku chapter data fixture**

Create `scraper/src/__tests__/fixtures/komiku.chapter-data.html`:

```html
<html><body>
<div id="Judul"><h1>  Manga Title Chapter 3  </h1></div>
<div id="Baca_Komik">
  <img src="https://cdn.example.com/page1.jpg" />
  <img src="https://cdn.example.com/page2.jpg" />
  <img src="https://cdn.example.com/page3.jpg" />
</div>
</body></html>
```

**Step 5: Create minimal Sektedoujin chapter list fixture**

Create `scraper/src/__tests__/fixtures/sektedoujin.chapter.html`:

```html
<html><body>
<ul id="chapterlist">
  <li>
    <a href="https://sektedoujin.cc/manga-title-chapter-3/">
      <span class="chapternum">Chapter 3</span>
    </a>
  </li>
  <li>
    <a href="https://sektedoujin.cc/manga-title-chapter-2/">
      <span class="chapternum">Chapter 2</span>
    </a>
  </li>
  <li>
    <a href="https://sektedoujin.cc/manga-title-chapter-1/">
      <span class="chapternum">Chapter 1</span>
    </a>
  </li>
  <!-- Edge case: missing href -->
  <li><a><span class="chapternum">No Link</span></a></li>
</ul>
</body></html>
```

**Step 6: Create minimal Sektedoujin chapter data fixture**

Create `scraper/src/__tests__/fixtures/sektedoujin.chapter-data.html`:

```html
<html><body>
<h1 class="entry-title">  Manga Title Chapter 3  </h1>
<div id="readerarea">
  <img data-src="https://cdn.example.com/lazy1.jpg" src="placeholder.gif" />
  <img data-src="https://cdn.example.com/lazy2.jpg" src="placeholder.gif" />
  <img src="https://cdn.example.com/direct3.jpg" />
</div>
</body></html>
```

**Step 7: Commit**

```bash
git add scraper/src/__tests__/fixtures/
git commit -m "test(scraper): add HTML fixtures for all scrapers"
```

---

## Task 4: Scraper — Test KomikuScraper

**Files:**
- Create: `scraper/src/__tests__/unit/scrapers/komiku.test.js`

**Step 1: Write the test**

```javascript
import { jest } from '@jest/globals';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { KomikuScraper } from '../../../scrapers/komiku.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', '..', 'fixtures');

function loadFixture(name) {
  const html = fs.readFileSync(path.join(FIXTURES, name), 'utf8');
  return cheerio.load(html);
}

describe('KomikuScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new KomikuScraper();
  });

  describe('getSelectors', () => {
    it('returns expected CSS selectors', () => {
      const selectors = scraper.getSelectors();
      expect(selectors.chapterList).toBe('.judulseries');
      expect(selectors.chapterName).toBe('[itemprop="name"]');
      expect(selectors.chapterTitle).toBe('#Judul h1');
      expect(selectors.images).toBe('#Baca_Komik img');
    });
  });

  describe('getChapters', () => {
    it('extracts chapters from fixture HTML', () => {
      const $ = loadFixture('komiku.chapter.html');
      const chapters = scraper.getChapters($, 'https://komiku.org');

      // Should skip the entry without href (4 entries, 3 valid)
      expect(chapters).toHaveLength(3);
      expect(chapters[0]).toEqual({
        chapter: 'Chapter 3',
        url: 'https://komiku.org/ch/manga-title/chapter-3/',
      });
      expect(chapters[2]).toEqual({
        chapter: 'Chapter 1',
        url: 'https://komiku.org/ch/manga-title/chapter-1/',
      });
    });

    it('returns empty array for HTML with no matching selectors', () => {
      const $ = cheerio.load('<html><body><p>No chapters here</p></body></html>');
      const chapters = scraper.getChapters($, 'https://komiku.org');
      expect(chapters).toEqual([]);
    });

    it('skips entries with missing href', () => {
      const $ = loadFixture('komiku.chapter.html');
      const chapters = scraper.getChapters($, 'https://komiku.org');
      const urls = chapters.map(c => c.url);
      // None should be "https://komiku.orgundefined"
      urls.forEach(url => {
        expect(url).not.toContain('undefined');
      });
    });

    it('handles unicode characters in chapter names', () => {
      const $ = cheerio.load(`
        <div class="judulseries">
          <a href="/ch/test/">
            <span itemprop="name">チャプター 1 — 始まり</span>
          </a>
        </div>
      `);
      const chapters = scraper.getChapters($, 'https://komiku.org');
      expect(chapters[0].chapter).toBe('チャプター 1 — 始まり');
    });
  });

  describe('getChapterData', () => {
    it('extracts title and images from fixture HTML', () => {
      const $ = loadFixture('komiku.chapter-data.html');
      const data = scraper.getChapterData($);

      expect(data.title).toBe('Manga Title Chapter 3');
      expect(data.data).toHaveLength(3);
      expect(data.data[0]).toBe('https://cdn.example.com/page1.jpg');
      expect(data.data[2]).toBe('https://cdn.example.com/page3.jpg');
    });

    it('returns empty title and data for HTML with no matching selectors', () => {
      const $ = cheerio.load('<html><body><p>Empty</p></body></html>');
      const data = scraper.getChapterData($);

      expect(data.title).toBe('');
      expect(data.data).toEqual([]);
    });
  });
});
```

**Step 2: Run test to verify it passes**

```bash
cd scraper && pnpm test -- --testPathPattern=komiku
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add scraper/src/__tests__/unit/scrapers/komiku.test.js
git commit -m "test(scraper): add KomikuScraper unit tests"
```

---

## Task 5: Scraper — Test KomikcastScraper

**Files:**
- Create: `scraper/src/__tests__/unit/scrapers/komikcast.test.js`

**Step 1: Write the test**

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { KomikcastScraper } from '../../../scrapers/komikcast.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', '..', 'fixtures');

function loadFixture(name) {
  const html = fs.readFileSync(path.join(FIXTURES, name), 'utf8');
  return cheerio.load(html);
}

describe('KomikcastScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new KomikcastScraper();
  });

  describe('getChapters', () => {
    it('extracts chapters from real fixture HTML', () => {
      const $ = loadFixture('komikcast.chapter.html');
      const chapters = scraper.getChapters($, 'https://v1.komikcast.fit');

      expect(chapters.length).toBeGreaterThan(0);
      chapters.forEach(ch => {
        expect(ch).toHaveProperty('chapter');
        expect(ch).toHaveProperty('url');
        expect(ch.chapter).not.toBe('');
        expect(ch.url).toMatch(/^https:\/\/v1\.komikcast\.fit/);
      });
    });

    it('skips entries with empty chapter names', () => {
      const $ = cheerio.load(`
        <a href="/chapter/1"><span class="font-semibold">Chapter 1</span></a>
        <a href="/chapter/2"><span class="font-semibold">   </span></a>
        <a href="/chapter/3"><span class="font-semibold">Chapter 3</span></a>
      `);
      const chapters = scraper.getChapters($, 'https://v1.komikcast.fit');
      expect(chapters).toHaveLength(2);
      expect(chapters[0].chapter).toBe('Chapter 1');
      expect(chapters[1].chapter).toBe('Chapter 3');
    });

    it('returns empty array for HTML with no chapter links', () => {
      const $ = cheerio.load('<html><body><p>No chapters</p></body></html>');
      const chapters = scraper.getChapters($, 'https://v1.komikcast.fit');
      expect(chapters).toEqual([]);
    });
  });

  describe('getChapterData', () => {
    it('derives title from URL pattern', () => {
      const $ = cheerio.load(`
        <div class="chapter-scrollbar">
          <img alt="Page 1" src="https://cdn.example.com/p1.jpg" />
        </div>
      `);
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/series/magic-emperor/chapter/817');

      expect(data.title).toBe('Magic Emperor Chapter 817');
    });

    it('returns empty title when URL does not match pattern', () => {
      const $ = cheerio.load(`
        <div class="chapter-scrollbar">
          <img alt="Page 1" src="https://cdn.example.com/p1.jpg" />
        </div>
      `);
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/some-other-path');

      expect(data.title).toBe('');
    });

    it('only extracts images with alt starting with "Page"', () => {
      const $ = cheerio.load(`
        <div class="chapter-scrollbar">
          <img alt="Page 1" src="https://cdn.example.com/p1.jpg" />
          <img alt="Advertisement" src="https://ads.example.com/ad.jpg" />
          <img alt="Page 2" src="https://cdn.example.com/p2.jpg" />
          <img alt="Logo" src="https://cdn.example.com/logo.png" />
        </div>
      `);
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/series/test/chapter/1');

      expect(data.data).toHaveLength(2);
      expect(data.data[0]).toBe('/komik/image?url=https://cdn.example.com/p1.jpg');
      expect(data.data[1]).toBe('/komik/image?url=https://cdn.example.com/p2.jpg');
    });

    it('wraps image URLs with proxy prefix', () => {
      const $ = cheerio.load(`
        <div class="chapter-scrollbar">
          <img alt="Page 1" src="https://cdn.example.com/img.jpg" />
        </div>
      `);
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/series/test/chapter/1');
      expect(data.data[0]).toStartWith('/komik/image?url=');
    });

    it('extracts from real fixture HTML', () => {
      const $ = loadFixture('komikcast.chapter-data.html');
      const data = scraper.getChapterData($, 'https://v1.komikcast.fit/series/test-manga/chapter/1');

      expect(data).toHaveProperty('title');
      expect(data).toHaveProperty('data');
      expect(Array.isArray(data.data)).toBe(true);
    });
  });
});
```

Note: The `toStartWith` matcher may not exist in Jest by default. If it fails, replace with `expect(data.data[0].startsWith('/komik/image?url=')).toBe(true)`.

**Step 2: Run test**

```bash
cd scraper && pnpm test -- --testPathPattern=komikcast
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add scraper/src/__tests__/unit/scrapers/komikcast.test.js
git commit -m "test(scraper): add KomikcastScraper unit tests"
```

---

## Task 6: Scraper — Test SektedoujinScraper

**Files:**
- Create: `scraper/src/__tests__/unit/scrapers/sektedoujin.test.js`

**Step 1: Write the test**

```javascript
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import * as cheerio from 'cheerio';
import { SektedoujinScraper } from '../../../scrapers/sektedoujin.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES = path.join(__dirname, '..', '..', 'fixtures');

function loadFixture(name) {
  const html = fs.readFileSync(path.join(FIXTURES, name), 'utf8');
  return cheerio.load(html);
}

describe('SektedoujinScraper', () => {
  let scraper;

  beforeEach(() => {
    scraper = new SektedoujinScraper();
  });

  describe('getChapters', () => {
    it('extracts chapters with absolute URLs (no domain prepending)', () => {
      const $ = loadFixture('sektedoujin.chapter.html');
      const chapters = scraper.getChapters($, 'https://sektedoujin.cc');

      // 4 entries, 3 valid (one missing href)
      expect(chapters).toHaveLength(3);
      // Absolute URLs — should NOT have domain prepended
      expect(chapters[0].url).toBe('https://sektedoujin.cc/manga-title-chapter-3/');
      expect(chapters[0].chapter).toBe('Chapter 3');
    });

    it('skips entries with missing href', () => {
      const $ = loadFixture('sektedoujin.chapter.html');
      const chapters = scraper.getChapters($, 'https://sektedoujin.cc');
      chapters.forEach(ch => {
        expect(ch.url).toBeTruthy();
        expect(ch.url).not.toContain('undefined');
      });
    });

    it('returns empty array for HTML without #chapterlist', () => {
      const $ = cheerio.load('<html><body><p>Empty</p></body></html>');
      const chapters = scraper.getChapters($, 'https://sektedoujin.cc');
      expect(chapters).toEqual([]);
    });
  });

  describe('getChapterData', () => {
    it('extracts title and images with lazy loading support', () => {
      const $ = loadFixture('sektedoujin.chapter-data.html');
      const data = scraper.getChapterData($);

      expect(data.title).toBe('Manga Title Chapter 3');
      expect(data.data).toHaveLength(3);
      // Should prioritize data-src over src
      expect(data.data[0]).toBe('/komik/image?url=https://cdn.example.com/lazy1.jpg');
      expect(data.data[1]).toBe('/komik/image?url=https://cdn.example.com/lazy2.jpg');
      // Falls back to src when no data-src
      expect(data.data[2]).toBe('/komik/image?url=https://cdn.example.com/direct3.jpg');
    });

    it('wraps all images with proxy prefix', () => {
      const $ = loadFixture('sektedoujin.chapter-data.html');
      const data = scraper.getChapterData($);
      data.data.forEach(url => {
        expect(url.startsWith('/komik/image?url=')).toBe(true);
      });
    });

    it('returns empty data for HTML with no #readerarea', () => {
      const $ = cheerio.load('<html><body><p>Empty</p></body></html>');
      const data = scraper.getChapterData($);
      expect(data.title).toBe('');
      expect(data.data).toEqual([]);
    });
  });
});
```

**Step 2: Run test**

```bash
cd scraper && pnpm test -- --testPathPattern=sektedoujin
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add scraper/src/__tests__/unit/scrapers/sektedoujin.test.js
git commit -m "test(scraper): add SektedoujinScraper unit tests"
```

---

## Task 7: Scraper — Test scrapers/index.js (Domain Routing)

**Files:**
- Create: `scraper/src/__tests__/unit/scrapers/index.test.js`

**Step 1: Write the test**

```javascript
import { getScraperForDomain, getWebsiteConfig, getScraper, scrapers } from '../../../scrapers/index.js';
import { KomikuScraper } from '../../../scrapers/komiku.js';
import { KomikcastScraper } from '../../../scrapers/komikcast.js';
import { SektedoujinScraper } from '../../../scrapers/sektedoujin.js';

describe('scrapers/index', () => {
  describe('getScraperForDomain', () => {
    it('returns KomikuScraper for komiku.org URL', () => {
      const scraper = getScraperForDomain('https://komiku.org/manga/test');
      expect(scraper).toBeInstanceOf(KomikuScraper);
    });

    it('returns KomikcastScraper for v1.komikcast.fit URL', () => {
      const scraper = getScraperForDomain('https://v1.komikcast.fit/series/test');
      expect(scraper).toBeInstanceOf(KomikcastScraper);
    });

    it('returns SektedoujinScraper for sektedoujin.cc URL', () => {
      const scraper = getScraperForDomain('https://sektedoujin.cc/manga/test');
      expect(scraper).toBeInstanceOf(SektedoujinScraper);
    });

    it('handles URL with port number', () => {
      const scraper = getScraperForDomain('https://komiku.org:443/manga');
      expect(scraper).toBeInstanceOf(KomikuScraper);
    });

    it('handles subdomain matching', () => {
      const scraper = getScraperForDomain('https://www.komiku.org/manga');
      expect(scraper).toBeInstanceOf(KomikuScraper);
    });

    it('falls back to regex for non-URL input', () => {
      const scraper = getScraperForDomain('komiku.org/manga/test');
      expect(scraper).toBeInstanceOf(KomikuScraper);
    });

    it('throws for unsupported domain', () => {
      expect(() => getScraperForDomain('https://unknown-site.com'))
        .toThrow('No scraper found for domain');
    });

    it('throws for completely invalid string', () => {
      expect(() => getScraperForDomain('not-a-url'))
        .toThrow('No scraper found for domain');
    });
  });

  describe('getWebsiteConfig', () => {
    it('returns config with nsfw flag for sektedoujin.cc', () => {
      const config = getWebsiteConfig('https://sektedoujin.cc/test');
      expect(config.nsfw).toBe(true);
      expect(config.name).toBe('Sektedoujin');
    });

    it('returns config with useBrowser for komikcast', () => {
      const config = getWebsiteConfig('https://v1.komikcast.fit/test');
      expect(config.useBrowser).toBe(true);
    });

    it('returns config without useBrowser for komiku', () => {
      const config = getWebsiteConfig('https://komiku.org/test');
      expect(config.useBrowser).toBeUndefined();
    });

    it('throws for unsupported domain', () => {
      expect(() => getWebsiteConfig('https://unknown.com'))
        .toThrow('No website config found for domain');
    });
  });

  describe('getScraper', () => {
    it('returns scraper by key', () => {
      expect(getScraper('komiku')).toBeInstanceOf(KomikuScraper);
      expect(getScraper('komikcast')).toBeInstanceOf(KomikcastScraper);
      expect(getScraper('sektedoujin')).toBeInstanceOf(SektedoujinScraper);
    });

    it('throws for unknown key', () => {
      expect(() => getScraper('nonexistent')).toThrow('No scraper found for website');
    });
  });
});
```

**Step 2: Run test**

```bash
cd scraper && pnpm test -- --testPathPattern=index
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add scraper/src/__tests__/unit/scrapers/index.test.js
git commit -m "test(scraper): add domain routing unit tests"
```

---

## Task 8: Scraper — Test utils/fetch.js

**Files:**
- Create: `scraper/src/__tests__/unit/utils/fetch.test.js`

**Step 1: Write the test**

```javascript
import { jest } from '@jest/globals';

// Mock axios and puppeteer before importing fetch utils
const mockAxios = jest.fn();
jest.unstable_mockModule('axios', () => ({ default: mockAxios }));

const mockPage = {
  goto: jest.fn(),
  content: jest.fn(),
};
const mockBrowser = {
  newPage: jest.fn().mockResolvedValue(mockPage),
  close: jest.fn(),
};
jest.unstable_mockModule('puppeteer', () => ({
  default: { launch: jest.fn().mockResolvedValue(mockBrowser) },
}));

const { getDomain, loadCheerio, fetchData, validateUrl, fetchDataWithBrowser } =
  await import('../../../utils/fetch.js');
const puppeteer = (await import('puppeteer')).default;

describe('fetch utils', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDomain', () => {
    it('returns origin for valid URL', () => {
      expect(getDomain('https://komiku.org/manga/test')).toBe('https://komiku.org');
    });

    it('returns origin with port', () => {
      expect(getDomain('http://localhost:3200/test')).toBe('http://localhost:3200');
    });

    it('returns null for invalid URL', () => {
      expect(getDomain('not-a-url')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(getDomain('')).toBeNull();
    });
  });

  describe('loadCheerio', () => {
    it('loads HTML into cheerio and removes whitespace chars', () => {
      const $ = loadCheerio('<div>\t\n\rHello\t\n\r</div>');
      expect($('div').text()).toBe('Hello');
    });

    it('handles clean HTML', () => {
      const $ = loadCheerio('<p>Test</p>');
      expect($('p').text()).toBe('Test');
    });
  });

  describe('validateUrl', () => {
    it('returns domain for valid URL', () => {
      const domain = validateUrl('https://komiku.org/manga');
      expect(domain).toBe('https://komiku.org');
    });

    it('throws for invalid URL', () => {
      expect(() => validateUrl('not-a-url')).toThrow('Invalid URL');
    });
  });

  describe('fetchData', () => {
    it('fetches URL and returns cheerio instance', async () => {
      mockAxios.mockResolvedValue({ data: '<p>Hello</p>' });

      const $ = await fetchData('https://example.com');
      expect($('p').text()).toBe('Hello');
      expect(mockAxios).toHaveBeenCalledWith('https://example.com');
    });

    it('throws when response has no data', async () => {
      mockAxios.mockResolvedValue({ data: '' });

      // loadCheerio handles empty string, but falsy data should throw
      mockAxios.mockResolvedValue({ data: null });
      await expect(fetchData('https://example.com')).rejects.toThrow();
    });

    it('propagates axios errors', async () => {
      mockAxios.mockRejectedValue(new Error('Network timeout'));
      await expect(fetchData('https://example.com')).rejects.toThrow('Network timeout');
    });
  });

  describe('fetchDataWithBrowser', () => {
    it('launches browser, navigates, and returns cheerio', async () => {
      mockPage.content.mockResolvedValue('<div>Rendered</div>');

      const $ = await fetchDataWithBrowser('https://example.com', {});
      expect($('div').text()).toBe('Rendered');
      expect(puppeteer.launch).toHaveBeenCalled();
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
        timeout: 60000,
      }));
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('uses config.waitUntil when provided', async () => {
      mockPage.content.mockResolvedValue('<div>Test</div>');

      await fetchDataWithBrowser('https://example.com', { waitUntil: 'networkidle0' });
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
        waitUntil: 'networkidle0',
      }));
    });

    it('defaults to domcontentloaded when no waitUntil config', async () => {
      mockPage.content.mockResolvedValue('<div>Test</div>');

      await fetchDataWithBrowser('https://example.com', {});
      expect(mockPage.goto).toHaveBeenCalledWith('https://example.com', expect.objectContaining({
        waitUntil: 'domcontentloaded',
      }));
    });

    it('closes browser even when navigation fails', async () => {
      mockPage.goto.mockRejectedValue(new Error('Page timeout'));

      await expect(fetchDataWithBrowser('https://example.com', {})).rejects.toThrow('Page timeout');
      expect(mockBrowser.close).toHaveBeenCalled();
    });

    it('closes browser even when content extraction fails', async () => {
      mockPage.content.mockRejectedValue(new Error('Content error'));

      await expect(fetchDataWithBrowser('https://example.com', {})).rejects.toThrow('Content error');
      expect(mockBrowser.close).toHaveBeenCalled();
    });
  });
});
```

**Step 2: Run test**

```bash
cd scraper && pnpm test -- --testPathPattern=fetch
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add scraper/src/__tests__/unit/utils/fetch.test.js
git commit -m "test(scraper): add fetch utils unit tests"
```

---

## Task 9: Scraper — Test utils/mongodb-cache.js

**Files:**
- Create: `scraper/src/__tests__/unit/utils/mongodb-cache.test.js`

**Step 1: Write the test**

```javascript
import { jest } from '@jest/globals';

// Mock mongodb
const mockCollection = {
  createIndex: jest.fn().mockResolvedValue(undefined),
  findOne: jest.fn(),
  updateOne: jest.fn().mockResolvedValue({ acknowledged: true }),
  countDocuments: jest.fn(),
  deleteMany: jest.fn().mockResolvedValue({ deletedCount: 5 }),
};
const mockDb = {
  collection: jest.fn().mockReturnValue(mockCollection),
};
const mockClient = {
  connect: jest.fn().mockResolvedValue(undefined),
  db: jest.fn().mockReturnValue(mockDb),
  close: jest.fn().mockResolvedValue(undefined),
};

jest.unstable_mockModule('mongodb', () => ({
  MongoClient: jest.fn().mockImplementation(() => mockClient),
}));

// Import after mocking
const {
  connectDatabase,
  getScraperCache,
  setScraperCache,
  getScraperCacheStats,
  clearScraperCache,
  closeDatabase,
} = await import('../../../utils/mongodb-cache.js');

describe('scraper mongodb-cache', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('connectDatabase', () => {
    it('creates indexes on first connection', async () => {
      await connectDatabase();
      expect(mockClient.connect).toHaveBeenCalled();
      expect(mockCollection.createIndex).toHaveBeenCalledTimes(2);
    });
  });

  describe('getScraperCache', () => {
    it('returns cached data when found and not expired', async () => {
      const futureDate = new Date(Date.now() + 100000);
      mockCollection.findOne.mockResolvedValue({
        key: 'https://test.com|normal',
        data: [{ chapter: 'Ch 1' }],
        scrapeTime: 500,
        expiresAt: futureDate,
      });

      const result = await getScraperCache('https://test.com', 'normal');
      expect(result).toEqual({
        data: [{ chapter: 'Ch 1' }],
        scrapeTime: 500,
        cached: true,
      });
    });

    it('returns null for cache miss', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      const result = await getScraperCache('https://test.com', 'normal');
      expect(result).toBeNull();
    });

    it('returns null for expired entry', async () => {
      const pastDate = new Date(Date.now() - 100000);
      mockCollection.findOne.mockResolvedValue({
        key: 'https://test.com|normal',
        data: [],
        expiresAt: pastDate,
      });

      const result = await getScraperCache('https://test.com', 'normal');
      expect(result).toBeNull();
    });

    it('generates correct cache key with mode', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      await getScraperCache('https://test.com', 'secret');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ key: 'https://test.com|secret' });
    });

    it('defaults mode to normal', async () => {
      mockCollection.findOne.mockResolvedValue(null);
      await getScraperCache('https://test.com', undefined);
      expect(mockCollection.findOne).toHaveBeenCalledWith({ key: 'https://test.com|normal' });
    });
  });

  describe('setScraperCache', () => {
    it('upserts cache entry with TTL', async () => {
      await setScraperCache('https://test.com', 'normal', { chapters: [] }, 100);

      expect(mockCollection.updateOne).toHaveBeenCalledWith(
        { key: 'https://test.com|normal' },
        expect.objectContaining({
          $set: expect.objectContaining({
            key: 'https://test.com|normal',
            url: 'https://test.com',
            mode: 'normal',
            data: { chapters: [] },
            scrapeTime: 100,
          }),
        }),
        { upsert: true }
      );
    });
  });

  describe('getScraperCacheStats', () => {
    it('returns total and expired counts', async () => {
      mockCollection.countDocuments
        .mockResolvedValueOnce(10)   // total
        .mockResolvedValueOnce(3);   // expired

      const stats = await getScraperCacheStats();
      expect(stats).toEqual({
        total: 10,
        active: 7,
        expired: 3,
        ttl: 172800,
      });
    });
  });

  describe('clearScraperCache', () => {
    it('deletes all entries and returns count', async () => {
      const count = await clearScraperCache();
      expect(count).toBe(5);
      expect(mockCollection.deleteMany).toHaveBeenCalledWith({});
    });
  });
});
```

**Step 2: Run test**

```bash
cd scraper && pnpm test -- --testPathPattern=mongodb-cache
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add scraper/src/__tests__/unit/utils/mongodb-cache.test.js
git commit -m "test(scraper): add mongodb-cache unit tests"
```

---

## Task 10: Scraper — Test scrapeController.js

**Files:**
- Create: `scraper/src/__tests__/unit/controllers/scrapeController.test.js`

**Step 1: Write the test**

```javascript
import { jest } from '@jest/globals';
import * as cheerio from 'cheerio';

// Mock dependencies
const mockGetScraperCache = jest.fn();
const mockSetScraperCache = jest.fn();
const mockGetScraperCacheStats = jest.fn();
const mockClearScraperCache = jest.fn();
jest.unstable_mockModule('../../../utils/mongodb-cache.js', () => ({
  getScraperCache: mockGetScraperCache,
  setScraperCache: mockSetScraperCache,
  getScraperCacheStats: mockGetScraperCacheStats,
  clearScraperCache: mockClearScraperCache,
}));

const mockFetchData = jest.fn();
const mockFetchDataWithBrowser = jest.fn();
jest.unstable_mockModule('../../../utils/fetch.js', () => ({
  fetchData: mockFetchData,
  fetchDataWithBrowser: mockFetchDataWithBrowser,
}));

const mockScraper = {
  getChapters: jest.fn(),
  getChapterData: jest.fn(),
};
const mockGetScraperForDomain = jest.fn().mockReturnValue(mockScraper);
const mockGetWebsiteConfig = jest.fn();
jest.unstable_mockModule('../../../scrapers/index.js', () => ({
  getScraperForDomain: mockGetScraperForDomain,
  getWebsiteConfig: mockGetWebsiteConfig,
}));

const { scrapeChapters, scrapeData, getCacheStats, clearCache } =
  await import('../../../controllers/scrapeController.js');

// Test helpers
function mockReq(body = {}) {
  return { body };
}
function mockRes() {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  };
  return res;
}

describe('scrapeController', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('scrapeChapters', () => {
    it('returns 400 when URL is missing', async () => {
      const req = mockReq({});
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'URL is required' }));
    });

    it('returns cached data on cache hit', async () => {
      mockGetScraperCache.mockResolvedValue({
        data: [{ chapter: 'Ch 1' }],
        scrapeTime: 100,
        cached: true,
      });

      const req = mockReq({ url: 'https://komiku.org/manga/test' });
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        cached: true,
        data: [{ chapter: 'Ch 1' }],
      }));
    });

    it('returns 400 for unsupported website', async () => {
      mockGetScraperCache.mockResolvedValue(null);
      mockGetWebsiteConfig.mockReturnValue(null);

      const req = mockReq({ url: 'https://unknown.com/manga' });
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 403 for NSFW content without secret mode', async () => {
      mockGetScraperCache.mockResolvedValue(null);
      mockGetWebsiteConfig.mockReturnValue({ nsfw: true, name: 'NSFW Site' });

      const req = mockReq({ url: 'https://sektedoujin.cc/test', mode: 'normal' });
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(403);
    });

    it('allows NSFW content with secret mode', async () => {
      mockGetScraperCache.mockResolvedValue(null);
      mockGetWebsiteConfig.mockReturnValue({ nsfw: true, name: 'NSFW Site' });
      const $ = cheerio.load('<html></html>');
      mockFetchData.mockResolvedValue($);
      mockScraper.getChapters.mockReturnValue([{ chapter: 'Ch 1', url: 'test' }]);

      const req = mockReq({ url: 'https://sektedoujin.cc/test', mode: 'secret' });
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());

      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
    });

    it('uses fetchDataWithBrowser when config.useBrowser is true', async () => {
      mockGetScraperCache.mockResolvedValue(null);
      mockGetWebsiteConfig.mockReturnValue({ useBrowser: true, name: 'Test' });
      const $ = cheerio.load('<html></html>');
      mockFetchDataWithBrowser.mockResolvedValue($);
      mockScraper.getChapters.mockReturnValue([]);

      const req = mockReq({ url: 'https://test.com/manga' });
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());

      expect(mockFetchDataWithBrowser).toHaveBeenCalled();
      expect(mockFetchData).not.toHaveBeenCalled();
    });

    it('uses fetchData when config.useBrowser is falsy', async () => {
      mockGetScraperCache.mockResolvedValue(null);
      mockGetWebsiteConfig.mockReturnValue({ name: 'Test' });
      const $ = cheerio.load('<html></html>');
      mockFetchData.mockResolvedValue($);
      mockScraper.getChapters.mockReturnValue([]);

      const req = mockReq({ url: 'https://test.com/manga' });
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());

      expect(mockFetchData).toHaveBeenCalled();
      expect(mockFetchDataWithBrowser).not.toHaveBeenCalled();
    });

    it('caches result after successful scrape', async () => {
      mockGetScraperCache.mockResolvedValue(null);
      mockGetWebsiteConfig.mockReturnValue({ name: 'Test' });
      const $ = cheerio.load('<html></html>');
      mockFetchData.mockResolvedValue($);
      mockScraper.getChapters.mockReturnValue([{ chapter: 'Ch 1' }]);

      const req = mockReq({ url: 'https://test.com/manga' });
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());

      expect(mockSetScraperCache).toHaveBeenCalledWith(
        'https://test.com/manga',
        'normal',
        [{ chapter: 'Ch 1' }],
        expect.any(Number)
      );
    });

    it('returns 500 when fetch returns null', async () => {
      mockGetScraperCache.mockResolvedValue(null);
      mockGetWebsiteConfig.mockReturnValue({ name: 'Test' });
      mockFetchData.mockResolvedValue(null);

      const req = mockReq({ url: 'https://test.com/manga' });
      const res = mockRes();
      await scrapeChapters(req, res, jest.fn());

      expect(res.status).toHaveBeenCalledWith(500);
    });

    it('calls next(error) on unexpected error', async () => {
      mockGetScraperCache.mockRejectedValue(new Error('DB error'));

      const req = mockReq({ url: 'https://test.com/manga' });
      const res = mockRes();
      const next = jest.fn();
      await scrapeChapters(req, res, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('getCacheStats', () => {
    it('returns stats on success', async () => {
      mockGetScraperCacheStats.mockResolvedValue({ total: 10, active: 7, expired: 3 });

      const req = mockReq();
      const res = mockRes();
      await getCacheStats(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, stats: { total: 10, active: 7, expired: 3 } });
    });
  });

  describe('clearCache', () => {
    it('returns deleted count on success', async () => {
      mockClearScraperCache.mockResolvedValue(5);

      const req = mockReq();
      const res = mockRes();
      await clearCache(req, res);

      expect(res.json).toHaveBeenCalledWith({ success: true, deleted: 5 });
    });
  });
});
```

**Step 2: Run test**

```bash
cd scraper && pnpm test -- --testPathPattern=scrapeController
```

Expected: All tests PASS

**Step 3: Run all scraper tests**

```bash
cd scraper && pnpm test
```

Expected: All scraper tests PASS

**Step 4: Commit**

```bash
git add scraper/src/__tests__/unit/controllers/scrapeController.test.js
git commit -m "test(scraper): add scrapeController unit tests"
```

---

## Task 11: Backend — Install Jest + Supertest & Configure

**Files:**
- Modify: `backend/package.json`
- Create: `backend/jest.config.js`

**Step 1: Install dependencies**

```bash
cd backend && pnpm add -D jest supertest
```

**Step 2: Create Jest config**

Create `backend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  moduleFileExtensions: ['js', 'json'],
};
```

**Step 3: Add test script to backend/package.json**

Add to scripts:

```json
"test": "jest"
```

**Step 4: Verify Jest runs**

```bash
cd backend && pnpm test
```

Expected: "No tests found"

**Step 5: Commit**

```bash
git add backend/package.json backend/jest.config.js
git commit -m "chore(backend): configure Jest + Supertest"
```

---

## Task 12: Backend — Test asyncHandler

**Files:**
- Create: `backend/__tests__/unit/utils/asyncHandler.test.js`

**Step 1: Write the test**

```javascript
const asyncHandler = require('../../../utils/asyncHandler');

describe('asyncHandler', () => {
  it('calls the wrapped function with req, res, next', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    const req = {}, res = {}, next = jest.fn();

    await handler(req, res, next);
    expect(fn).toHaveBeenCalledWith(req, res, next);
  });

  it('passes async errors to next()', async () => {
    const error = new Error('Async failure');
    const fn = jest.fn().mockRejectedValue(error);
    const handler = asyncHandler(fn);
    const next = jest.fn();

    await handler({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('passes sync errors thrown in async fn to next()', async () => {
    const error = new Error('Sync throw');
    const fn = jest.fn().mockImplementation(async () => { throw error; });
    const handler = asyncHandler(fn);
    const next = jest.fn();

    await handler({}, {}, next);
    expect(next).toHaveBeenCalledWith(error);
  });

  it('does not call next when handler succeeds', async () => {
    const fn = jest.fn().mockResolvedValue(undefined);
    const handler = asyncHandler(fn);
    const next = jest.fn();

    await handler({}, {}, next);
    expect(next).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test**

```bash
cd backend && pnpm test -- --testPathPattern=asyncHandler
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add backend/__tests__/unit/utils/asyncHandler.test.js
git commit -m "test(backend): add asyncHandler unit tests"
```

---

## Task 13: Backend — Test auth middleware

**Files:**
- Create: `backend/__tests__/unit/middleware/auth.test.js`

**Step 1: Write the test**

```javascript
const jwt = require('jsonwebtoken');
const { requireAuth } = require('../../../middleware/auth');

// Mock jwt
jest.mock('jsonwebtoken');

describe('requireAuth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  it('returns 401 when no token in cookies', () => {
    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Not authenticated' });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 with "Token expired" for expired token', () => {
    req.cookies.admin_token = 'expired-token';
    const error = new Error('jwt expired');
    error.name = 'TokenExpiredError';
    jwt.verify.mockImplementation(() => { throw error; });

    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
  });

  it('returns 401 with "Invalid token" for malformed token', () => {
    req.cookies.admin_token = 'bad-token';
    const error = new Error('invalid token');
    error.name = 'JsonWebTokenError';
    jwt.verify.mockImplementation(() => { throw error; });

    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
  });

  it('returns 500 for unexpected errors', () => {
    req.cookies.admin_token = 'some-token';
    jwt.verify.mockImplementation(() => { throw new Error('unexpected'); });

    requireAuth(req, res, next);
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it('sets req.user and calls next() for valid token', () => {
    req.cookies.admin_token = 'valid-token';
    const decoded = { id: 1, username: 'admin', iat: 123, exp: 999 };
    jwt.verify.mockReturnValue(decoded);

    requireAuth(req, res, next);
    expect(req.user).toEqual(decoded);
    expect(next).toHaveBeenCalled();
    expect(res.status).not.toHaveBeenCalled();
  });
});
```

**Step 2: Run test**

```bash
cd backend && pnpm test -- --testPathPattern=auth
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add backend/__tests__/unit/middleware/auth.test.js
git commit -m "test(backend): add auth middleware unit tests"
```

---

## Task 14: Backend — Test AdminUser model

**Files:**
- Create: `backend/__tests__/unit/models/AdminUser.test.js`

**Step 1: Write the test**

```javascript
const bcrypt = require('bcrypt');

// Mock sqlite
jest.mock('../../../config/sqlite', () => {
  const mockDb = {
    run: jest.fn(),
    exec: jest.fn(),
  };
  return {
    getDb: jest.fn().mockResolvedValue(mockDb),
    save: jest.fn(),
    __mockDb: mockDb,
  };
});

jest.mock('bcrypt');

const AdminUser = require('../../../models/AdminUser');
const sqlite = require('../../../config/sqlite');

describe('AdminUser', () => {
  let mockDb;

  beforeEach(() => {
    jest.clearAllMocks();
    mockDb = sqlite.__mockDb;
  });

  describe('findByUsername', () => {
    it('returns user object when found', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['id', 'username', 'password_hash', 'email'],
        values: [[1, 'admin', 'hashed_pw', 'admin@test.com']],
      }]);

      const user = await AdminUser.findByUsername('admin');
      expect(user).toEqual({
        id: 1,
        username: 'admin',
        password_hash: 'hashed_pw',
        email: 'admin@test.com',
      });
    });

    it('returns null when user not found', async () => {
      mockDb.exec.mockReturnValue([]);
      const user = await AdminUser.findByUsername('nonexistent');
      expect(user).toBeNull();
    });
  });

  describe('findById', () => {
    it('returns user when found', async () => {
      mockDb.exec.mockReturnValue([{
        columns: ['id', 'username'],
        values: [[1, 'admin']],
      }]);

      const user = await AdminUser.findById(1);
      expect(user).toEqual({ id: 1, username: 'admin' });
    });

    it('returns null when not found', async () => {
      mockDb.exec.mockReturnValue([]);
      const user = await AdminUser.findById(999);
      expect(user).toBeNull();
    });
  });

  describe('verifyPassword', () => {
    it('returns true for correct password', () => {
      bcrypt.compareSync.mockReturnValue(true);
      expect(AdminUser.verifyPassword('password', 'hash')).toBe(true);
    });

    it('returns false for incorrect password', () => {
      bcrypt.compareSync.mockReturnValue(false);
      expect(AdminUser.verifyPassword('wrong', 'hash')).toBe(false);
    });
  });

  describe('create', () => {
    it('hashes password and inserts user', async () => {
      bcrypt.hashSync.mockReturnValue('hashed_password');
      mockDb.exec.mockReturnValue([{ columns: ['id'], values: [[42]] }]);

      const result = await AdminUser.create({
        username: 'newuser',
        password: 'secret',
        email: 'new@test.com',
      });

      expect(bcrypt.hashSync).toHaveBeenCalledWith('secret', 12);
      expect(mockDb.run).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO admin_users'),
        ['newuser', 'hashed_password', 'new@test.com']
      );
      expect(sqlite.save).toHaveBeenCalled();
    });
  });

  describe('toJSON', () => {
    it('strips password_hash from user object', () => {
      const user = { id: 1, username: 'admin', password_hash: 'secret', email: 'a@b.com' };
      const json = AdminUser.toJSON(user);
      expect(json).toEqual({ id: 1, username: 'admin', email: 'a@b.com' });
      expect(json).not.toHaveProperty('password_hash');
    });

    it('returns null for null input', () => {
      expect(AdminUser.toJSON(null)).toBeNull();
    });
  });
});
```

**Step 2: Run test**

```bash
cd backend && pnpm test -- --testPathPattern=AdminUser
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add backend/__tests__/unit/models/AdminUser.test.js
git commit -m "test(backend): add AdminUser model unit tests"
```

---

## Task 15: Backend — Test adminController

**Files:**
- Create: `backend/__tests__/unit/controllers/adminController.test.js`

**Step 1: Write the test**

```javascript
const jwt = require('jsonwebtoken');
const AdminUser = require('../../../models/AdminUser');

jest.mock('jsonwebtoken');
jest.mock('../../../models/AdminUser');

const adminController = require('../../../controllers/adminController');

describe('adminController', () => {
  let req, res;

  beforeEach(() => {
    req = { body: {}, cookies: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    };
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('returns 400 when username is missing', async () => {
      req.body = { password: 'test' };
      await adminController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 400 when password is missing', async () => {
      req.body = { username: 'test' };
      await adminController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns 401 when user not found', async () => {
      req.body = { username: 'admin', password: 'test' };
      AdminUser.findByUsername.mockResolvedValue(null);

      await adminController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('returns 401 when password is wrong', async () => {
      req.body = { username: 'admin', password: 'wrong' };
      AdminUser.findByUsername.mockResolvedValue({ id: 1, username: 'admin', password_hash: 'hash' });
      AdminUser.verifyPassword.mockReturnValue(false);

      await adminController.login(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('sets httpOnly cookie and returns user on success', async () => {
      req.body = { username: 'admin', password: 'correct' };
      const user = { id: 1, username: 'admin', password_hash: 'hash' };
      AdminUser.findByUsername.mockResolvedValue(user);
      AdminUser.verifyPassword.mockReturnValue(true);
      AdminUser.updateLastLogin.mockResolvedValue(undefined);
      AdminUser.toJSON.mockReturnValue({ id: 1, username: 'admin' });
      jwt.sign.mockReturnValue('jwt-token');

      await adminController.login(req, res);

      expect(res.cookie).toHaveBeenCalledWith('admin_token', 'jwt-token', expect.objectContaining({
        httpOnly: true,
      }));
      expect(res.json).toHaveBeenCalledWith({ user: { id: 1, username: 'admin' } });
    });
  });

  describe('logout', () => {
    it('clears cookie and returns success', async () => {
      await adminController.logout(req, res);
      expect(res.clearCookie).toHaveBeenCalledWith('admin_token');
      expect(res.json).toHaveBeenCalledWith({ message: 'Logged out successfully' });
    });
  });

  describe('getMe', () => {
    it('returns 401 when no token', async () => {
      await adminController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });

    it('returns user data for valid token', async () => {
      req.cookies.admin_token = 'valid-token';
      jwt.verify.mockReturnValue({ id: 1 });
      AdminUser.findById.mockResolvedValue({ id: 1, username: 'admin', password_hash: 'hash' });
      AdminUser.toJSON.mockReturnValue({ id: 1, username: 'admin' });

      await adminController.getMe(req, res);
      expect(res.json).toHaveBeenCalledWith({ user: { id: 1, username: 'admin' } });
    });

    it('returns 401 for expired token', async () => {
      req.cookies.admin_token = 'expired';
      const error = new Error('expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => { throw error; });

      await adminController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token expired' });
    });

    it('returns 401 for invalid token', async () => {
      req.cookies.admin_token = 'invalid';
      const error = new Error('invalid');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => { throw error; });

      await adminController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
    });

    it('returns 401 when user not found', async () => {
      req.cookies.admin_token = 'valid';
      jwt.verify.mockReturnValue({ id: 999 });
      AdminUser.findById.mockResolvedValue(null);

      await adminController.getMe(req, res);
      expect(res.status).toHaveBeenCalledWith(401);
    });
  });
});
```

**Step 2: Run test**

```bash
cd backend && pnpm test -- --testPathPattern=adminController
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add backend/__tests__/unit/controllers/adminController.test.js
git commit -m "test(backend): add adminController unit tests"
```

---

## Task 16: Backend — Test komikController

**Files:**
- Create: `backend/__tests__/unit/controllers/komikController.test.js`

**Step 1: Write the test**

```javascript
const scraperClient = require('../../../middleware/scraperClient');

// Mock scraperClient
jest.mock('../../../middleware/scraperClient', () => ({
  getChapters: jest.fn(),
  getData: jest.fn(),
}));

// Mock websites config
jest.mock('../../../config/websites', () => ({
  websites: {
    komiku: { name: 'Komiku', domains: ['komiku.org'], nsfw: false },
    sektedoujin: { name: 'Sektedoujin', domains: ['sektedoujin.cc'], nsfw: true },
  },
}));

const { getChapters, getChapterData } = require('../../../controllers/komikController');

describe('komikController', () => {
  let req, res, next;

  beforeEach(() => {
    req = { query: {} };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('getChapters', () => {
    it('returns 400 when URL is missing', async () => {
      await getChapters(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'URL parameter is required' }));
    });

    it('returns 400 for unsupported domain', async () => {
      req.query = { url: 'https://unknown.com/manga' };
      await getChapters(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: 'Unsupported website URL' }));
    });

    it('returns 403 for NSFW content without secret mode', async () => {
      req.query = { url: 'https://sektedoujin.cc/manga', mode: 'normal' };
      await getChapters(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ nsfw: true }));
    });

    it('auto-fixes URL missing protocol', async () => {
      req.query = { url: 'komiku.org/manga/test' };
      scraperClient.getChapters.mockResolvedValue({ data: [{ chapter: 'Ch 1' }] });

      await getChapters(req, res, next);
      // Should have added https://
      expect(scraperClient.getChapters).toHaveBeenCalledWith('https://komiku.org/manga/test', 'normal');
    });

    it('returns 504 when scraper is unavailable', async () => {
      req.query = { url: 'https://komiku.org/manga' };
      scraperClient.getChapters.mockRejectedValue(new Error('Scraper service unavailable'));

      await getChapters(req, res, next);
      expect(res.status).toHaveBeenCalledWith(504);
    });

    it('returns 404 for empty results', async () => {
      req.query = { url: 'https://komiku.org/manga' };
      scraperClient.getChapters.mockResolvedValue({ data: [] });

      await getChapters(req, res, next);
      expect(res.status).toHaveBeenCalledWith(404);
    });

    it('returns chapter data on success', async () => {
      req.query = { url: 'https://komiku.org/manga' };
      scraperClient.getChapters.mockResolvedValue({ data: [{ chapter: 'Ch 1', url: '/ch/1' }] });

      await getChapters(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        data: [{ chapter: 'Ch 1', url: '/ch/1' }],
      });
    });

    it('calls next for non-scraper errors', async () => {
      req.query = { url: 'https://komiku.org/manga' };
      const error = new Error('Something unexpected');
      scraperClient.getChapters.mockRejectedValue(error);

      await getChapters(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getChapterData', () => {
    it('returns 400 when URL is missing', async () => {
      await getChapterData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(400);
    });

    it('returns title and data on success', async () => {
      req.query = { url: 'https://komiku.org/ch/1' };
      scraperClient.getData.mockResolvedValue({
        data: { title: 'Chapter 1', data: ['img1.jpg', 'img2.jpg'] },
      });

      await getChapterData(req, res, next);
      expect(res.json).toHaveBeenCalledWith({
        title: 'Chapter 1',
        data: ['img1.jpg', 'img2.jpg'],
      });
    });

    it('returns 504 when scraper unavailable', async () => {
      req.query = { url: 'https://komiku.org/ch/1' };
      scraperClient.getData.mockRejectedValue(new Error('Scraper service unavailable'));

      await getChapterData(req, res, next);
      expect(res.status).toHaveBeenCalledWith(504);
    });
  });
});
```

**Step 2: Run test**

```bash
cd backend && pnpm test -- --testPathPattern=komikController
```

Expected: All tests PASS

**Step 3: Run all backend tests**

```bash
cd backend && pnpm test
```

Expected: All backend tests PASS

**Step 4: Commit**

```bash
git add backend/__tests__/unit/controllers/komikController.test.js
git commit -m "test(backend): add komikController unit tests"
```

---

## Task 17: Frontend — Install Vitest & Configure

**Files:**
- Modify: `frontend/package.json`
- Create: `frontend/vitest.config.js`

**Step 1: Install dependencies**

```bash
cd frontend && pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 2: Create vitest config**

Create `frontend/vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/__tests__/**/*.test.{js,jsx}'],
  },
});
```

**Step 3: Create test setup file**

Create `frontend/src/__tests__/setup.js`:

```javascript
import '@testing-library/jest-dom';
```

**Step 4: Add test script to package.json**

Add to scripts:

```json
"test": "vitest run"
```

**Step 5: Verify Vitest runs**

```bash
cd frontend && pnpm test
```

Expected: "No test files found" (not an error)

**Step 6: Commit**

```bash
git add frontend/package.json frontend/vitest.config.js frontend/src/__tests__/setup.js
git commit -m "chore(frontend): configure Vitest + testing-library"
```

---

## Task 18: Frontend — Test nsfwStore

**Files:**
- Create: `frontend/src/__tests__/stores/nsfwStore.test.js`

**Step 1: Write the test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { useNsfwStore } from '@/stores/nsfwStore';

describe('nsfwStore', () => {
  beforeEach(() => {
    // Reset store to initial state
    useNsfwStore.setState({ nsfwEnabled: false });
    localStorage.clear();
  });

  it('starts with nsfwEnabled false', () => {
    expect(useNsfwStore.getState().nsfwEnabled).toBe(false);
  });

  it('toggle flips nsfwEnabled', () => {
    useNsfwStore.getState().toggle();
    expect(useNsfwStore.getState().nsfwEnabled).toBe(true);

    useNsfwStore.getState().toggle();
    expect(useNsfwStore.getState().nsfwEnabled).toBe(false);
  });

  it('setEnabled sets specific value', () => {
    useNsfwStore.getState().setEnabled(true);
    expect(useNsfwStore.getState().nsfwEnabled).toBe(true);

    useNsfwStore.getState().setEnabled(false);
    expect(useNsfwStore.getState().nsfwEnabled).toBe(false);
  });
});
```

**Step 2: Run test**

```bash
cd frontend && pnpm test -- --reporter=verbose
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add frontend/src/__tests__/stores/nsfwStore.test.js
git commit -m "test(frontend): add nsfwStore unit tests"
```

---

## Task 19: Frontend — Test readerStore

**Files:**
- Create: `frontend/src/__tests__/stores/readerStore.test.js`

**Step 1: Write the test**

```javascript
import { describe, it, expect, beforeEach } from 'vitest';
import { useReaderStore } from '@/stores/readerStore';

describe('readerStore', () => {
  beforeEach(() => {
    useReaderStore.setState({
      komik: null,
      activeChapter: null,
      loadedChapters: { entities: {}, ids: [] },
      loadingChapters: {},
    });
  });

  describe('setKomik / setActiveChapter', () => {
    it('sets komik URL', () => {
      useReaderStore.getState().setKomik('https://komiku.org/manga/test');
      expect(useReaderStore.getState().komik).toBe('https://komiku.org/manga/test');
    });

    it('sets active chapter', () => {
      useReaderStore.getState().setActiveChapter('Chapter 5');
      expect(useReaderStore.getState().activeChapter).toBe('Chapter 5');
    });
  });

  describe('upsertLoadedChapter', () => {
    it('adds new chapter to entities and ids', () => {
      useReaderStore.getState().upsertLoadedChapter('ch1', { id: 'ch1', loaded: true, data: ['img1'] });

      const state = useReaderStore.getState();
      expect(state.loadedChapters.ids).toEqual(['ch1']);
      expect(state.loadedChapters.entities.ch1).toEqual({ id: 'ch1', loaded: true, data: ['img1'] });
    });

    it('updates existing chapter without duplicating ID', () => {
      useReaderStore.getState().upsertLoadedChapter('ch1', { id: 'ch1', loading: true });
      useReaderStore.getState().upsertLoadedChapter('ch1', { id: 'ch1', loading: false, loaded: true });

      const state = useReaderStore.getState();
      expect(state.loadedChapters.ids).toEqual(['ch1']); // Not duplicated
      expect(state.loadedChapters.entities.ch1.loaded).toBe(true);
      expect(state.loadedChapters.entities.ch1.loading).toBe(false);
    });
  });

  describe('clearAndLoadChapter', () => {
    it('resets loadedChapters and marks target as loading', () => {
      // Pre-populate
      useReaderStore.getState().upsertLoadedChapter('ch1', { id: 'ch1', loaded: true });

      useReaderStore.getState().clearAndLoadChapter('ch5');

      const state = useReaderStore.getState();
      expect(state.activeChapter).toBe('ch5');
      expect(state.loadedChapters).toEqual({ entities: {}, ids: [] });
      expect(state.loadingChapters).toEqual({ ch5: true });
    });
  });

  describe('removeLoadedChapter', () => {
    it('removes chapter from entities and ids', () => {
      useReaderStore.getState().upsertLoadedChapter('ch1', { id: 'ch1' });
      useReaderStore.getState().upsertLoadedChapter('ch2', { id: 'ch2' });
      useReaderStore.getState().removeLoadedChapter('ch1');

      const state = useReaderStore.getState();
      expect(state.loadedChapters.ids).toEqual(['ch2']);
      expect(state.loadedChapters.entities.ch1).toBeUndefined();
    });
  });

  describe('clearLoadedChapters', () => {
    it('resets to empty state', () => {
      useReaderStore.getState().upsertLoadedChapter('ch1', { id: 'ch1' });
      useReaderStore.getState().clearLoadedChapters();

      const state = useReaderStore.getState();
      expect(state.loadedChapters).toEqual({ entities: {}, ids: [] });
    });
  });

  describe('setLoadingChapter', () => {
    it('tracks loading state per chapter', () => {
      useReaderStore.getState().setLoadingChapter('ch1', true);
      expect(useReaderStore.getState().loadingChapters.ch1).toBe(true);

      useReaderStore.getState().setLoadingChapter('ch1', false);
      expect(useReaderStore.getState().loadingChapters.ch1).toBe(false);
    });
  });
});
```

**Step 2: Run test**

```bash
cd frontend && pnpm test -- --reporter=verbose
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add frontend/src/__tests__/stores/readerStore.test.js
git commit -m "test(frontend): add readerStore unit tests"
```

---

## Task 20: Frontend — Test lib/api.js

**Files:**
- Create: `frontend/src/__tests__/lib/api.test.js`

**Step 1: Write the test**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getChapters, getChapterData, getCachedComics } from '@/lib/api';

describe('api', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('getChapters', () => {
    it('builds correct URL with comic URL param', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ data: [] }) };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      await getChapters('https://komiku.org/manga/test');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('/komik/chapters?');
      expect(calledUrl).toContain('url=https');
    });

    it('appends mode=secret when mode is nsfw', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ data: [] }) };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      await getChapters('https://komiku.org/manga', 'nsfw');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('mode=secret');
    });

    it('does not append mode=secret for normal mode', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ data: [] }) };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      await getChapters('https://komiku.org/manga', 'normal');

      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).not.toContain('mode=secret');
    });

    it('throws on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Server Error',
      });

      await expect(getChapters('https://komiku.org/manga')).rejects.toThrow('HTTP 500');
    });
  });

  describe('getChapterData', () => {
    it('builds correct URL', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve({ title: 'Ch 1', data: [] }) };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      await getChapterData('https://komiku.org/ch/1');
      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('/komik/data?');
    });
  });

  describe('getCachedComics', () => {
    it('calls correct endpoint', async () => {
      const mockResponse = { ok: true, json: () => Promise.resolve([]) };
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(mockResponse);

      await getCachedComics();
      const calledUrl = fetch.mock.calls[0][0];
      expect(calledUrl).toContain('/komik/cached-comics');
    });
  });
});
```

**Step 2: Run test**

```bash
cd frontend && pnpm test -- --reporter=verbose
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add frontend/src/__tests__/lib/api.test.js
git commit -m "test(frontend): add api client unit tests"
```

---

## Task 21: Frontend — Test lib/data-sources.js

**Files:**
- Create: `frontend/src/__tests__/lib/data-sources.test.js`

**Step 1: Write the test**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the api module
vi.mock('@/lib/api', () => ({
  getChapters: vi.fn(),
  getChapterData: vi.fn(),
}));

import { getChapters, getChapterData } from '@/lib/api';
import { fetchChapters, fetchChapterData, clearDataCache } from '@/lib/data-sources';

describe('data-sources', () => {
  beforeEach(() => {
    clearDataCache();
    vi.clearAllMocks();
  });

  describe('fetchChapters', () => {
    it('calls api.getChapters with correct mode mapping', async () => {
      getChapters.mockResolvedValue({ data: [] });

      await fetchChapters('https://test.com', true);
      expect(getChapters).toHaveBeenCalledWith('https://test.com', 'nsfw');

      clearDataCache();
      await fetchChapters('https://test.com', false);
      expect(getChapters).toHaveBeenCalledWith('https://test.com', 'normal');
    });

    it('returns same promise reference for same key (caching)', async () => {
      getChapters.mockResolvedValue({ data: [] });

      const p1 = fetchChapters('https://test.com', false);
      const p2 = fetchChapters('https://test.com', false);
      expect(p1).toBe(p2); // Same reference
      expect(getChapters).toHaveBeenCalledTimes(1); // Only one fetch
    });

    it('removes failed promise from cache on error', async () => {
      getChapters.mockRejectedValue(new Error('Network error'));

      const p1 = fetchChapters('https://test.com', false);
      await expect(p1).rejects.toThrow('Network error');

      // Next call should create new promise
      getChapters.mockResolvedValue({ data: [] });
      const p2 = fetchChapters('https://test.com', false);
      expect(p2).not.toBe(p1);
    });
  });

  describe('fetchChapterData', () => {
    it('caches successfully', async () => {
      getChapterData.mockResolvedValue({ title: 'Ch 1', data: [] });

      const p1 = fetchChapterData('https://test.com/ch/1', false);
      const p2 = fetchChapterData('https://test.com/ch/1', false);
      expect(p1).toBe(p2);
    });
  });

  describe('clearDataCache', () => {
    it('empties cache so next fetch creates new promise', async () => {
      getChapters.mockResolvedValue({ data: [] });

      const p1 = fetchChapters('https://test.com', false);
      await p1;

      clearDataCache();

      const p2 = fetchChapters('https://test.com', false);
      expect(p2).not.toBe(p1);
      expect(getChapters).toHaveBeenCalledTimes(2);
    });
  });
});
```

**Step 2: Run all frontend tests**

```bash
cd frontend && pnpm test -- --reporter=verbose
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add frontend/src/__tests__/lib/data-sources.test.js
git commit -m "test(frontend): add data-sources caching unit tests"
```

---

## Task 22: Admin — Install Vitest & Configure

**Files:**
- Modify: `admin/package.json`
- Create: `admin/vitest.config.js`
- Create: `admin/src/__tests__/setup.js`

**Step 1: Install dependencies**

```bash
cd admin && pnpm add -D vitest @testing-library/react @testing-library/jest-dom jsdom
```

**Step 2: Create vitest config**

Create `admin/vitest.config.js`:

```javascript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.js'],
    include: ['src/__tests__/**/*.test.{js,jsx}'],
  },
});
```

**Step 3: Create setup file**

Create `admin/src/__tests__/setup.js`:

```javascript
import '@testing-library/jest-dom';
```

**Step 4: Add test script**

Add to `admin/package.json` scripts:

```json
"test": "vitest run"
```

**Step 5: Verify**

```bash
cd admin && pnpm test
```

Expected: "No test files found"

**Step 6: Commit**

```bash
git add admin/package.json admin/vitest.config.js admin/src/__tests__/setup.js
git commit -m "chore(admin): configure Vitest + testing-library"
```

---

## Task 23: Admin — Test authStore

**Files:**
- Create: `admin/src/__tests__/stores/authStore.test.js`

**Step 1: Write the test**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock api module
vi.mock('../../lib/api', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

import api from '../../lib/api';
import { useAuthStore } from '../../stores/authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('sets user and isAuthenticated on success', async () => {
      api.post.mockResolvedValue({ data: { user: { id: 1, username: 'admin' } } });

      const result = await useAuthStore.getState().login('admin', 'password');

      expect(result).toEqual({ success: true });
      expect(useAuthStore.getState().user).toEqual({ id: 1, username: 'admin' });
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().isLoading).toBe(false);
    });

    it('returns error message on failure', async () => {
      api.post.mockRejectedValue({ response: { data: { error: 'Invalid credentials' } } });

      const result = await useAuthStore.getState().login('admin', 'wrong');

      expect(result).toEqual({ success: false, error: 'Invalid credentials' });
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });

    it('returns fallback error when no response data', async () => {
      api.post.mockRejectedValue(new Error('Network error'));

      const result = await useAuthStore.getState().login('admin', 'pass');
      expect(result.error).toBe('Login failed');
    });
  });

  describe('logout', () => {
    it('clears state even when API call fails', async () => {
      useAuthStore.setState({ user: { id: 1 }, isAuthenticated: true });
      api.post.mockRejectedValue(new Error('Network error'));

      await useAuthStore.getState().logout();

      expect(useAuthStore.getState().user).toBeNull();
      expect(useAuthStore.getState().isAuthenticated).toBe(false);
    });
  });

  describe('checkAuth', () => {
    it('sets user on success', async () => {
      api.get.mockResolvedValue({ data: { user: { id: 1, username: 'admin' } } });

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useAuthStore.getState().user).toEqual({ id: 1, username: 'admin' });
    });

    it('clears state on failure', async () => {
      useAuthStore.setState({ user: { id: 1 }, isAuthenticated: true });
      api.get.mockRejectedValue(new Error('401'));

      await useAuthStore.getState().checkAuth();

      expect(useAuthStore.getState().isAuthenticated).toBe(false);
      expect(useAuthStore.getState().user).toBeNull();
    });
  });
});
```

**Step 2: Run test**

```bash
cd admin && pnpm test -- --reporter=verbose
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add admin/src/__tests__/stores/authStore.test.js
git commit -m "test(admin): add authStore unit tests"
```

---

## Task 24: Admin — Test adminApi.js

**Files:**
- Create: `admin/src/__tests__/lib/adminApi.test.js`

**Step 1: Write the test**

```javascript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../lib/api', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ data: {} }),
    post: vi.fn().mockResolvedValue({ data: {} }),
    put: vi.fn().mockResolvedValue({ data: {} }),
    delete: vi.fn().mockResolvedValue({ data: {} }),
  },
}));

import api from '../../lib/api';
import { languagesApi, websitesApi, komiksApi, komikWebsitesApi } from '../../lib/adminApi';

describe('adminApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe.each([
    ['languagesApi', languagesApi, '/admin/languages'],
    ['websitesApi', websitesApi, '/admin/websites'],
    ['komiksApi', komiksApi, '/admin/komiks'],
    ['komikWebsitesApi', komikWebsitesApi, '/admin/komik-websites'],
  ])('%s', (name, apiModule, basePath) => {
    it('getAll calls GET on base path', async () => {
      await apiModule.getAll();
      expect(api.get).toHaveBeenCalledWith(basePath, { params: {} });
    });

    it('getAll passes params', async () => {
      await apiModule.getAll({ page: 1 });
      expect(api.get).toHaveBeenCalledWith(basePath, { params: { page: 1 } });
    });

    it('getById calls GET with id', async () => {
      await apiModule.getById(5);
      expect(api.get).toHaveBeenCalledWith(`${basePath}/5`);
    });

    it('create calls POST with data', async () => {
      await apiModule.create({ name: 'Test' });
      expect(api.post).toHaveBeenCalledWith(basePath, { name: 'Test' });
    });

    it('update calls PUT with id and data', async () => {
      await apiModule.update(5, { name: 'Updated' });
      expect(api.put).toHaveBeenCalledWith(`${basePath}/5`, { name: 'Updated' });
    });

    it('delete calls DELETE with id', async () => {
      await apiModule.delete(5);
      expect(api.delete).toHaveBeenCalledWith(`${basePath}/5`);
    });
  });

  describe('komiksApi.getWebsites', () => {
    it('calls GET on nested endpoint', async () => {
      await komiksApi.getWebsites(3);
      expect(api.get).toHaveBeenCalledWith('/admin/komiks/3/websites');
    });
  });
});
```

**Step 2: Run test**

```bash
cd admin && pnpm test -- --reporter=verbose
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add admin/src/__tests__/lib/adminApi.test.js
git commit -m "test(admin): add adminApi CRUD unit tests"
```

---

## Task 25: Admin — Test ProtectedRoute

**Files:**
- Create: `admin/src/__tests__/components/ProtectedRoute.test.jsx`

**Step 1: Write the test**

```jsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';

// Mock authStore
vi.mock('../../stores/authStore', () => ({
  useAuthStore: vi.fn(),
}));

import { useAuthStore } from '../../stores/authStore';
import ProtectedRoute from '../../components/Admin/ProtectedRoute';

// Helper to set up mock store
function mockStore(state) {
  const storeState = { ...state, checkAuth: vi.fn() };
  useAuthStore.mockImplementation((selector) => selector(storeState));
  useAuthStore.getState = vi.fn().mockReturnValue(storeState);
  return storeState;
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading when isLoading is true', () => {
    mockStore({ isAuthenticated: false, isLoading: true });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', () => {
    mockStore({ isAuthenticated: true, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('redirects to /login when not authenticated', () => {
    const store = mockStore({ isAuthenticated: false, isLoading: false });

    const { container } = render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('calls checkAuth on mount when not authenticated and not loading', () => {
    const store = mockStore({ isAuthenticated: false, isLoading: false });

    render(
      <MemoryRouter>
        <ProtectedRoute>
          <div>Protected Content</div>
        </ProtectedRoute>
      </MemoryRouter>
    );

    expect(store.checkAuth).toHaveBeenCalled();
  });
});
```

**Step 2: Run all admin tests**

```bash
cd admin && pnpm test -- --reporter=verbose
```

Expected: All tests PASS

**Step 3: Commit**

```bash
git add admin/src/__tests__/components/ProtectedRoute.test.jsx
git commit -m "test(admin): add ProtectedRoute component tests"
```

---

## Task 26: E2E — Set Up Playwright

**Files:**
- Create: `e2e/package.json`
- Create: `e2e/playwright.config.js`

**Step 1: Create e2e package**

Create `e2e/package.json`:

```json
{
  "name": "cumabaca-e2e",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "test": "playwright test"
  },
  "devDependencies": {
    "@playwright/test": "^1.49.0"
  }
}
```

**Step 2: Install dependencies**

```bash
cd e2e && pnpm install && pnpm exec playwright install chromium
```

**Step 3: Create Playwright config**

Create `e2e/playwright.config.js`:

```javascript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  retries: 1,
  use: {
    baseURL: 'http://localhost:5173',
    headless: true,
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: [
    {
      command: 'cd .. && pnpm run dev:frontend',
      port: 5173,
      reuseExistingServer: true,
    },
  ],
});
```

**Step 4: Commit**

```bash
git add e2e/
git commit -m "chore(e2e): set up Playwright"
```

---

## Task 27: E2E — Admin Auth Tests

**Files:**
- Create: `e2e/tests/admin-auth.spec.js`

**Step 1: Write the test**

```javascript
import { test, expect } from '@playwright/test';

test.describe('Admin Authentication', () => {
  test('shows login page at /login', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await expect(page.locator('input[type="text"], input[name="username"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ page }) => {
    await page.goto('http://localhost:5174/login');
    await page.fill('input[type="text"], input[name="username"]', 'wronguser');
    await page.fill('input[type="password"]', 'wrongpass');
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials').or(page.locator('[role="alert"]'))).toBeVisible({ timeout: 5000 });
  });

  test('redirects to login when accessing protected route', async ({ page }) => {
    await page.goto('http://localhost:5174/');
    // Should redirect to login
    await expect(page).toHaveURL(/\/login/);
  });
});
```

**Step 2: Commit**

Note: These tests require running services, so they should be run manually:

```bash
cd e2e && pnpm test
```

**Step 3: Commit**

```bash
git add e2e/tests/admin-auth.spec.js
git commit -m "test(e2e): add admin authentication tests"
```

---

## Task 28: Final — Run All Tests & Verify

**Step 1: Run all workspace tests from root**

```bash
pnpm test
```

Expected: All tests pass across backend, scraper, frontend, admin.

**Step 2: Verify test counts**

Expected approximate test counts:
- Scraper: ~40 tests (5 test files)
- Backend: ~25 tests (4 test files)
- Frontend: ~20 tests (4 test files)
- Admin: ~25 tests (3 test files)

**Step 3: Final commit with root lockfile**

```bash
git add pnpm-lock.yaml
git commit -m "chore: update lockfile after test infrastructure setup"
```

---

## Summary

| Workspace | Framework | Test Files | Test Scope |
|-----------|-----------|-----------|------------|
| Scraper | Jest (ESM) | 5 | Scrapers, controller, fetch utils, cache |
| Backend | Jest + Supertest | 4 | Controllers, middleware, models, utils |
| Frontend | Vitest | 4 | Stores, API, data-sources |
| Admin | Vitest | 3 | Auth store, API, ProtectedRoute |
| E2E | Playwright | 1 | Admin auth flow |

**Total: 17 test files, ~110 test cases**
