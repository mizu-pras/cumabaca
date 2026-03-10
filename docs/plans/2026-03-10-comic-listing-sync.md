# Comic Listing Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Sync comic listings from komiku.org into the database with auto-created Komik + KomikWebsite records, genre normalization, and an admin "Sync Comics" button.

**Architecture:** Scraper service handles HTTP fetching + HTML parsing (new `POST /scrape/comics` endpoint). Backend orchestrates DB persistence — creates Genre, Komik, KomikGenre, and KomikWebsite records. Admin panel adds a "Sync" button per website row. Incremental sync stops when encountering already-known comics.

**Tech Stack:** Express.js, Cheerio, SQLite (sql.js), React 19, TanStack Table, Tailwind CSS

---

### Task 1: Database Schema — Add `genres`, `komik_genres` tables and `type` column

**Files:**
- Modify: `backend/config/sqlite.js`

**Step 1: Add new tables and column to schema**

In `backend/config/sqlite.js`, add these inside `ensureSchema()` after the `pages` table creation:

```javascript
  // Genre table
  db.run(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Komik-Genre junction table (many-to-many)
  db.run(`
    CREATE TABLE IF NOT EXISTS komik_genres (
      komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
      genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
      PRIMARY KEY (komik_id, genre_id)
    );
  `);

  // Add type column to komiks (migration-safe)
  try {
    db.run(`ALTER TABLE komiks ADD COLUMN type TEXT DEFAULT 'manga'`);
  } catch (e) {
    // Column already exists — ignore
  }
```

Add indexes after existing indexes:

```javascript
  db.run('CREATE INDEX IF NOT EXISTS idx_komik_genres_komik ON komik_genres(komik_id);');
  db.run('CREATE INDEX IF NOT EXISTS idx_komik_genres_genre ON komik_genres(genre_id);');
```

**Step 2: Verify schema loads without errors**

Run: `cd backend && node -e "const sqlite = require('./config/sqlite'); sqlite.init().then(() => console.log('OK')).catch(e => console.error(e))"`

Expected: `OK`

**Step 3: Commit**

```bash
git add backend/config/sqlite.js
git commit -m "feat: add genres, komik_genres tables and type column to komiks"
```

---

### Task 2: Genre Model

**Files:**
- Create: `backend/models/Genre.js`

**Step 1: Create Genre model**

Follow the pattern from `backend/models/Komik.js` (same `_parseResult` helper, same SQLite usage).

```javascript
const sqlite = require('../config/sqlite');

class Genre {
  static async findOrCreate(name) {
    const db = await sqlite.getDb();
    const existing = db.exec('SELECT * FROM genres WHERE name = ?', [name]);
    const rows = this._parseResult(existing);
    if (rows.length > 0) return rows[0];

    db.run('INSERT INTO genres (name) VALUES (?)', [name]);
    const lastId = db.exec('SELECT last_insert_rowid() as id')[0].values[0][0];
    sqlite.save();
    return { id: lastId, name };
  }

  static async findAll() {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM genres ORDER BY name ASC');
    return this._parseResult(result);
  }

  static async findById(id) {
    const db = await sqlite.getDb();
    const result = db.exec('SELECT * FROM genres WHERE id = ?', [id]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }

  static async findByKomikId(komikId) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT g.* FROM genres g
      INNER JOIN komik_genres kg ON g.id = kg.genre_id
      WHERE kg.komik_id = ?
      ORDER BY g.name ASC
    `, [komikId]);
    return this._parseResult(result);
  }

  static _parseResult(result) {
    if (!result || result.length === 0) return [];
    const columns = result[0].columns;
    return result[0].values.map(row => {
      const obj = {};
      columns.forEach((col, i) => { obj[col] = row[i]; });
      return obj;
    });
  }
}

module.exports = Genre;
```

**Step 2: Commit**

```bash
git add backend/models/Genre.js
git commit -m "feat: add Genre model with findOrCreate"
```

---

### Task 3: KomikGenre Model

**Files:**
- Create: `backend/models/KomikGenre.js`

**Step 1: Create KomikGenre model**

```javascript
const sqlite = require('../config/sqlite');

