# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Cuma Baca (meaning "Just Read") is a minimalist comic scraper that fetches content from multiple comic websites (komiku.org, komikcast.fit, sektedoujin.cc) and provides a clean, distraction-free reading experience.

**Monorepo:** pnpm workspace with 4 workspaces - `backend`, `scraper`, `frontend`, `admin`

**IMPORTANT:** This project requires **pnpm** as the package manager. npm commands will fail.

## System Requirements

- **Node.js:** >=18.0.0
- **pnpm:** Required for workspace commands
- **Podman** (or Docker): For backend development with MongoDB

## Development Commands

```bash
# Install all dependencies (root + all workspaces)
pnpm install

# Start all services (Backend + Frontend + Admin)
pnpm run dev

# Individual workspaces
pnpm run dev:backend    # Backend with MongoDB (podman-compose), port 3100
pnpm run dev:scraper    # Scraper service, port 3200
pnpm run dev:frontend   # Frontend (Vite), port 5173
pnpm run dev:admin      # Admin panel (Vite), port 5174
pnpm run dev:all        # All services (Scraper + Backend + Frontend + Admin)

# Build
pnpm run build
```

## Workspace Overview

| Workspace | Port | Purpose | CLAUDE.md |
|-----------|------|---------|-----------|
| `backend/` | 3100 | Express API + proxy to scraper | [backend/CLAUDE.md](./backend/CLAUDE.md) |
| `scraper/` | 3200 | Scraping service | [scraper/CLAUDE.md](./scraper/CLAUDE.md) |
| `frontend/` | 5173 | Public comic reader (React 19 + Vite) | [frontend/CLAUDE.md](./frontend/CLAUDE.md) |
| `admin/` | 5174 | Admin panel for managing content | [admin/CLAUDE.md](./admin/CLAUDE.md) |

## Environment Variables

### Backend (`backend/.env`)
| Variable | Default |
|----------|---------|
| `NODE_ENV` | `development` |
| `PORT` | `3100` |
| `MONGODB_URI` | `mongodb://localhost:27017/cumabaca` |
| `CACHE_TTL` | `86400` (24 hours) |
| `CORS_ORIGIN` | `http://localhost:5173` |
| `JWT_SECRET` | `change-this-secret-in-production` |
| `ADMIN_JWT_EXPIRY` | `24h` |
| `SCRAPER_URL` | `http://localhost:3200` |
| `SCRAPER_TIMEOUT` | `30000` |
| `SQLITE_PATH` | `./data/admin.db` |

### Scraper (`scraper/.env`)
| Variable | Default |
|----------|---------|
| `NODE_ENV` | `development` |
| `PORT` | `3200` |
| `MONGODB_URI` | `mongodb://localhost:27017/cumabaca` |
| `SCRAPER_CACHE_TTL` | `172800` (48 hours) |

### Frontend (`frontend/.env`)
| Variable | Default |
|----------|---------|
| `VITE_API_URL` | `http://localhost:3100` |

### Admin (`admin/.env`)
| Variable | Default |
|----------|---------|
| `VITE_API_URL` | `http://localhost:3100` |

## Project Structure

```
cumabaca/
├── package.json                   # Root workspace config
├── pnpm-workspace.yaml            # Workspace definition
├── CLAUDE.md                      # This file
├── README.md                      # User documentation
├── DOCKER.md                      # Docker documentation
│
├── backend/                       # Express API
│   ├── CLAUDE.md                  # Backend-specific guidance
│   ├── routes/
│   │   ├── komik.js               # Public comic scraping API (proxies to scraper)
│   │   ├── admin.js               # Admin auth
│   │   ├── health.js              # Health check with scraper status
│   │   └── admin/                 # Admin CRUD routes (languages, websites, komiks)
│   ├── controllers/               # Business logic
│   ├── middleware/                # Auth middleware (JWT) and scraper client
│   ├── models/                   # SQLite models (AdminUser, Komik, Language, Website, KomikWebsite)
│   ├── cli/                      # Admin CLI tool
│   └── scripts/                  # Setup, migration, and debug scripts
│
├── scraper/                       # Scraping service
│   ├── CLAUDE.md                  # Scraper-specific guidance
│   ├── routes/
│   │   └── scrape.js              # Scraping API endpoints
│   ├── controllers/               # Scraping logic
│   ├── scrapers/                  # Website scraper implementations
│   ├── utils/                     # Cache and fetch utilities
│   └── config/                    # Website configurations
│
├── frontend/                      # Public comic reader
│   ├── CLAUDE.md                  # Frontend-specific guidance
│   └── src/
│       ├── pages/                 # Reader, Cached, Secret, Websites, About
│       └── stores/                # Zustand state (nsfw, reader)
│
├── admin/                         # Admin panel
│   ├── CLAUDE.md                  # Admin-specific guidance
│   └── src/
│       ├── pages/                 # Dashboard, Languages, Websites, Komiks
│       └── stores/                # Zustand state (auth)
│
├── examples/                      # Reference HTML for scrapers
└── screenshot/                    # Device UI reference images
```

## API Endpoints

### Public API
- `GET /komik/chapters?url=<comic-url>` - Get chapter list
- `GET /komik/data?url=<chapter-url>` - Get chapter images
- `GET /komik/image?url=<image-url>` - Image proxy (CORS/hotlink bypass)

### Admin API (`/admin/*`)
- Auth: `POST /admin/auth/login`, `POST /admin/auth/logout`, `GET /admin/auth/me`
- CRUD: Languages, Websites, Komiks, Komik-Websites
- All admin routes require JWT via httpOnly cookie

## Architecture

### Backend
- Express.js API server
- **MongoDB** for API response caching (24-hour TTL)
- **SQLite** (sql.js) for admin CRUD data (languages, websites, komiks)
- Proxies scraping requests to scraper service
- Admin panel with JWT auth

### Scraper
- Express.js service dedicated to scraping
- MongoDB cache for scraped content (48-hour TTL)
- Modular scrapers (Cheerio + Puppeteer for JS-rendered sites)

### Frontend
- React 19 + Vite + Tailwind v4
- Zustand for state management
- Infinite scroll reader

### Admin
- React 19 + Vite + Radix UI
- TanStack Table for data
- JWT auth with httpOnly cookies

## Key Constraints

- **NO Cloudflare sites** - Headless browsers are detected
- **NSFW filtering** - Requires secret mode opt-in
- **Image proxy** - Some sources require `/komik/image` for hotlink bypass
- **MongoDB required** - Backend needs MongoDB running
- **Manual testing only** - No automated test suite

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Offload research, exploration, and parallel analysis to subagents
- One task per subagent for focused execution

### 3. Verification Before Done
- Never mark a task complete without proving it works
- Run tests, check logs, demonstrate correctness

### 4. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Go fix failing CI tests without being told how

## Deployment

See `DOCKER.md` for Docker deployment documentation.

Frontend deployment configs: `frontend/vercel.json`, `frontend/netlify.toml`

**Important:** Update `VITE_API_URL` when deploying frontend/admin to point to backend URL.
