# Monorepo Refactoring Design

**Date:** 2026-02-26
**Status:** Approved
**Author:** Claude Code

## Overview

Refactor cumabaca project from a mixed monorepo into a clean npm workspaces structure with separated backend and frontend. Backend will be deployed to VPS with Docker, while frontend will be deployed to CDN (Vercel/Netlify).

## Goals

1. **Development Experience**: Fast HMR with Vite, backend in Docker
2. **Separate Deployment**: Backend on VPS, frontend on CDN
3. **Clean Architecture**: Clear separation between backend API and frontend UI

## Project Structure

```
cumabaca/                      # Monorepo root
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace definition
├── docker-compose.yml          # Production: Backend + MongoDB
├── docker-compose.dev.yml      # Development: Backend + MongoDB
│
├── backend/                    # Express.js API (deployed to VPS)
│   ├── package.json
│   ├── Dockerfile
│   ├── .dockerignore
│   ├── app.js
│   ├── bin/
│   │   └── www
│   ├── routes/
│   ├── controllers/
│   ├── scrapers/
│   ├── config/
│   └── utils/
│
└── frontend/                   # React + Vite (deployed to Vercel/Netlify)
    ├── package.json
    ├── vite.config.js
    ├── vercel.json
    ├── netlify.toml
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── components/
    │   ├── pages/
    │   ├── stores/
    │   ├── lib/
    │   └── styles/
    └── public/
```

## Root Configuration

### `package.json`

```json
{
  "name": "cumabaca-monorepo",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "concurrently \"npm run dev:backend\" \"npm run dev:frontend\"",
    "dev:backend": "docker-compose -f docker-compose.dev.yml up",
    "dev:frontend": "cd frontend && vite",
    "build": "cd frontend && vite build"
  },
  "devDependencies": {
    "concurrently": "^9.2.1"
  }
}
```

### `pnpm-workspace.yaml`

```yaml
packages:
  - 'backend'
  - 'frontend'
```

## Backend

### `package.json`

```json
{
  "name": "cumabaca-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "start": "node ./bin/www",
    "dev": "nodemon ./bin/www"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "cheerio": "^1.0.0-rc.3",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "mongodb": "^6.21.0",
    "puppeteer": "^23.11.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

### CORS Configuration

```javascript
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));
```

### Dockerfile

Multi-stage build with development and production stages. Includes Chromium for Puppeteer.

## Frontend

### `package.json`

```json
{
  "name": "cumabaca-frontend",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.4.0",
    "lucide-react": "^0.575.0",
    "react": "^19.2.4",
    "react-dom": "^19.2.4",
    "react-router": "^7.13.1",
    "zustand": "^5.0.11"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.1.18",
    "@vitejs/plugin-react": "^5.1.4",
    "autoprefixer": "^10.4.24",
    "postcss": "^8.5.6",
    "tailwindcss": "^4.1.18",
    "vite": "^7.3.1"
  }
}
```

### `vite.config.js`

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/komik': {
        target: process.env.VITE_API_URL || 'http://localhost:3100',
        changeOrigin: true,
      },
    },
  },
});
```

### Deployment Configs

**`vercel.json`:**
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-backend-domain.com"
  },
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

## Docker Configuration

### `docker-compose.yml` (Production)

Backend + MongoDB only. Frontend deployed separately to CDN.

### `docker-compose.dev.yml` (Development)

Backend dev with hot-reload + MongoDB. Frontend runs locally with Vite.

## Development Workflow

```bash
# Install dependencies
pnpm install

# Start all (Backend Docker + Frontend Vite)
npm run dev

# Start individually
npm run dev:backend   # Terminal 1
npm run dev:frontend  # Terminal 2

# Build frontend for production
npm run build
```

**Ports:**
- Backend API: `http://localhost:3100` (Docker)
- Frontend dev: `http://localhost:5173` (Vite)
- MongoDB: `localhost:27017` (Docker)

## Deployment

### Backend (VPS)

```bash
docker-compose up -d
```

### Frontend (Vercel)

```bash
vercel deploy --prod
```

### Frontend (Netlify)

```bash
netlify deploy --prod
```

## Environment Variables

### Backend

| Variable | Development | Production |
|----------|-------------|------------|
| `NODE_ENV` | `development` | `production` |
| `PORT` | `3100` | `3100` |
| `MONGODB_URI` | `mongodb://mongodb:27017/cumabaca` | `mongodb://localhost:27017/cumabaca` |
| `CACHE_TTL` | `86400` | `86400` |
| `CORS_ORIGIN` | `http://localhost:5173` | `https://your-frontend-domain.vercel.app` |

### Frontend

| Variable | Development | Production |
|----------|-------------|------------|
| `VITE_API_URL` | *(optional, proxy handles it)* | `https://your-backend-domain.com` |

## API Endpoints

Backend API remains unchanged:

```
GET  /komik/chapters?url=<comic-url>
GET  /komik/data?url=<chapter-url>
GET  /komik/image?url=<image-url>
GET  /komik/cached-comics
GET  /komik/cache/stats
DELETE /komik/cache
```

## Migration Notes

1. Move `src/` → `frontend/src/`
2. Move `public/` (frontend assets) → `frontend/public/`
3. Move backend files (`app.js`, `routes/`, `controllers/`, etc.) → `backend/`
4. Remove frontend dependencies from `backend/package.json`
5. Remove backend dependencies from `frontend/package.json`
6. Update `CLAUDE.md` with new structure and commands
