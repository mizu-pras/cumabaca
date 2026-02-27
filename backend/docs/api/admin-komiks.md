# Komiks API

CRUD operations for komik (comic) management.

**Authentication:** Required (JWT cookie)

---

## GET /admin/komiks

Get paginated list of komiks.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page |
| `search` | string | No | - | Search in title or synopsis |
| `is_active` | string | No | - | Filter by active status ("true" or "false") |
| `language_id` | integer | No | - | Filter by language ID |
| `status` | string | No | - | Filter by publication status ("ongoing", "completed", "hiatus") |

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/komiks?page=1&limit=20" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komiks?page=1&limit=20', {
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
      "title": "One Piece",
      "synopsis": "Follows the adventures of Monkey D. Luffy...",
      "language_id": 1,
      "language_name": "Japanese",
      "language_code": "ja",
      "cover_image": "https://example.com/covers/one-piece.jpg",
      "status": "ongoing",
      "is_active": 1,
      "created_at": "2026-02-27T10:00:00.000Z",
      "updated_at": "2026-02-27T10:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

**Note:** `is_active` is returned as an integer (0 or 1) in responses. Language fields (`language_name`, `language_code`) are included via LEFT JOIN. Results are ordered by `id` DESC (newest first).

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 500 | Internal server error |

---

## GET /admin/komiks/:id

Get komik by ID.

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/komiks/1" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komiks/1', {
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "data": {
    "id": 1,
    "title": "One Piece",
    "synopsis": "Follows the adventures of Monkey D. Luffy...",
    "language_id": 1,
    "language_name": "Japanese",
    "language_code": "ja",
    "cover_image": "https://example.com/covers/one-piece.jpg",
    "status": "ongoing",
    "is_active": 1,
    "created_at": "2026-02-27T10:00:00.000Z",
    "updated_at": "2026-02-27T10:00:00.000Z"
  }
}
```

**Note:** `is_active` is returned as an integer (0 or 1) in responses. Language fields (`language_name`, `language_code`) are included via LEFT JOIN.

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 404 | Komik not found |
| 500 | Internal server error |

---

## GET /admin/komiks/:id/websites

Get all website mappings for a specific komik.

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/komiks/1/websites" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komiks/1/websites', {
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
| 404 | Komik not found |
| 500 | Internal server error |

---

## POST /admin/komiks

Create a new komik.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | Yes | Komik title |
| `synopsis` | string | No | Komik synopsis/description |
| `language_id` | integer | No | Language ID (foreign key) |
| `cover_image` | string | No | Cover image URL |
| `status` | string | No | Publication status (default: "ongoing") |

**Status values:** `"ongoing"`, `"completed"`, `"hiatus"`

### Request Example (cURL)

```bash
curl -X POST "http://localhost:3100/admin/komiks" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "One Piece",
    "synopsis": "Follows the adventures of Monkey D. Luffy...",
    "language_id": 1,
    "cover_image": "https://example.com/covers/one-piece.jpg",
    "status": "ongoing"
  }'
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komiks', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'One Piece',
    synopsis: 'Follows the adventures of Monkey D. Luffy...',
    language_id: 1,
    cover_image: 'https://example.com/covers/one-piece.jpg',
    status: 'ongoing'
  })
});
const data = await response.json();
```

### Response (201 Created)

```json
{
  "data": {
    "id": 1,
    "title": "One Piece",
    "synopsis": "Follows the adventures of Monkey D. Luffy...",
    "language_id": 1,
    "cover_image": "https://example.com/covers/one-piece.jpg",
    "status": "ongoing"
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing required field (title) |
| 401 | Unauthorized - missing or invalid token |
| 500 | Internal server error |

---

## PUT /admin/komiks/:id

Update a komik.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Komik title |
| `synopsis` | string | No | Komik synopsis/description |
| `language_id` | integer | No | Language ID (foreign key) |
| `cover_image` | string | No | Cover image URL |
| `status` | string | No | Publication status |
| `is_active` | boolean | No | Active status |

**Status values:** `"ongoing"`, `"completed"`, `"hiatus"`

### Request Example (cURL)

```bash
curl -X PUT "http://localhost:3100/admin/komiks/1" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "title": "One Piece (Updated)",
    "synopsis": "Updated synopsis...",
    "language_id": 1,
    "cover_image": "https://example.com/covers/one-piece-new.jpg",
    "status": "ongoing",
    "is_active": true
  }'
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komiks/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    title: 'One Piece (Updated)',
    synopsis: 'Updated synopsis...',
    language_id: 1,
    cover_image: 'https://example.com/covers/one-piece-new.jpg',
    status: 'ongoing',
    is_active: true
  })
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "data": {
    "id": 1,
    "title": "One Piece (Updated)",
    "synopsis": "Updated synopsis...",
    "language_id": 1,
    "language_name": "Japanese",
    "language_code": "ja",
    "cover_image": "https://example.com/covers/one-piece-new.jpg",
    "status": "ongoing",
    "is_active": 1,
    "created_at": "2026-02-27T10:00:00.000Z",
    "updated_at": "2026-02-27T11:30:00.000Z"
  }
}
```

**Note:** Request accepts `is_active` as boolean (true/false), but response returns it as integer (0 or 1). Language fields (`language_name`, `language_code`) are included via LEFT JOIN. `updated_at` is automatically updated to current timestamp.

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request data |
| 401 | Unauthorized - missing or invalid token |
| 404 | Komik not found |
| 500 | Internal server error |

---

## DELETE /admin/komiks/:id

Soft delete a komik (sets `is_active=0`).

### Request Example (cURL)

```bash
curl -X DELETE "http://localhost:3100/admin/komiks/1" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/komiks/1', {
  method: 'DELETE',
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "message": "Komik deleted successfully"
}
```

**Note:** This is a soft delete. The record is not removed from the database but marked as inactive by setting `is_active=0`.

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 404 | Komik not found |
| 500 | Internal server error |
