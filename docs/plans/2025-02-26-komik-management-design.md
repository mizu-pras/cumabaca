# Komik Management CRUD System - Design Document

**Date:** 2025-02-26
**Status:** Approved
**Author:** Claude (Brainstorming Session)

## Overview

Admin CRUD system for managing Languages, Websites (scraping sources), Komiks, and Komik-Website mappings. All endpoints require authentication. The database (SQLite) becomes the source of truth for website configuration, replacing `config/websites.js`.

## Purpose

Scraper management - Admins configure which comics to scrape from which websites. The system manages website configuration and tracks comic sources.

---

## Database Schema (SQLite)

```sql
-- Languages table
CREATE TABLE languages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,           -- "Bahasa Indonesia", "English"
  code TEXT NOT NULL UNIQUE,    -- "id", "en"
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Websites table (replaces config/websites.js)
CREATE TABLE websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                -- "Komiku", "Komikcast"
  url TEXT NOT NULL,                 -- "https://komiku.org"
  language_id INTEGER REFERENCES languages(id),
  use_browser BOOLEAN DEFAULT 0,     -- Puppeteer or HTTP
  search_endpoint TEXT,              -- "/comics?search={query}"
  is_nsfw BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Komiks table (manual comic entries)
CREATE TABLE komiks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  synopsis TEXT,
  language_id INTEGER REFERENCES languages(id),
  cover_image TEXT,
  status TEXT DEFAULT 'ongoing',     -- ongoing, completed, hiatus
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- KomikFromWebsite mapping table
CREATE TABLE komik_websites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  komik_id INTEGER NOT NULL REFERENCES komiks(id) ON DELETE CASCADE,
  website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
  url TEXT NOT NULL,                 -- Full URL to comic page
  total_chapters INTEGER DEFAULT 0,
  last_checked_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(komik_id, website_id)
);

-- Indexes for performance
CREATE INDEX idx_websites_language ON websites(language_id);
CREATE INDEX idx_komiks_language ON komiks(language_id);
CREATE INDEX idx_komik_websites_komik ON komik_websites(komik_id);
CREATE INDEX idx_komik_websites_website ON komik_websites(website_id);
```

---

## API Endpoints

**Base path:** `/admin`
**Authentication:** All endpoints require valid JWT from `admin_token` cookie

### Languages
```
GET    /admin/languages          # List all languages
GET    /admin/languages/:id      # Get single language
POST   /admin/languages          # Create language
PUT    /admin/languages/:id      # Update language
DELETE /admin/languages/:id      # Soft delete (is_active=0)
```

### Websites
```
GET    /admin/websites           # List all websites
GET    /admin/websites/:id       # Get single website
POST   /admin/websites           # Create website
PUT    /admin/websites/:id       # Update website
DELETE /admin/websites/:id       # Soft delete
```

### Komiks
```
GET    /admin/komiks                     # List komiks (paginated)
GET    /admin/komiks/:id                 # Get single komik
GET    /admin/komiks/:id/websites        # Get website sources
POST   /admin/komiks                     # Create komik
PUT    /admin/komiks/:id                 # Update komik
DELETE /admin/komiks/:id                 # Soft delete
```

### Komik Websites (Mapping)
```
GET    /admin/komik-websites             # List mappings
GET    /admin/komik-websites/:id         # Get single mapping
POST   /admin/komik-websites             # Link komik to website
PUT    /admin/komik-websites/:id         # Update mapping
DELETE /admin/komik-websites/:id         # Unlink
```

**Query Parameters (list endpoints):**
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)
- `search` - Search in title/name
- `is_active` - Filter by active status
- `language_id` - Filter by language

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Backend File Structure

