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
**Authentication:** No authentication required

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
  "data": [
    {
      "chapter": "Chapter 1",
      "url": "https://komiku.org/chapter/one-piece-1"
    }
  ]
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 403 | NSFW content without `mode=secret` |
| 404 | No chapters found |
| 500 | Server error during scraping |

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
**Authentication:** No authentication required

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
  "data": [
    "https://example.com/image1.jpg",
    "https://example.com/image2.jpg"
  ]
}
```

### Error Responses

| Status | Description |
|--------|-------------|
| 403 | NSFW content without `mode=secret` |
| 404 | Chapter not found or no images available |
| 500 | Server error during scraping |

---

## GET /komik/image

Image proxy to bypass CORS and hotlink protection.

**No Cache** (sets client cache headers for 1 day)
**Authentication:** No authentication required

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
| 404 | Image not found or unable to fetch |
| 500 | Server error during image proxy |

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

**Field Descriptions:**

| Field | Type | Description |
|-------|------|-------------|
| `url` | string | Original comic page URL |
| `title` | string | Comic title |
| `domain` | string | Website domain (e.g., komiku.org) |
| `cachedAt` | string | ISO 8601 timestamp when cached |
| `expiresAt` | string | ISO 8601 timestamp when cache expires |
| `isNsfw` | boolean | Whether `mode=secret` was used to access this content |

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