class KomikGenre {
  static async setGenres(komikId, genreIds) {
    const db = await sqlite.getDb();
    // Remove existing associations
    db.run('DELETE FROM komik_genres WHERE komik_id = ?', [komikId]);
    // Insert new associations
    for (const genreId of genreIds) {
      try {
        db.run('INSERT INTO komik_genres (komik_id, genre_id) VALUES (?, ?)', [komikId, genreId]);
      } catch (e) {
        // Duplicate — ignore
      }
    }
    sqlite.save();
  }

  static async addGenre(komikId, genreId) {
    const db = await sqlite.getDb();
    try {
      db.run('INSERT INTO komik_genres (komik_id, genre_id) VALUES (?, ?)', [komikId, genreId]);
      sqlite.save();
    } catch (e) {
      // Already exists — ignore
    }
  }
}

module.exports = KomikGenre;
```

**Step 2: Commit**

```bash
git add backend/models/KomikGenre.js
git commit -m "feat: add KomikGenre junction model"
```

---

### Task 4: Genre Normalizer Utility

**Files:**
- Create: `backend/utils/genreNormalizer.js`

**Step 1: Create normalizer with Indonesian→English map**

```javascript
const GENRE_MAP = {
  'fantasi': 'Fantasy',
  'aksi': 'Action',
  'misteri': 'Mystery',
  'horor': 'Horror',
  'thriller': 'Thriller',
  'supernatural': 'Supernatural',
  'isekai': 'Isekai',
  'komedi': 'Comedy',
  'romantis': 'Romance',
  'drama': 'Drama',
  'petualangan': 'Adventure',
  'sci-fi': 'Sci-Fi',
  'olahraga': 'Sports',
  'slice of life': 'Slice of Life',
  'sejarah': 'Historical',
  'militer': 'Military',
  'psikologis': 'Psychological',
  'dewasa': 'Mature',
  'gore': 'Gore',
  'musik': 'Music',
  'parodi': 'Parody',
  'sekolah': 'School',
  'shounen': 'Shounen',
  'shoujo': 'Shoujo',
  'seinen': 'Seinen',
  'josei': 'Josei',
};

function normalizeGenre(rawGenre) {
  const trimmed = rawGenre.trim().toLowerCase();
  return GENRE_MAP[trimmed] || rawGenre.trim();
}

function normalizeType(rawType) {
  const trimmed = rawType.trim().toLowerCase();
  if (trimmed === 'manhwa') return 'manhwa';
  if (trimmed === 'manhua') return 'manhua';
  return 'manga';
}

module.exports = { normalizeGenre, normalizeType };
```

**Step 2: Commit**

```bash
git add backend/utils/genreNormalizer.js
git commit -m "feat: add genre normalizer with Indonesian-English mapping"
```

---

### Task 5: Scraper — Add `getComicList` to KomikuScraper

**Files:**
- Modify: `scraper/src/scrapers/komiku.js`

**Step 1: Add `getComicList` method**

Add this method to the `KomikuScraper` class after `getChapterData`:

```javascript
    getComicList($) {
        const comics = [];

        $('div.bge').each((_, el) => {
            const element = $(el);

            // Title
            const title = element.find('div.kan a h3').first().text().trim();
            if (!title) return;

            // URL (from the kan link, relative path)
            const url = element.find('div.kan > a').first().attr('href');
            if (!url) return;

            // Cover image
            const cover = element.find('div.bgei img').first().attr('src') || '';

            // Type and Genre from tpe1_inf: "<b>Manga</b> Fantasi"
            const typeGenreEl = element.find('div.tpe1_inf');
            const type = typeGenreEl.find('b').text().trim() || 'Manga';
            // Genre is the text after the <b> tag
            const fullText = typeGenreEl.text().trim();
            const genre = fullText.replace(type, '').trim() || '';

            comics.push({ title, url, cover, type, genre });
        });

        return comics;
    }
