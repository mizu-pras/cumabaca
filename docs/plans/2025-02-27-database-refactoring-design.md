# Database Refactoring Design

**Date:** 2025-02-27
**Status:** Approved

## Overview

Refactor the database schema to move website-specific attributes (synopsis, cover_url) from the `komiks` table to a new `komik_websites_detail` table. This allows each website source to have its own synopsis and cover image for the same comic.

## Motivation

Different websites may have different synopses and cover images for the same comic. Moving these fields to a website-specific table provides:
- Website-specific synopsis and cover images
- Cleaner `komiks` table with only comic-level attributes
- Better data normalization

## Schema Changes

### `komiks` Table (After)

```sql
CREATE TABLE komiks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'ongoing',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Removed fields:** `synopsis`, `language_id`, `cover_image`

### `komik_websites` Table (After)

```sql
CREATE TABLE komik_websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
  website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  last_checked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(komik_id, website_id)
);
```

**Removed fields:** `total_chapters`

### New: `komik_websites_detail` Table

```sql
CREATE TABLE komik_websites_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  komik_website_id INTEGER NOT NULL REFERENCES komik_websites(id) ON DELETE CASCADE,
  synopsis TEXT,
  cover_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**New table:** Stores website-specific synopsis and cover image with 1:1 relationship to `komik_websites`

### Indexes

```sql
-- Remove
DROP INDEX IF EXISTS idx_komiks_language;

-- Add
CREATE INDEX IF NOT EXISTS idx_komik_websites_detail_komik_website ON komik_websites_detail(komik_website_id);
```

## Migration Strategy

1. Create new `komik_websites_detail` table
2. Migrate existing data from `komiks` to `komik_websites_detail`
3. Rebuild `komiks` and `komik_websites` tables with new schemas
4. Update indexes

```sql
-- Migration script
-- 1. Create new detail table
CREATE TABLE komik_websites_detail (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  komik_website_id INTEGER NOT NULL REFERENCES komik_websites(id) ON DELETE CASCADE,
  synopsis TEXT,
  cover_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Migrate existing data
INSERT INTO komik_websites_detail (komik_website_id, synopsis, cover_url)
SELECT kw.id, k.synopsis, k.cover_image
FROM komik_websites kw
JOIN komiks k ON kw.komik_id = k.id
WHERE k.synopsis IS NOT NULL OR k.cover_image IS NOT NULL;

-- 3. Rebuild komiks table (step by step)
CREATE TABLE komiks_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  status TEXT DEFAULT 'ongoing',
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO komiks_new (id, title, status, is_active, created_at, updated_at)
SELECT id, title, status, is_active, created_at, updated_at FROM komiks;

DROP TABLE komiks;
ALTER TABLE komiks_new RENAME TO komiks;

-- 4. Rebuild komik_websites table
CREATE TABLE komik_websites_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
  website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  last_checked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(komik_id, website_id)
);

INSERT INTO komik_websites_new (id, komik_id, website_id, url, last_checked_at, created_at, updated_at)
SELECT id, komik_id, website_id, url, last_checked_at, created_at, updated_at FROM komik_websites;

DROP TABLE komik_websites;
ALTER TABLE komik_websites_new RENAME TO komik_websites;

-- 5. Update indexes
DROP INDEX IF EXISTS idx_komiks_language;
CREATE INDEX IF NOT EXISTS idx_komik_websites_detail_komik_website ON komik_websites_detail(komik_website_id);
```

## Backend Changes

### Models

| File | Changes |
|------|---------|
| `backend/models/Komik.js` | Remove `synopsis`, `language_id`, `cover_image` from create/update; remove language JOIN |
| `backend/models/KomikWebsite.js` | Remove `total_chapters` from create/update |
| **New:** `backend/models/KomikWebsiteDetail.js` | CRUD operations for detail table |

### Controllers

| File | Changes |
|------|---------|
| `backend/controllers/komikManagementController.js` | Remove synopsis, language_id, cover_image handling |
| **New:** `backend/controllers/komikWebsiteDetailController.js` | Endpoints for managing website-specific details |

### Routes

**New routes:**
```
GET    /admin/komik-websites/:id/detail
POST   /admin/komik-websites/:id/detail
PUT    /admin/komik-websites/:id/detail
DELETE /admin/komik-websites/:id/detail
```

## Admin Panel Changes

### Components

| File | Changes |
|------|---------|
| `admin/src/pages/Komiks/components/KomikForm.jsx` | Remove synopsis, language_id, cover_image fields |
| `admin/src/pages/Komiks/components/WebsiteSources.jsx` | Remove total_chapters column; add synopsis/cover display; add edit detail button |
| **New:** `admin/src/pages/Komiks/components/WebsiteDetailModal.jsx` | Modal for editing website-specific synopsis and cover_url |

### API Module

Update `admin/src/lib/adminApi.js`:
```javascript
komikWebsiteDetails: {
  getByKomikWebsiteId: (id) => api.get(`/admin/komik-websites/${id}/detail`),
  create: (komikWebsiteId, data) => api.post(`/admin/komik-websites/${komikWebsiteId}/detail`, data),
  update: (id, data) => api.put(`/admin/komik-websites/${id}/detail`, data),
  delete: (id) => api.delete(`/admin/komik-websites/${id}/detail`),
}
```

## Testing Checklist

- [ ] Migration script runs successfully on existing database
- [ ] Existing komiks are preserved with correct title, status, is_active
- [ ] Website sources are preserved with correct URLs
- [ ] Synopsis and cover images are migrated to detail table
- [ ] Admin panel creates new komiks with simplified form
- [ ] Admin panel edits website-specific details
- [ ] Frontend displays komiks correctly (if affected)