```
backend/
├── models/
│   ├── AdminUser.js                    # (existing)
│   ├── Language.js                     # NEW
│   ├── Website.js                      # NEW
│   ├── Komik.js                        # NEW
│   └── KomikWebsite.js                 # NEW
│
├── controllers/
│   ├── adminController.js              # (existing - auth only)
│   ├── languageController.js           # NEW
│   ├── websiteController.js            # NEW
│   ├── komikManagementController.js    # NEW
│   └── komikWebsiteController.js       # NEW
│
├── middleware/
│   └── auth.js                         # NEW: JWT middleware
│
├── routes/
│   ├── admin.js                        # (refactor: add sub-routes)
│   ├── admin/
│   │   ├── languages.js                # NEW
│   │   ├── websites.js                 # NEW
│   │   ├── komiks.js                   # NEW
│   │   └── komik-websites.js           # NEW
│   └── komik.js                        # (unchanged - scraper endpoints)
│
└── config/
    └── sqlite.js                       # (update: add new tables init)
```

**Note:** Existing `komikController.js` (scraper endpoints at `/komik/*`) remains unchanged.

---

## Frontend Structure

```
frontend/
├── src/
│   ├── pages/
│   │   ├── Admin/
│   │   │   ├── AdminLayout.jsx         # Sidebar layout
│   │   │   ├── Dashboard/Dashboard.jsx # Overview
│   │   │   ├── Languages/
│   │   │   │   ├── index.jsx
│   │   │   │   └── components/
│   │   │   │       ├── LanguageTable.jsx
│   │   │   │       └── LanguageForm.jsx
│   │   │   ├── Websites/
│   │   │   │   ├── index.jsx
│   │   │   │   └── components/
│   │   │   │       ├── WebsiteTable.jsx
│   │   │   │       └── WebsiteForm.jsx
│   │   │   ├── Komiks/
│   │   │   │   ├── index.jsx
│   │   │   │   └── components/
│   │   │   │       ├── KomikTable.jsx
│   │   │   │       ├── KomikForm.jsx
│   │   │   │       └── KomikWebsiteModal.jsx
│   │   │   └── Login/Login.jsx
│   │   └── (existing pages...)
│   │
│   ├── components/
│   │   ├── Admin/
│   │   │   ├── Sidebar.jsx
│   │   │   ├── TopBar.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   └── (existing...)
│   │
│   ├── lib/api/
│   │   ├── admin.js                    # NEW: Admin API client
│   │   └── (existing...)
│   │
│   ├── stores/
│   │   ├── adminAuthStore.js           # NEW
│   │   └── (existing...)
│   │
│   └── routes.jsx                       # Update: add admin routes
```

**Admin Routes:**
```
/admin/login         → Login
/admin/dashboard     → Dashboard
/admin/languages     → Languages CRUD
/admin/websites      → Websites CRUD
/admin/komiks        → Komiks CRUD
```

**Sidebar Menu:**
```
📊 Dashboard
🌐 Languages
🔗 Websites
📚 Komiks
🚪 Logout
```

---

## Authentication Flow

```
1. Login → POST /admin/auth/login
   - Validate credentials
   - Generate JWT
   - Set httpOnly cookie

2. Protected Routes → All /admin/*
   - Verify JWT from cookie
   - Attach req.user

3. Logout → POST /admin/auth/logout
   - Clear cookie

4. Get Me → GET /admin/auth/me
   - Return current user
```

**Frontend Auth Store (Zustand):**
```javascript
{
  user: null | { id, username, email },
  isAuthenticated: boolean,
  login: (credentials) => Promise<void>,
  logout: () => void,
  checkAuth: () => Promise<void>
}
```

---

## Dependencies

**Backend:**
- No new dependencies (use existing: sql.js, bcrypt, jsonwebtoken)

**Frontend:**
- `@tanstack/react-table` - Table library

---

## Key Decisions

1. **SQLite database** - Consistent with existing `admin_users` table
2. **DB as source of truth** - Replaces `config/websites.js` for website config
3. **All endpoints require auth** - Admin-only access
4. **Soft delete pattern** - `is_active` flag instead of hard deletes
5. **TanStack Table** - For admin table components
6. **Keep existing scraper API** - `/komik/*` endpoints unchanged
