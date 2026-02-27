# API Documentation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Create comprehensive API documentation in Markdown, OpenAPI, and Postman Collection formats for all 30 backend endpoints.

**Architecture:** Multi-format documentation with Markdown as primary source, OpenAPI spec for tool integration, and Postman collection for testing. Swagger UI optionally served via Express middleware.

**Tech Stack:** Markdown, OpenAPI 3.0, Postman Collection v2.1, swagger-ui-express (optional), yamljs (optional)

---

## Task 1: Create Documentation Directory Structure

**Files:**
- Create: `backend/docs/api/` directory

**Step 1: Create the api directory**

```bash
mkdir -p backend/docs/api
```

**Step 2: Verify directory created**

Run: `ls -la backend/docs/`
Expected: Shows `api/` directory

**Step 3: Commit**

```bash
git add backend/docs/api/
git commit -m "docs: create api documentation directory"
```

---

## Task 2: Write Comic Scraping Documentation

**Files:**
- Create: `backend/docs/api/komik-scraping.md`

**Step 1: Write the documentation file**

Create `backend/docs/api/komik-scraping.md`:

```markdown
# Comic Scraping API

Public endpoints for scraping comic data from supported websites.

## Supported Websites

| Website | Domain | Browser Mode | NSFW |
|---------|--------|--------------|------|
| Komiku | komiku.org | No | No |
| Komikcast | v1.komikcast.fit | Yes | No |
| Sektedoujin | sektedoujin.cc | Yes | Yes |

---

## GET /komik/chapters

Returns chapter list for a comic from a supported website.

**Cache:** 24 hours (86400 seconds)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Comic page URL to scrape |
| `mode` | string | No | Set to `secret` for NSFW content |

### Request Example (cURL)

```bash
curl "http://localhost:3100/komik/chapters?url=https://komiku.org/manga/one-piece"
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/komik/chapters?url=https://komiku.org/manga/one-piece');
const data = await response.json();
console.log(data);
```

### Response (200 OK)

```json
{
  "url": "https://komiku.org/manga/one-piece",
  "data": {
    "title": "One Piece",
    "chapters": [
      {
        "url": "https://komiku.org/chapter/one-piece-1",
        "title": "Chapter 1"
      }
    ]
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 403 | NSFW content without `mode=secret` |
| 404 | No chapters found |

### NSFW Mode Response (403 Forbidden)

```json
{
  "error": "NSFW content",
  "nsfw": true,
  "useSecretMode": true
}
```

---

## GET /komik/data

Returns images for a specific chapter.

**Cache:** 24 hours (86400 seconds)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Chapter URL to scrape |
| `mode` | string | No | Set to `secret` for NSFW content |

### Request Example (cURL)

```bash
curl "http://localhost:3100/komik/data?url=https://komiku.org/chapter/one-piece-1"
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/komik/data?url=https://komiku.org/chapter/one-piece-1');
const data = await response.json();
console.log(data);
```

### Response (200 OK)

```json
{
  "title": "Chapter 1",
  "images": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 403 | NSFW content without `mode=secret` |

---

## GET /komik/image

Image proxy to bypass CORS and hotlink protection.

**No Cache** (sets client cache headers for 1 day)

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `url` | string | Yes | Image URL to proxy |

### Request Example (cURL)

```bash
curl "http://localhost:3100/komik/image?url=https://example.com/image.jpg" --output image.jpg
```

### Request Example (HTML)

```html
<img src="http://localhost:3100/komik/image?url=https://example.com/image.jpg" alt="Proxied Image">
```

### Response

Binary image data with headers:
- `Content-Type`: image MIME type
- `Cache-Control`: `public, max-age=86400`
- `Access-Control-Allow-Origin`: `*`
- `Cross-Origin-Resource-Policy`: `cross-origin`
- `Cross-Origin-Embedder-Policy`: `require-corp`

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing URL parameter |

---

## GET /komik/cache/stats

Returns cache statistics from MongoDB.

### Request Example (cURL)

```bash
curl "http://localhost:3100/komik/cache/stats"
```

### Response (200 OK)

```json
{
  "totalEntries": 42,
  "expiredEntries": 0,
  "totalSize": 125000,
  "avgSize": 2976
}
```

---

## GET /komik/cached-comics

Returns array of cached comics with metadata.

### Request Example (cURL)

```bash
curl "http://localhost:3100/komik/cached-comics"
```

### Response (200 OK)

```json
[
  {
    "url": "https://komiku.org/manga/one-piece",
    "title": "One Piece",
    "domain": "komiku.org",
    "cachedAt": "2026-02-27T10:00:00.000Z",
    "expiresAt": "2026-02-28T10:00:00.000Z",
    "isNsfw": false
  }
]
```

---

## DELETE /komik/cache

Delete cache entries.

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | No | Specific cache key to delete (omit to clear all) |

### Request Example (Delete All)

```bash
curl -X DELETE "http://localhost:3100/komik/cache"
```

### Request Example (Delete Specific)

```bash
curl -X DELETE "http://localhost:3100/komik/cache?key=__express__/komik/chapters?url=https://..."
```

### Response - Delete Specific (200 OK)

```json
{
  "success": true,
  "message": "Cache entry deleted: __express__/komik/chapters?url=https://..."
}
```

### Response - Delete Specific Not Found (404)

```json
{
  "success": false,
  "message": "Cache entry not found: ..."
}
```

### Response - Clear All (200 OK)

```json
{
  "success": true,
  "deletedEntries": 42,
  "message": "Cleared 42 cache entries"
}
```
```

**Step 2: Verify file created**

Run: `ls -la backend/docs/api/komik-scraping.md`
Expected: File exists

**Step 3: Commit**

```bash
git add backend/docs/api/komik-scraping.md
git commit -m "docs: add comic scraping API documentation"
```

---

## Task 3: Write Admin Authentication Documentation

**Files:**
- Create: `backend/docs/api/admin-auth.md`

**Step 1: Write the documentation file**

Create `backend/docs/api/admin-auth.md`:

```markdown
# Admin Authentication API

Admin authentication endpoints for JWT-based access control.

**Authentication Method:** JWT token via `admin_token` httpOnly cookie

**Token Expiry:** 24 hours (configurable via `ADMIN_JWT_EXPIRY` env var)

---

## POST /admin/auth/login

Admin login with JWT token returned as httpOnly cookie.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `username` | string | Yes | Admin username |
| `password` | string | Yes | Admin password |

### Request Example (cURL)

```bash
curl -X POST "http://localhost:3100/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}' \
  -c cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'password'
  }),
  credentials: 'include'
});
const data = await response.json();
console.log(data);
```

### Response (200 OK)

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "created_at": "2026-02-27T10:00:00.000Z",
    "last_login": "2026-02-27T10:00:00.000Z"
  }
}
```

