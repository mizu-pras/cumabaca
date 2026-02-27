# Websites API

CRUD operations for website management.

**Authentication:** Required (JWT cookie)

---

## GET /admin/websites

Get paginated list of websites.

### Query Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `page` | integer | No | 1 | Page number |
| `limit` | integer | No | 20 | Items per page |
| `search` | string | No | - | Search in name or url |
| `is_active` | string | No | - | Filter by active status ("true" or "false") |
| `language_id` | integer | No | - | Filter by language ID |

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/websites?page=1&limit=20" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/websites?page=1&limit=20', {
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
      "name": "Komiku",
      "url": "https://komiku.org",
      "language_id": 1,
      "language_name": "Japanese",
      "language_code": "ja",
      "use_browser": 0,
      "search_endpoint": null,
      "is_nsfw": 0,
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

**Note:** Boolean fields (`use_browser`, `is_nsfw`, `is_active`) are returned as integers (0 or 1) in responses. Language fields (`language_name`, `language_code`) are included via LEFT JOIN.

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 500 | Internal server error |

---

## GET /admin/websites/:id

Get website by ID.

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/websites/1" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/websites/1', {
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "data": {
    "id": 1,
    "name": "Komiku",
    "url": "https://komiku.org",
    "language_id": 1,
    "language_name": "Japanese",
    "language_code": "ja",
    "use_browser": 0,
    "search_endpoint": null,
    "is_nsfw": 0,
    "is_active": 1,
    "created_at": "2026-02-27T10:00:00.000Z",
    "updated_at": "2026-02-27T10:00:00.000Z"
  }
}
```

**Note:** Boolean fields (`use_browser`, `is_nsfw`, `is_active`) are returned as integers (0 or 1) in responses. Language fields (`language_name`, `language_code`) are included via LEFT JOIN.

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 404 | Website not found |
| 500 | Internal server error |

---

## POST /admin/websites

Create a new website.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Website name |
| `url` | string | Yes | Website base URL |
| `language_id` | integer | No | Language ID (foreign key) |
| `use_browser` | boolean | No | Whether headless browser is required (default: false) |
| `search_endpoint` | string | No | Custom search endpoint URL |
| `is_nsfw` | boolean | No | NSFW content flag (default: false) |

### Request Example (cURL)

```bash
curl -X POST "http://localhost:3100/admin/websites" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Komiku",
    "url": "https://komiku.org",
    "language_id": 1,
    "use_browser": false,
    "search_endpoint": null,
    "is_nsfw": false
  }'
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/websites', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Komiku',
    url: 'https://komiku.org',
    language_id: 1,
    use_browser: false,
    search_endpoint: null,
    is_nsfw: false
  })
});
const data = await response.json();
```

### Response (201 Created)

```json
{
  "data": {
    "id": 1,
    "name": "Komiku",
    "url": "https://komiku.org",
    "language_id": 1,
    "use_browser": false,
    "search_endpoint": null,
    "is_nsfw": false
  }
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Missing required fields (name, url) |
| 401 | Unauthorized - missing or invalid token |
| 500 | Internal server error |

---

## PUT /admin/websites/:id

Update a website.

### Request Body

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | No | Website name |
| `url` | string | No | Website base URL |
| `language_id` | integer | No | Language ID (foreign key) |
| `use_browser` | boolean | No | Whether headless browser is required |
| `search_endpoint` | string | No | Custom search endpoint URL |
| `is_nsfw` | boolean | No | NSFW content flag |
| `is_active` | boolean | No | Active status |

### Request Example (cURL)

```bash
curl -X PUT "http://localhost:3100/admin/websites/1" \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "name": "Komiku (Updated)",
    "url": "https://komiku.org",
    "language_id": 1,
    "use_browser": false,
    "search_endpoint": null,
    "is_nsfw": false,
    "is_active": true
  }'
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/websites/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Komiku (Updated)',
    url: 'https://komiku.org',
    language_id: 1,
    use_browser: false,
    search_endpoint: null,
    is_nsfw: false,
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
    "name": "Komiku (Updated)",
    "url": "https://komiku.org",
    "language_id": 1,
    "language_name": "Japanese",
    "language_code": "ja",
    "use_browser": 0,
    "search_endpoint": null,
    "is_nsfw": 0,
    "is_active": 1,
    "created_at": "2026-02-27T10:00:00.000Z",
    "updated_at": "2026-02-27T10:30:00.000Z"
  }
}
```

**Note:** Request accepts boolean fields as booleans (true/false), but response returns them as integers (0 or 1). Language fields (`language_name`, `language_code`) are included via LEFT JOIN.

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request data |
| 401 | Unauthorized - missing or invalid token |
| 404 | Website not found |
| 500 | Internal server error |

---

## DELETE /admin/websites/:id

Soft delete a website (sets `is_active=0`).

### Request Example (cURL)

```bash
curl -X DELETE "http://localhost:3100/admin/websites/1" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/websites/1', {
  method: 'DELETE',
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "message": "Website deleted successfully"
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 404 | Website not found |
| 500 | Internal server error |