```

**Step 2: Commit**

```bash
git add scraper/src/scrapers/komiku.js
git commit -m "feat: add getComicList method to KomikuScraper"
```

---

### Task 6: Scraper — Add `POST /scrape/comics` Endpoint

**Files:**
- Modify: `scraper/src/controllers/scrapeController.js`
- Modify: `scraper/src/routes/scrape.js`

**Step 1: Add `scrapeComics` controller function**

Add to `scraper/src/controllers/scrapeController.js` after the `clearCache` export:

```javascript
/**
 * Scrape comic listings from a website (paginated)
 * Body: { baseUrl, stopAtUrl? }
 * - baseUrl: e.g., "https://komiku.org"
 * - stopAtUrl: stop pagination when this comic URL is found (incremental sync)
 */
export async function scrapeComics(req, res, next) {
  const { baseUrl, stopAtUrl } = req.body;

  if (!baseUrl) {
    return res.status(400).json({ success: false, error: 'baseUrl is required' });
  }

  const startTime = Date.now();

  try {
    const config = getWebsiteConfig(baseUrl);
    if (!config) {
      return res.status(400).json({ success: false, error: 'Unsupported website' });
    }

    const scraper = getScraperForDomain(baseUrl);
    if (!scraper.getComicList) {
      return res.status(400).json({ success: false, error: 'This scraper does not support comic listing' });
    }

    const allComics = [];
    let page = 1;
    let shouldStop = false;

    while (!shouldStop) {
      const pageUrl = `${baseUrl.replace(/\/$/, '')}/manga/page/${page}/`;

      const $ = config.useBrowser
        ? await fetchDataWithBrowser(pageUrl, config)
        : await fetchData(pageUrl);

      if (!$) break;

      const comics = scraper.getComicList($);
      if (comics.length === 0) break;

      for (const comic of comics) {
        if (stopAtUrl && comic.url === stopAtUrl) {
          shouldStop = true;
          break;
        }
        allComics.push(comic);
      }

      page++;
    }

    const scrapeTime = Date.now() - startTime;

    res.json({
      success: true,
      data: allComics,
      totalPages: page - 1,
      scrapeTime,
    });
  } catch (error) {
    console.error('Scrape comics error:', error);
    next(error);
  }
}
```

**Step 2: Add route**

In `scraper/src/routes/scrape.js`, add the import and route:

```javascript
// Add scrapeComics to the import
import {
  scrapeChapters,
  scrapeData,
  getCacheStats,
  clearCache,
  scrapeComics
} from '../controllers/scrapeController.js';

