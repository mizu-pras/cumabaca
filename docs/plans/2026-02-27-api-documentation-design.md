# API Documentation Design

**Date:** 2026-02-27
**Author:** Claude Code
**Status:** Approved

## Overview

Create comprehensive API documentation for the Cuma Baca backend, covering all 30 endpoints across comic scraping, admin authentication, and CRUD operations for languages, websites, komiks, and mappings.

## Goals

1. Document all API endpoints for internal developers
2. Provide cURL examples and code snippets for each endpoint
3. Support multiple formats: Markdown, OpenAPI, and Postman Collection
4. Organize documentation by feature/route group
5. Optionally serve interactive Swagger UI

## Documentation Formats

### 1. Markdown Files (Primary)

Location: `backend/docs/api/`

| File | Description | Endpoints |
|------|-------------|-----------|
| `komik-scraping.md` | Public scraping API | 6 routes |
| `admin-auth.md` | Admin authentication | 3 routes |
| `admin-languages.md` | Language CRUD | 5 routes |
| `admin-websites.md` | Website CRUD | 5 routes |
| `admin-komiks.md` | Komik CRUD | 5 routes |
| `admin-mappings.md` | Komik-Website mappings | 6 routes |
| `index.md` | Overview with links | - |

### 2. OpenAPI 3.0 Specification

Location: `backend/docs/openapi.yaml`

- Full OpenAPI 3.0 compliant spec
- Tags matching feature groups
- Cookie-based authentication scheme
- Reusable schemas for pagination and errors
- Multiple server definitions (dev/prod)

### 3. Postman Collection

Location: `backend/docs/postman-collection.json`

- Organized by folders matching feature split
- Environment variables: `{{baseUrl}}`, `{{admin_token}}`
- Pre-request scripts for auth token management
- Tests to save tokens after login
- Documentation tabs populated with descriptions

### 4. Swagger UI (Optional)

- Serve at `/api-docs` using `swagger-ui-express`
- Interactive "Try it out" functionality
- Auto-loaded from `openapi.yaml`

## Content Template

Each endpoint will include:

- **Description** - Brief explanation of purpose
- **Authentication** - Required/not required with method
- **Cache** - Duration if applicable
- **Parameters** - Query params or request body with types
- **Request Examples** - cURL and Node.js
- **Response Examples** - 200 OK with sample JSON
- **Error Responses** - Table of status codes and descriptions

Special sections where applicable:
- **NSFW Mode** - `mode=secret` parameter behavior
- **Pagination** - `page`, `limit`, and response structure
- **Filtering** - `search`, `is_active`, etc.

## File Structure

```
backend/docs/
├── api/
│   ├── komik-scraping.md
│   ├── admin-auth.md
│   ├── admin-languages.md
│   ├── admin-websites.md
│   ├── admin-komiks.md
│   ├── admin-mappings.md
│   └── index.md
├── openapi.yaml
├── postman-collection.json
└── swagger-ui.js (optional)
```

## Dependencies

For Swagger UI (optional):
- `swagger-ui-express` - Express middleware
- `yamljs` - Load YAML as JSON

## API Endpoints Summary

| Category | Prefix | Routes | Authentication |
|----------|--------|--------|----------------|
| Comic Scraping | `/komik/*` | 6 | None (with NSFW mode) |
| Cache | `/komik/cache/*` | 3 | None |
| Admin Auth | `/admin/auth/*` | 3 | None |
| Languages | `/admin/languages` | 5 | JWT Cookie |
| Websites | `/admin/websites` | 5 | JWT Cookie |
| Komiks | `/admin/komiks` | 5 | JWT Cookie |
| Mappings | `/admin/komik-websites` | 6 | JWT Cookie |

## Special Behaviors to Document

1. **NSFW/Secret Mode** - `mode=secret` query parameter for NSFW content
2. **Caching** - 24-hour MongoDB cache for scraping endpoints
3. **Authentication** - JWT token via `admin_token` httpOnly cookie
4. **Image Proxy** - CORS bypass for hotlink-protected images
5. **Pagination** - Standard `page`, `limit` parameters with `pagination` response object
6. **Soft Delete** - Languages, websites, and komiks use `is_active` flag
7. **Hard Delete** - Mappings use permanent deletion

## Implementation Plan

See: [2026-02-27-api-documentation-implementation.md](./2026-02-27-api-documentation-implementation.md)