### Cookies

Sets `admin_token` httpOnly cookie (24 hour expiry)

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing username or password |
| 401 | Invalid credentials |

---

## POST /admin/auth/logout

Admin logout (clears cookie).

### Request Example (cURL)

```bash
curl -X POST "http://localhost:3100/admin/auth/logout" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/auth/logout', {
  method: 'POST',
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "message": "Logged out successfully"
}
```

---

## GET /admin/auth/me

Get current authenticated admin user.

**Authentication:** Required (valid JWT cookie)

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/auth/me" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/auth/me', {
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "user": {
    "id": 1,
    "username": "admin",
    "email": "admin@example.com",
    "created_at": "2026-02-27T10:00:00.000Z",
    "last_login": "2026-02-27T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | No token, invalid token, or expired token |

### Error Response (401 Unauthorized)

```json
{
  "error": "Unauthorized"
}
```
```

**Step 2: Verify file created**

Run: `cat backend/docs/api/admin-auth.md`
Expected: Shows authentication documentation

**Step 3: Commit**

```bash
git add backend/docs/api/admin-auth.md
git commit -m "docs: add admin authentication API documentation"
```

---

## Task 4: Write Language CRUD Documentation

**Files:**
- Create: `backend/docs/api/admin-languages.md`

**Step 1: Write the documentation file**

Create `backend/docs/api/admin-languages.md` with complete CRUD documentation following the template. See [Reference Implementation](#reference-implementation) for full content.

**Key sections to include:**
- GET /admin/languages (with pagination, search, is_active filter)
- GET /admin/languages/:id
- POST /admin/languages
- PUT /admin/languages/:id
- DELETE /admin/languages/:id (soft delete)

**Step 2: Commit**

```bash
git add backend/docs/api/admin-languages.md
git commit -m "docs: add language CRUD API documentation"
```

---

## Task 5: Write Website CRUD Documentation

**Files:**
- Create: `backend/docs/api/admin-websites.md`

**Step 1: Write the documentation file**

Create `backend/docs/api/admin-websites.md` with complete CRUD documentation including:
- GET /admin/websites (with pagination, search, is_active, language_id filters)
- GET /admin/websites/:id
- POST /admin/websites
- PUT /admin/websites/:id
- DELETE /admin/websites/:id (soft delete)

**Request body fields:** name, url, language_id, use_browser, search_endpoint, is_nsfw

**Step 2: Commit**

```bash
git add backend/docs/api/admin-websites.md
git commit -m "docs: add website CRUD API documentation"
```

---

## Task 6: Write Komik CRUD Documentation

**Files:**
- Create: `backend/docs/api/admin-komiks.md`

**Step 1: Write the documentation file**

Create `backend/docs/api/admin-komiks.md` with complete CRUD documentation including:
- GET /admin/komiks (with pagination, search, is_active, language_id, status filters)
- GET /admin/komiks/:id
- GET /admin/komiks/:id/websites (get all website mappings)
- POST /admin/komiks
- PUT /admin/komiks/:id
- DELETE /admin/komiks/:id (soft delete)

**Request body fields:** title, synopsis, language_id, cover_image, status

**Step 2: Commit**

```bash
git add backend/docs/api/admin-komiks.md
git commit -m "docs: add komik CRUD API documentation"
```

---

## Task 7: Write Komik-Website Mappings Documentation

**Files:**
- Create: `backend/docs/api/admin-mappings.md`

**Step 1: Write the documentation file**

Create `backend/docs/api/admin-mappings.md` with complete CRUD documentation including:
- GET /admin/komik-websites (with pagination, komik_id, website_id filters)
- GET /admin/komik-websites/:id
- POST /admin/komik-websites
- PUT /admin/komik-websites/:id
- DELETE /admin/komik-websites/:id (hard delete)

**Request body fields:** komik_id, website_id, url, total_chapters, last_checked_at

**Special note:** Returns joined data with komik_title and website_name

**Step 2: Commit**

```bash
git add backend/docs/api/admin-mappings.md
git commit -m "docs: add komik-website mapping API documentation"
```

---

## Task 8: Write API Index

**Files:**
- Create: `backend/docs/api/index.md`

**Step 1: Write the index file**

Create `backend/docs/api/index.md`:

```markdown
# Cuma Baca API Documentation

Complete API reference for the Cuma Baca backend.

## Base URL

- **Development:** `http://localhost:3100`
- **Production:** Configure via environment

## Authentication

Admin endpoints require JWT authentication via `admin_token` httpOnly cookie.

See [Admin Authentication](./admin-auth.md) for details.

## API Sections

### Public APIs

| Section | Description | Endpoints |
|---------|-------------|-----------|
| [Comic Scraping](./komik-scraping.md) | Scrape comic data from supported websites | 6 endpoints |

### Admin APIs

| Section | Description | Endpoints | Authentication |
|---------|-------------|-----------|----------------|
| [Admin Auth](./admin-auth.md) | Admin authentication | 3 endpoints | None |
| [Languages](./admin-languages.md) | Language CRUD | 5 endpoints | Required |
| [Websites](./admin-websites.md) | Website CRUD | 5 endpoints | Required |
| [Komiks](./admin-komiks.md) | Komik CRUD | 5 endpoints | Required |
| [Mappings](./admin-mappings.md) | Komik-Website mappings | 6 endpoints | Required |

## Special Features

### NSFW Mode

Some endpoints support NSFW content via `mode=secret` query parameter:
- GET /komik/chapters?mode=secret
- GET /komik/data?mode=secret

NSFW websites require secret mode to be enabled.

### Caching

Scraping endpoints cache responses for 24 hours in MongoDB.

### Pagination

List endpoints support:
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

Response includes:
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

## OpenAPI Specification

See [../openapi.yaml](../openapi.yaml) for OpenAPI 3.0 specification.

## Postman Collection

See [../postman-collection.json](../postman-collection.json) for Postman import.

## Interactive Documentation

When running locally, visit `/api-docs` for interactive Swagger UI.
```

**Step 2: Commit**

```bash
git add backend/docs/api/index.md
git commit -m "docs: add API documentation index"
```

---

## Task 9: Create OpenAPI Specification

**Files:**
- Create: `backend/docs/openapi.yaml`

**Step 1: Write the OpenAPI spec**

Create `backend/docs/openapi.yaml` with complete OpenAPI 3.0 specification.

The spec must include:
- Info section (title, version, description)
- Servers (dev and production)
- Tags (Comic Scraping, Cache, Auth, Languages, Websites, Komiks, Mappings)
- Security schemes (cookieAuth)
- All 30 paths with parameters, request bodies, responses
- Component schemas for reusable types

**Step 2: Validate the spec**

Run: `npx @apidevtools/swagger-cli validate backend/docs/openapi.yaml`
Expected: No errors

**Step 3: Commit**

```bash
git add backend/docs/openapi.yaml
git commit -m "docs: add OpenAPI 3.0 specification"
```

---

## Task 10: Create Postman Collection

**Files:**
- Create: `backend/docs/postman-collection.json`

**Step 1: Write the Postman collection**

Create `backend/docs/postman-collection.json` following Postman Collection v2.1 format.

Structure:
- Folder: Comic Scraping (6 requests)
- Folder: Admin Auth (3 requests)
- Folder: Languages (5 requests)
- Folder: Websites (5 requests)
- Folder: Komiks (5 requests)
- Folder: Mappings (6 requests)

Include:
- Environment variables: `{{baseUrl}}`, `{{admin_token}}`
- Pre-request script for auth
- Tests to save token after login
- Documentation in request descriptions

**Step 2: Validate JSON**

Run: `jq empty backend/docs/postman-collection.json`
Expected: No errors

**Step 3: Commit**

```bash
git add backend/docs/postman-collection.json
git commit -m "docs: add Postman collection"
```

---

## Task 11: Add Swagger UI (Optional)

**Files:**
- Modify: `backend/package.json`
- Create: `backend/swagger-ui.js`

**Step 1: Install dependencies**

```bash
cd backend
pnpm add swagger-ui-express yamljs
```

**Step 2: Create Swagger UI middleware**

Create `backend/swagger-ui.js`:

```javascript
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const path = require('path');

const openapi = YAML.load(path.join(__dirname, 'docs/openapi.yaml'));

module.exports = {
  serve: swaggerUi.serve,
  setup: swaggerUi.setup(openapi, {
    customSiteTitle: 'Cuma Baca API Docs',
    customCss: '.swagger-ui .topbar { display: none }'
  })
};
```

**Step 3: Register middleware in app.js**

Add to `backend/app.js` after existing middleware:

```javascript
const swaggerUi = require('./swagger-ui');

// Serve API docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup);
```

**Step 4: Verify**

Run: `pnpm run dev:backend`
Visit: `http://localhost:3100/api-docs`
Expected: Swagger UI loads with all endpoints

**Step 5: Commit**

```bash
git add backend/package.json backend/swagger-ui.js backend/app.js
git commit -m "docs: add Swagger UI at /api-docs"
```

---

## Task 12: Final Verification

**Step 1: Verify all files exist**

Run: `ls -la backend/docs/api/ backend/docs/*.yaml backend/docs/*.json`

Expected output:
```
backend/docs/api/
├── admin-auth.md
├── admin-komiks.md
├── admin-languages.md
├── admin-mappings.md
├── admin-websites.md
├── komik-scraping.md
└── index.md

backend/docs/openapi.yaml
backend/docs/postman-collection.json
```

**Step 2: Test Swagger UI (if enabled)**

Run: `curl -s http://localhost:3100/api-docs | grep -o "swagger-ui" | head -1`
Expected: Matches "swagger-ui"

**Step 3: Final commit**

```bash
git add backend/docs/
git commit -m "docs: complete API documentation"
```

---

## Reference Implementation

### admin-languages.md Full Content

```markdown
# Languages API

CRUD operations for language management.

**Authentication:** Required (JWT cookie)

---

## GET /admin/languages

Get paginated list of languages.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page |
| `search` | string | No | - | Search in name/code |
| `is_active` | boolean | No | - | Filter by active status |

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/languages?page=1&limit=20" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/languages?page=1&limit=20', {
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "data": [
    {
      "id": 1,
      "name": "Japanese",
      "code": "ja",
      "is_active": 1,
      "created_at": "2026-02-27T10:00:00.000Z",
      "updated_at": "2026-02-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "totalPages": 1
  }
}
```

---

## GET /admin/languages/:id

Get language by ID.

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/languages/1" \
  -b cookies.txt
```

### Response (200 OK)

```json
{
  "data": {
    "id": 1,
    "name": "Japanese",
    "code": "ja",
    "is_active": 1,
    "created_at": "2026-02-27T10:00:00.000Z",
    "updated_at": "2026-02-27T10:00:00.000Z"
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 404 | Language not found |

---

## POST /admin/languages

Create a new language.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Language name |
| `code` | string | Yes | ISO language code |

### Request Example (cURL)

```bash
curl -X POST "http://localhost:3100/admin/languages" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Japanese","code":"ja"}'
```

### Response (201 Created)

```json
{
  "data": {
    "id": 1,
    "name": "Japanese",
    "code": "ja"
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing required fields |
| 409 | Language code already exists |

---

## PUT /admin/languages/:id

Update a language.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Language name |
| `code` | string | No | ISO language code |
| `is_active` | boolean | No | Active status |

### Request Example (cURL)

```bash
curl -X PUT "http://localhost:3100/admin/languages/1" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{"name":"Japanese (Updated)","code":"ja","is_active":true}'
```

### Response (200 OK)

```json
{
  "data": {
    "id": 1,
    "name": "Japanese (Updated)",
    "code": "ja",
    "is_active": 1,
    "updated_at": "2026-02-27T10:00:00.000Z"
  }
}
```

---

## DELETE /admin/languages/:id

Soft delete a language (sets `is_active=0`).

### Request Example (cURL)

```bash
curl -X DELETE "http://localhost:3100/admin/languages/1" \
  -b cookies.txt
```

### Response (200 OK)

```json
{
  "message": "Language deleted successfully"
}
```
```
```

---

**Total Estimated Time:** 60-90 minutes

**Dependencies:** None (documentation-only task)

**Skills Referenced:**
- @superpowers:verification-before-completion - Before claiming completion