// Add route after existing routes
router.post('/comics', scrapeComics);
```

**Step 3: Commit**

```bash
git add scraper/src/controllers/scrapeController.js scraper/src/routes/scrape.js
git commit -m "feat: add POST /scrape/comics endpoint for comic listing scraping"
```

---

### Task 7: Backend — Add `getComics` to ScraperClient

**Files:**
- Modify: `backend/middleware/scraperClient.js`

**Step 1: Add `getComics` method**

Add after the `getData` method:

```javascript
  /**
   * Get comic listings from scraper
   */
  async getComics(baseUrl, stopAtUrl = null) {
    try {
      const body = { baseUrl };
      if (stopAtUrl) body.stopAtUrl = stopAtUrl;
      const response = await this.client.post('/scrape/comics', body, {
        timeout: 300000, // 5 minutes — pagination can be slow
      });
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
```

**Step 2: Commit**

```bash
git add backend/middleware/scraperClient.js
git commit -m "feat: add getComics method to scraperClient"
```

---

### Task 8: Backend — Update Komik Model for `type` Field

**Files:**
- Modify: `backend/models/Komik.js`

**Step 1: Add `type` to `create` method**

Update the `create` method signature and SQL:

```javascript
  static async create({ title, synopsis, language_id, cover_image, status, is_active, type }) {
    const db = await sqlite.getDb();
    db.run(
      'INSERT INTO komiks (title, synopsis, language_id, cover_image, status, is_active, type) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [title, synopsis, language_id, cover_image, status || 'ongoing', is_active !== undefined ? (is_active ? 1 : 0) : 1, type || 'manga']
    );
```

**Step 2: Add `findByTitle` static method**

Add after `findById`:

```javascript
  static async findByTitle(title) {
    const db = await sqlite.getDb();
    const result = db.exec(`
      SELECT k.*, l.name as language_name, l.code as language_code
      FROM komiks k
      LEFT JOIN languages l ON k.language_id = l.id
      WHERE k.title = ?
    `, [title]);
    const rows = this._parseResult(result);
    return rows[0] || null;
  }
```

**Step 3: Commit**

```bash
git add backend/models/Komik.js
git commit -m "feat: add type field and findByTitle to Komik model"
```

---

### Task 9: Backend — Comic Sync Controller

**Files:**
- Create: `backend/controllers/comicSyncController.js`

**Step 1: Create the sync controller**

```javascript
const scraperClient = require('../middleware/scraperClient');
const Komik = require('../models/Komik');
const KomikWebsite = require('../models/KomikWebsite');
const Genre = require('../models/Genre');
const KomikGenre = require('../models/KomikGenre');
const Website = require('../models/Website');
const { normalizeGenre, normalizeType } = require('../utils/genreNormalizer');

const comicSyncController = {
  async syncComics(req, res) {
    try {
      const { id } = req.params;
      const website = await Website.findById(id);

      if (!website) {
        return res.status(404).json({ error: 'Website not found' });
      }

      // Find most recent known comic URL for incremental sync
      const existingKomikWebsites = await KomikWebsite.findAll({ website_id: id });
      const knownUrls = new Set(existingKomikWebsites.map(kw => kw.url));
      const stopAtUrl = existingKomikWebsites.length > 0
        ? existingKomikWebsites[0]?.url  // Most recent (ordered by id DESC)
        : null;

      // Call scraper
      const result = await scraperClient.getComics(website.url, stopAtUrl);
      const comics = result.data || [];

      let created = 0;
      let skipped = 0;

      for (const comic of comics) {
        // Build full URL
        const comicUrl = comic.url.startsWith('http')
          ? comic.url
          : website.url.replace(/\/$/, '') + comic.url;

        // Skip if this URL already exists for this website
        if (knownUrls.has(comicUrl)) {
          skipped++;
          continue;
        }

        // Normalize type and genre
        const type = normalizeType(comic.type);
        const genreName = comic.genre ? normalizeGenre(comic.genre) : null;

        // Find or create Komik by title
        let komik = await Komik.findByTitle(comic.title);
        if (!komik) {
          const result = await Komik.create({
            title: comic.title,
            cover_image: comic.cover,
            language_id: website.language_id,
            type,
          });
          komik = { id: result.id };
        }

        // Handle genre
        if (genreName) {
          const genre = await Genre.findOrCreate(genreName);
          await KomikGenre.addGenre(komik.id, genre.id);
        }

        // Create KomikWebsite link
        try {
          await KomikWebsite.create({
            komik_id: komik.id,
            website_id: parseInt(id),
            url: comicUrl,
            cover: comic.cover,
          });
          knownUrls.add(comicUrl);
          created++;
        } catch (e) {
          // UNIQUE constraint — already linked
          skipped++;
        }
      }

      res.json({
        data: {
          website_id: id,
          total_scraped: comics.length,
          created,
          skipped,
        },
      });
    } catch (error) {
      console.error('Sync comics error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  },
};

module.exports = comicSyncController;
```

**Step 2: Commit**

```bash
git add backend/controllers/comicSyncController.js
git commit -m "feat: add comicSyncController for syncing comic listings"
```

---

### Task 10: Backend — Add Sync Route

**Files:**
- Modify: `backend/routes/admin/websites.js`

**Step 1: Add the sync-comics route**

```javascript
const express = require('express');
const router = express.Router();
const websiteController = require('../../controllers/websiteController');
const comicSyncController = require('../../controllers/comicSyncController');
const { requireAuth } = require('../../middleware/auth');

router.use(requireAuth);

router.get('/', websiteController.getAll);
router.get('/:id', websiteController.getById);
router.post('/', websiteController.create);
router.put('/:id', websiteController.update);
router.delete('/:id', websiteController.delete);

// Comic sync
router.post('/:id/sync-comics', comicSyncController.syncComics);

module.exports = router;
```

**Step 2: Commit**

```bash
git add backend/routes/admin/websites.js
git commit -m "feat: add POST /admin/websites/:id/sync-comics route"
```

---

### Task 11: Admin — Add `syncComics` API Method

**Files:**
- Modify: `admin/src/lib/adminApi.js`

**Step 1: Add syncComics to websitesApi**

```javascript
export const websitesApi = {
  getAll: (params = {}) => api.get('/admin/websites', { params }),
  getById: (id) => api.get(`/admin/websites/${id}`),
  create: (data) => api.post('/admin/websites', data),
  update: (id, data) => api.put(`/admin/websites/${id}`, data),
  delete: (id) => api.delete(`/admin/websites/${id}`),
  syncComics: (id) => api.post(`/admin/websites/${id}/sync-comics`),
};
```

**Step 2: Commit**

```bash
git add admin/src/lib/adminApi.js
git commit -m "feat: add syncComics to admin websitesApi"
```

---

### Task 12: Admin — Add "Sync Comics" Button to Websites Page

**Files:**
- Modify: `admin/src/pages/Websites/index.jsx`

**Step 1: Add sync state and handler**

Add imports at top:
```javascript
import { Plus, Pencil, Trash2, RefreshCw } from 'lucide-react';
```

Add state inside the `Websites` component:
```javascript
  const [syncingId, setSyncingId] = useState(null);
  const [syncResult, setSyncResult] = useState(null);
```

Add handler function:
```javascript
  async function handleSyncComics(id) {
    setSyncingId(id);
    setSyncResult(null);
    try {
      const response = await websitesApi.syncComics(id);
      const data = response.data.data;
      setSyncResult({
        type: 'success',
        message: `Synced: ${data.created} created, ${data.skipped} skipped (${data.total_scraped} total)`,
      });
    } catch (error) {
      setSyncResult({
        type: 'error',
        message: `Sync failed: ${error.response?.data?.error || error.message}`,
      });
    } finally {
      setSyncingId(null);
    }
  }
```

**Step 2: Add Sync column to table**

Add a new column before the `actions` column in the `columns` useMemo:

```javascript
      {
        id: 'sync',
        header: 'Sync',
        cell: ({ row }) => (
          <button
            onClick={() => handleSyncComics(row.original.id)}
            disabled={syncingId !== null}
            className="text-green-600 hover:text-green-800 disabled:opacity-50"
            title="Sync Comics"
          >
            <RefreshCw
              size={16}
              className={`inline ${syncingId === row.original.id ? 'animate-spin' : ''}`}
            />
          </button>
        ),
      },
```

**Step 3: Add sync result message**

Add after the filter controls `div` and before the `isLoading` check:

```jsx
      {syncResult && (
        <div className={`mb-4 p-3 rounded-lg text-sm ${
          syncResult.type === 'success'
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {syncResult.message}
        </div>
      )}
```

**Step 4: Update columns dependency**

The `useMemo` for columns depends on `syncingId`, so update:
```javascript
  const columns = useMemo(() => [...], [syncingId]);
```

**Step 5: Commit**

```bash
git add admin/src/pages/Websites/index.jsx
git commit -m "feat: add Sync Comics button to admin Websites page"
```

---

### Task 13: Smoke Test — End-to-End Verification

**Step 1: Start all services**
```bash
pnpm run dev:all
```

**Step 2: Verify scraper endpoint**

```bash
curl -X POST http://localhost:3200/scrape/comics \
  -H "Content-Type: application/json" \
  -d '{"baseUrl": "https://komiku.org"}' | head -c 500
```

Expected: JSON with `success: true` and `data` array containing comic objects with `title`, `url`, `cover`, `type`, `genre`.

**Step 3: Test admin sync via UI**

1. Open http://localhost:5174 (admin)
2. Log in
3. Go to Websites page
4. Click the sync (refresh) icon on the Komiku row
5. Wait for spinner to complete
6. Verify green success message: "Synced: X created, 0 skipped (Y total)"
7. Go to Komiks page to verify new records appeared

**Step 4: Test incremental sync**

1. Click the sync button again on the same website
2. Should complete faster (stops at first known comic)
3. Message should show: "Synced: 0 created, X skipped"
