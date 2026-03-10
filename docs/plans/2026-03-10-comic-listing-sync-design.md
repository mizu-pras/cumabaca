# Comic Listing Sync — Design

## Overview

Sync comic listings from website sources (starting with komiku.org) into the database. Extracts title, cover, type, genre, and URL. Adds "Sync Comics" button to admin Websites page.

## Database Changes

### 1. Add `type` to `komiks` table

```sql
ALTER TABLE komiks ADD COLUMN type TEXT DEFAULT 'manga'
```

Values: `manga`, `manhwa`, `manhua`

### 2. New `genres` table

```sql
CREATE TABLE genres (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### 3. New `komik_genres` junction table

```sql
CREATE TABLE komik_genres (
  komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
  genre_id INTEGER NOT NULL REFERENCES genres(id) ON DELETE CASCADE,
  PRIMARY KEY (komik_id, genre_id)
)
```

## Genre Normalization (Indonesian → English)

| Source | Normalized |
|--------|-----------|
| Fantasi | Fantasy |
| Aksi | Action |
| Misteri | Mystery |
| Horor | Horror |
| Thriller | Thriller |
| Supernatural | Supernatural |
| Isekai | Isekai |
| Komedi | Comedy |
| Romantis | Romance |
| Drama | Drama |
| Petualangan | Adventure |
| Sci-Fi | Sci-Fi |

## Architecture

Follows existing pattern: Scraper fetches + parses, Backend orchestrates DB.

### Flow

```
Admin clicks "Sync Comics" on Website row
  → Backend POST /admin/websites/:id/sync-comics
    → Backend calls Scraper POST /scrape/comics
      → Scraper paginates api.komiku.org/manga/page/{n}
      → Parses: title, cover, genre, type, url
      → Stops when encountering stopAtUrl (incremental)
      → Returns comic list
    → Backend for each comic:
      1. Normalize genre
      2. Find or create Genre
      3. Find or create Komik (match by title, set type)
      4. Create komik_genres
      5. Create KomikWebsite
    → Return { created, skipped, total_scraped }
```

### Incremental Sync

- First sync: scrape all pages
- Subsequent syncs: backend passes `stopAtUrl` (most recent known comic URL) to scraper
- Scraper stops paginating when it encounters that URL

## Components

| Layer | File | Change |
|-------|------|--------|
| Scraper | `scrapers/komiku.js` | Add `getComicList($)` |
| Scraper | `routes/scrape.js` | Add `POST /scrape/comics` |
| Scraper | `controllers/scrapeController.js` | Add `scrapeComics` handler |
| Backend | `models/Genre.js` | New model |
| Backend | `models/KomikGenre.js` | New model |
| Backend | `config/sqlite.js` | Add tables + `type` column |
| Backend | `controllers/comicSyncController.js` | New sync controller |
| Backend | `routes/admin/websites.js` | Add `POST /:id/sync-comics` |
| Backend | `utils/genreNormalizer.js` | Indonesian→English map |
| Admin | `pages/Websites/index.jsx` | Add "Sync" button |
| Admin | `lib/adminApi.js` | Add `syncComics(id)` |

## HTML Parsing (komiku)

Source: `https://api.komiku.org/manga/page/{page}`

Each comic is a `div.bge`:
- **Title**: `div.kan a h3` text
- **Cover**: `div.bgei img` src
- **Type + Genre**: `div.tpe1_inf` — bold is type (Manga/Manhwa), rest is genre
- **URL**: `div.kan a` href (relative, needs baseUrl prefix)

Pagination ends when response has no `div.bge` elements.
