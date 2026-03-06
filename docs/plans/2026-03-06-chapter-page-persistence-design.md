# Chapter & Page Persistence + Public API

## Overview

Add persistent storage for chapters and pages in SQLite, build a public aggregated comic API, and enable both admin-triggered and cron-triggered chapter scraping. Pages are scraped lazily on first access.

## Database Changes

### New `chapters` table

```sql
CREATE TABLE IF NOT EXISTS chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  komik_website_id INTEGER NOT NULL,
  chapter_number REAL NOT NULL,
  url TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (komik_website_id) REFERENCES komik_websites(id) ON DELETE CASCADE,
  UNIQUE(komik_website_id, chapter_number)
);

CREATE INDEX idx_chapters_komik_website ON chapters(komik_website_id);
CREATE INDEX idx_chapters_number ON chapters(chapter_number);
```

- `chapter_number` is REAL to handle fractional chapters (e.g., 10.5)
- UNIQUE constraint prevents duplicate chapters per source

### New `pages` table

```sql
CREATE TABLE IF NOT EXISTS pages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  chapter_id INTEGER NOT NULL,
  page_number INTEGER NOT NULL,
  image_url TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  UNIQUE(chapter_id, page_number)
);

CREATE INDEX idx_pages_chapter ON pages(chapter_id);
```

## Scraping Orchestration

Backend orchestrates all scraping. Scraper service remains stateless.

### Chapter Scraping

- Backend calls scraper's `POST /scrape/chapters` with a KomikWebsite URL
- Parses results, upserts into `chapters` table
- Updates `komik_websites.total_chapters` and `komik_websites.last_checked_at`

### Page Scraping (Lazy)

- Triggered when a user requests pages for a chapter that has no stored pages
- Backend calls scraper's `POST /scrape/data` with the chapter URL
- Stores results in `pages` table, then returns them
- Subsequent requests served from SQLite

## Admin Routes

| Method | Route | Purpose |
|--------|-------|---------|
| POST | `/admin/komik-websites/:id/scrape-chapters` | Scrape chapters for one KomikWebsite |
| POST | `/admin/scrape/sync` | Scrape chapters for ALL active KomikWebsites |
| GET | `/admin/komik-websites/:id/chapters` | List stored chapters for a KomikWebsite |

`POST /admin/scrape/sync` is the endpoint that external cron calls on a schedule.

## Public API

### GET /api/komik

Paginated, filtered comic list with best source.

**Query params:** `?page=1&limit=20&language=1&search=title&status=ongoing`

**Response:**
```json
{
  "data": [
    {
      "id": 1,
      "title": "One Piece",
      "cover_image": "https://...",
      "synopsis": "...",
      "source": {
        "website_id": 3,
        "website_name": "komiku.org",
        "url": "https://komiku.org/one-piece",
        "latest_chapter": 1120
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 150 }
}
```

**Best source logic:** For each komik, pick the KomikWebsite with `MAX(chapter_number)` from the `chapters` table.

**Fallback chain for cover/synopsis:** Use komik-level `cover_image`/`synopsis` if set, otherwise use best source's data from `komik_websites`.

### GET /api/komik/:id/chapters

Chapter list for a komik from the best source.

### GET /api/komik/:komikId/chapters/:chapterId/pages

Pages for a chapter. If no pages stored, scrapes lazily, stores, then returns.

## What Stays the Same

- Existing `/komik/chapters`, `/komik/data`, `/komik/image` endpoints untouched
- Scraper service unchanged (backend calls its existing endpoints)
- Admin CRUD for websites, komiks, komik-websites unchanged
- MongoDB caching in both backend and scraper unchanged

## Decisions

- **Chapter number type:** REAL (handles fractional chapters)
- **Page scraping:** Lazy (on first access, then persisted)
- **Chapter scraping trigger:** Hybrid (admin manual + external cron)
- **Orchestration:** Backend owns it, scraper stays stateless
- **Cover/synopsis:** Fallback chain (komik-level preferred, source-level as fallback)
