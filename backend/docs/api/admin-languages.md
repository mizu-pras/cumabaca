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
| `is_active` | string | No | - | Filter by active status ("true" or "false") |

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

**Note:** `is_active` is returned as an integer (0 or 1) in responses.

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 500 | Internal server error |

---

## GET /admin/languages/:id

Get language by ID.

### Request Example (cURL)

```bash
curl "http://localhost:3100/admin/languages/1" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/languages/1', {
  credentials: 'include'
});
const data = await response.json();
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

**Note:** `is_active` is returned as an integer (0 or 1) in responses.

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 404 | Language not found |
| 500 | Internal server error |

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

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/languages', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Japanese',
    code: 'ja'
  })
});
const data = await response.json();
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
| 401 | Unauthorized - missing or invalid token |
| 409 | Language code already exists |
| 500 | Internal server error |

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

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/languages/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: 'Japanese (Updated)',
    code: 'ja',
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
    "name": "Japanese (Updated)",
    "code": "ja",
    "is_active": 1,
    "updated_at": "2026-02-27T10:00:00.000Z"
  }
}
```

**Note:** Request accepts `is_active` as boolean (true/false), but response returns it as integer (0 or 1).

### Error Responses

| Status | Description |
|--------|-------------|
| 400 | Invalid request data |
| 401 | Unauthorized - missing or invalid token |
| 404 | Language not found |
| 500 | Internal server error |

---

## DELETE /admin/languages/:id

Soft delete a language (sets `is_active=0`).

### Request Example (cURL)

```bash
curl -X DELETE "http://localhost:3100/admin/languages/1" \
  -b cookies.txt
```

### Request Example (JavaScript)

```javascript
const response = await fetch('http://localhost:3100/admin/languages/1', {
  method: 'DELETE',
  credentials: 'include'
});
const data = await response.json();
```

### Response (200 OK)

```json
{
  "message": "Language deleted successfully"
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 401 | Unauthorized - missing or invalid token |
| 404 | Language not found |
| 500 | Internal server error |
