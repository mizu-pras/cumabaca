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
