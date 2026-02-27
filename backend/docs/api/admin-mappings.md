# Komik-Website Mappings API

CRUD operations for managing komik-to-website mappings. This junction table links komiks with their source websites.

**Authentication:** Required (JWT cookie)

---

## GET /admin/komik-websites

Get paginated list of komik-website mappings.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page |
| `komik_id` | integer | No | - | Filter by komik ID |
| `website_id` | integer | No | - | Filter by website ID |

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/komik-websites?page=1&limit=20" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komik-websites?page=1&limit=20', {
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
      "komik_id": 1,
      "website_id": 1,
      "url": "https://komiku.org/manga/one-piece",
      "total_chapters": 1050,
      "komik_title": "One Piece",
      "website_name": "Komiku",
      "website_url": "https://komiku.org",
      "created_at": "2026-02-27T10:00:00.000Z",
      "updated_at": "2026-02-27T10:00:00.000Z"
    }
  ]
}
```

**Note:** Related komik and website fields (`komik_title`, `website_name`, `website_url`) are included via LEFT JOIN. Results are ordered by `id` DESC (newest first).

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 500 | Internal server error |

---

## GET /admin/komik-websites/:id

Get a specific komik-website mapping by ID.

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/komik-websites/1" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komik-websites/1', {
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "data": {
    "id": 1,
    "komik_id": 1,
    "website_id": 1,
    "url": "https://komiku.org/manga/one-piece",
    "total_chapters": 1050,
    "komik_title": "One Piece",
    "website_name": "Komiku",
    "website_url": "https://komiku.org",
    "created_at": "2026-02-27T10:00:00.000Z",
    "updated_at": "2026-02-27T10:00:00.000Z"
  }
}
```

**Note:** Related komik and website fields (`komik_title`, `website_name`, `website_url`) are included via LEFT JOIN.

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 404 | Mapping not found |
| 500 | Internal server error |

---

## POST /admin/komik-websites

Create a new komik-website mapping.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `komik_id` | integer | Yes | Komik ID (foreign key) |
| `website_id` | integer | Yes | Website ID (foreign key) |
| `url` | string | Yes | URL to the komik on the source website |
| `total_chapters` | integer | No | Total number of chapters available (default: 0) |

### Request Example (cURL)

```bash
curl -X POST "http://localhost:3100/admin/komik-websites" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "komik_id": 1,
    "website_id": 1,
    "url": "https://komiku.org/manga/one-piece",
    "total_chapters": 1050
  }'
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komik-websites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    komik_id: 1,
    website_id: 1,
    url: 'https://komiku.org/manga/one-piece',
    total_chapters: 1050
  })
});
const data = await response.json();
```

### Response (201 Created)

```json
{
  "data": {
    "id": 1,
    "komik_id": 1,
    "website_id": 1,
    "url": "https://komiku.org/manga/one-piece",
    "total_chapters": 1050
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing required fields (komik_id, website_id, url) |
| 404 | Komik or website not found |
| 409 | This komik is already linked to this website (duplicate mapping) |
| 401 | Unauthorized - missing or invalid token |
| 500 | Internal server error |

---

## PUT /admin/komik-websites/:id

Update an existing komik-website mapping.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `url` | string | No | URL to the komik on the source website |
| `total_chapters` | integer | No | Total number of chapters available |
| `last_checked_at` | string | No | ISO 8601 timestamp of last chapter check |

### Request Example (cURL)

```bash
curl -X PUT "http://localhost:3100/admin/komik-websites/1" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "url": "https://komiku.org/manga/one-piece",
    "total_chapters": 1055,
    "last_checked_at": "2026-02-27T12:00:00.000Z"
  }'
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komik-websites/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    url: 'https://komiku.org/manga/one-piece',
    total_chapters: 1055,
    last_checked_at: '2026-02-27T12:00:00.000Z'
  })
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "data": {
    "id": 1,
    "komik_id": 1,
    "website_id": 1,
    "url": "https://komiku.org/manga/one-piece",
    "total_chapters": 1055,
    "komik_title": "One Piece",
    "website_name": "Komiku",
    "website_url": "https://komiku.org",
    "created_at": "2026-02-27T10:00:00.000Z",
    "updated_at": "2026-02-27T12:00:00.000Z"
  }
}
```

**Note:** Related komik and website fields (`komik_title`, `website_name`, `website_url`) are included via LEFT JOIN. `updated_at` is automatically updated to current timestamp. `komik_id` and `website_id` cannot be modified after creation.

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request data |
| 401 | Unauthorized - missing or invalid token |
| 404 | Mapping not found |
| 500 | Internal server error |

---

## DELETE /admin/komik-websites/:id

Hard delete a komik-website mapping.

### Request Example (cURL)

```bash
curl -X DELETE "http://localhost:3100/admin/komik-websites/1" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komik-websites/1', {
  method: 'DELETE',
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "message": "Mapping deleted successfully"
}
```

**Note:** This is a hard delete. The record is permanently removed from the database.

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 404 | Mapping not found |
| 500 | Internal server error |
