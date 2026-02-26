# Monorepo Refactoring Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Refactor cumabaca from mixed monorepo to clean npm workspaces structure with separated backend (Docker/VPS) and frontend (Vite/CDN).

**Architecture:** Create npm workspaces monorepo with backend/ and frontend/ directories. Backend runs in Docker with Express.js API, frontend runs locally with Vite dev server and deploys to CDN.

**Tech Stack:** npm workspaces, Express.js, React, Vite, Docker, MongoDB, Puppeteer

---

## Task 1: Create Root Workspace Configuration

**Files:**
- Modify: `package.json` (root)
- Create: `pnpm-workspace.yaml` (root)

**Step 1: Backup current package.json**

```bash
cp package.json package.json.backup
```

**Step 2: Create new root package.json**

Create `package.json` with workspace config:

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
  },
  "workspaces": [
    "backend",
    "frontend"
  ]
}
```

**Step 3: Create pnpm-workspace.yaml**

Create `pnpm-workspace.yaml`:

```yaml
packages:
  - 'backend'
  - 'frontend'
```

**Step 4: Verify workspace config**

Run: `cat package.json && cat pnpm-workspace.yaml`

Expected: Both files display correct content

**Step 5: Commit**

```bash
git add package.json pnpm-workspace.yaml package.json.backup
git commit -m "feat: add root workspace configuration for monorepo"
```

---

## Task 2: Create Backend Directory Structure

**Files:**
- Create: `backend/` directory with subdirectories

**Step 1: Create backend directories**

```bash
mkdir -p backend/{bin,routes,controllers,scrapers,config,utils}
```

**Step 2: Verify directories created**

Run: `ls -la backend/`

Expected: Shows bin, routes, controllers, scrapers, config, utils directories

**Step 3: Copy backend files**

```bash
# Move Express app files
cp app.js backend/
cp -r bin/* backend/bin/
cp -r routes/* backend/routes/
cp -r controllers/* backend/controllers/
cp -r scrapers/* backend/scrapers/
cp -r config/* backend/config/
cp -r utils/* backend/utils/
```

**Step 4: Verify files copied**

Run: `ls -la backend/ && ls -la backend/routes/ && ls -la backend/controllers/`

Expected: All backend files present

**Step 5: Commit**

```bash
git add backend/
git commit -m "feat: create backend directory structure and move files"
```

---

## Task 3: Create Backend package.json

**Files:**
- Create: `backend/package.json`

**Step 1: Read current package.json to get versions**

```bash
cat package.json.backup | grep -A 20 '"dependencies"'
```

**Step 2: Create backend/package.json**

Create `backend/package.json`:

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

**Step 3: Verify package.json created**

Run: `cat backend/package.json`

Expected: Shows backend package.json with correct dependencies

**Step 4: Commit**

```bash
git add backend/package.json
git commit -m "feat: create backend package.json"
```

---

## Task 4: Update Backend CORS Configuration

**Files:**
- Modify: `backend/app.js`

**Step 1: Read current app.js CORS setup**

```bash
grep -A 5 "cors" backend/app.js
```

**Step 2: Update CORS in app.js**

Find the existing CORS middleware and replace with:

```javascript
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',')
  : ['http://localhost:5173'];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc)
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

**Step 3: Verify CORS update**

Run: `grep -A 15 "allowedOrigins" backend/app.js`

Expected: Shows new CORS configuration

**Step 4: Commit**

```bash
git add backend/app.js
git commit -m "feat: update CORS configuration for multiple origins"
```

---

## Task 5: Create Backend Dockerfile

**Files:**
- Create: `backend/Dockerfile`
- Create: `backend/.dockerignore`

**Step 1: Create backend/Dockerfile**

Create `backend/Dockerfile`:

```dockerfile
# Development stage
FROM node:20-alpine AS development

# Install Chromium for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Run as root for volume write access
EXPOSE 3100

CMD ["npm", "run", "dev"]


# Production stage
FROM node:20-alpine AS production

# Install Chromium
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    NODE_ENV=production

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser

WORKDIR /app

COPY --chown=appuser:appuser package*.json ./
RUN npm ci --only=production && \
    chown -R appuser:appuser /app/node_modules

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3100/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "./bin/www"]
```

**Step 2: Create backend/.dockerignore**

Create `backend/.dockerignore`:

```
node_modules
npm-debug.log
.env
.git
.gitignore
logs
```

**Step 3: Verify Docker files created**

Run: `ls -la backend/ | grep -E "Dockerfile|dockerignore"`

Expected: Shows both Dockerfile and .dockerignore

**Step 4: Commit**

```bash
git add backend/Dockerfile backend/.dockerignore
git commit -m "feat: add backend Dockerfile with multi-stage build"
```

---

## Task 6: Create Frontend Directory Structure

**Files:**
- Create: `frontend/` directory with subdirectories

**Step 1: Create frontend directories**

```bash
mkdir -p frontend/{src,public}
```

**Step 2: Copy React source files**

```bash
# Move src directory
cp -r src/* frontend/src/

# Copy Vite config
cp vite.config.js frontend/
cp index.html frontend/

# Copy postcss config
cp postcss.config.js frontend/
```

**Step 3: Verify files copied**

Run: `ls -la frontend/src/`

Expected: Shows all React source files

**Step 4: Commit**

```bash
git add frontend/
git commit -m "feat: create frontend directory structure and move React files"
```

---

## Task 7: Create Frontend package.json

**Files:**
- Create: `frontend/package.json`

**Step 1: Create frontend/package.json**

Create `frontend/package.json`:

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

**Step 2: Verify package.json created**

Run: `cat frontend/package.json`

Expected: Shows frontend package.json with correct dependencies

**Step 3: Commit**

```bash
git add frontend/package.json
git commit -m "feat: create frontend package.json"
```

---

## Task 8: Update Frontend vite.config.js

**Files:**
- Modify: `frontend/vite.config.js`

**Step 1: Read current vite.config.js**

```bash
cat frontend/vite.config.js
```

**Step 2: Update vite.config.js**

Replace content with:

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

**Step 3: Verify config updated**

Run: `cat frontend/vite.config.js`

Expected: Shows updated config with API_URL environment variable

**Step 4: Commit**

```bash
git add frontend/vite.config.js
git commit -m "feat: update vite config with environment-based API URL"
```

---

## Task 9: Create Frontend Deployment Configs

**Files:**
- Create: `frontend/vercel.json`
- Create: `frontend/netlify.toml`

**Step 1: Create vercel.json**

Create `frontend/vercel.json`:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "env": {
    "VITE_API_URL": "https://your-backend-domain.com"
  },
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

**Step 2: Create netlify.toml**

Create `frontend/netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "20"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build.processing]
  skip_processing = false
```

**Step 3: Verify deployment configs created**

Run: `ls frontend/*.json frontend/*.toml`

Expected: Shows vercel.json and netlify.toml

**Step 4: Commit**

```bash
git add frontend/vercel.json frontend/netlify.toml
git commit -m "feat: add deployment configs for Vercel and Netlify"
```

---

## Task 10: Create Frontend CSS directory

**Files:**
- Create: `frontend/src/styles/` directory

**Step 1: Create styles directory and move CSS**

```bash
mkdir -p frontend/src/styles

# Copy CSS files from public
cp public/input.css frontend/src/styles/
# Create output.css as empty file (will be generated by build)
touch frontend/src/styles/output.css
```

**Step 2: Update frontend vite.config.js to include CSS path**

Add to `frontend/vite.config.js`:

```javascript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  css: {
    postcss: './postcss.config.js',
  },
  // ... rest of config
});
```

**Step 3: Verify CSS setup**

Run: `ls -la frontend/src/styles/`

Expected: Shows input.css and output.css

**Step 4: Commit**

```bash
git add frontend/src/styles/ frontend/vite.config.js
git commit -m "feat: move CSS to frontend src/styles directory"
```

---

## Task 11: Update Root Docker Compose Files

**Files:**
- Modify: `docker-compose.yml`
- Modify: `docker-compose.dev.yml`

**Step 1: Update docker-compose.yml (Production)**

Replace content with:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: cumabaca-mongo
    restart: unless-stopped
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db
    environment:
      MONGO_INITDB_DATABASE: cumabaca
    healthcheck:
      test: ["CMD", "mongosh", "--eval", "db.adminCommand('ping')"]
      interval: 10s
      timeout: 5s
      retries: 3

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: cumabaca-backend
    restart: unless-stopped
    ports:
      - "3100:3100"
    environment:
      - NODE_ENV=production
      - PORT=3100
      - MONGODB_URI=mongodb://mongodb:27017/cumabaca
      - CACHE_TTL=86400
      - CORS_ORIGIN=https://your-frontend-domain.vercel.app
    depends_on:
      mongodb:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs

volumes:
  mongodb_data:
```

**Step 2: Update docker-compose.dev.yml (Development)**

Replace content with:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: cumabaca-mongo-dev
    ports:
      - "27017:27017"
    volumes:
      - mongodb_data:/data/db

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
      target: development
    container_name: cumabaca-backend-dev
    ports:
      - "3100:3100"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - MONGODB_URI=mongodb://mongodb:27017/cumabaca
      - CORS_ORIGIN=http://localhost:5173

volumes:
  mongodb_data:
```

**Step 3: Verify Docker configs updated**

Run: `grep -A 5 "context:" docker-compose.yml docker-compose.dev.yml`

Expected: Both show `context: ./backend`

**Step 4: Commit**

```bash
git add docker-compose.yml docker-compose.dev.yml
git commit -m "feat: update docker-compose for backend-only deployment"
```

---

## Task 12: Remove Old Files and Directories

**Files:**
- Delete: Old root level files
- Delete: Old directories

**Step 1: Remove old directories from root**

```bash
# Confirm what will be removed
ls -la | grep -E "^d" | grep -v "^\.$|^\.\.$|backend|frontend|node_modules|\.git|docs|examples|screenshot|\.claude"

# Remove old backend directories
rm -rf bin routes controllers scrapers config utils

# Remove old frontend directory
rm -rf src
```

**Step 2: Remove old root level files**

```bash
# Remove old config files
rm -f vite.config.js index.html postcss.config.js

# Remove old Dockerfile
rm -f Dockerfile
```

**Step 3: Clean up public directory**

```bash
# Keep only frontend-related files in public if needed
# public/input.css and output.css are now in frontend/src/styles/
ls public/
```

**Step 4: Verify cleanup**

Run: `ls -la | grep "^d"`

Expected: Shows only necessary directories (backend, frontend, docs, etc.)

**Step 5: Commit**

```bash
git add -A
git commit -m "refactor: remove old files and directories after monorepo migration"
```

---

## Task 13: Update CLAUDE.md

**Files:**
- Modify: `CLAUDE.md`

**Step 1: Update Project Structure section**

Replace the existing structure section with:

```
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
│   ├── app.js
│   ├── bin/
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
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── components/
    │   ├── pages/
    │   ├── stores/
    │   ├── lib/
    │   ├── styles/
    │   └── ...
    └── public/
```
```

**Step 2: Update Development Commands section**

Replace with:

```bash
# Install dependencies (root)
pnpm install  # atau npm install

# Start development (Backend Docker + Frontend Vite)
npm run dev

# Start backend only (Docker)
npm run dev:backend

# Start frontend only (Vite)
npm run dev:frontend

# Build frontend for production
npm run build
```

**Step 3: Add Deployment section**

Add new section after Development Commands:

```bash
## Deployment

### Backend (VPS)

```bash
# On VPS
git pull
docker-compose up -d
```

### Frontend (Vercel)

```bash
# From frontend directory
cd frontend
vercel deploy --prod
```

### Frontend (Netlify)

```bash
# From frontend directory
cd frontend
netlify deploy --prod
```
```

**Step 4: Add Environment Variables section**

Add section documenting all environment variables for backend and frontend.

**Step 5: Verify CLAUDE.md updated**

Run: `grep -A 20 "Project Structure" CLAUDE.md`

Expected: Shows new monorepo structure

**Step 6: Commit**

```bash
git add CLAUDE.md
git commit -m "docs: update CLAUDE.md for monorepo structure"
```

---

## Task 14: Install Dependencies and Test

**Files:**
- Test: Entire project

**Step 1: Clean install dependencies**

```bash
# Remove old node_modules
rm -rf node_modules package-lock.json

# Install with workspace
pnpm install
# atau: npm install
```

**Step 2: Verify workspace setup**

Run: `ls -la node_modules/@cumabaca-monorepo 2>/dev/null || echo "Using npm workspaces"`

Expected: No errors during install

**Step 3: Test backend build**

Run: `cd backend && npm install`

Expected: Dependencies install without errors

**Step 4: Test frontend build**

Run: `cd frontend && npm install`

Expected: Dependencies install without errors

**Step 5: Return to root**

Run: `cd ..`

**Step 6: Commit**

```bash
git add package-lock.json pnpm-lock.yaml 2>/dev/null || true
git commit -m "chore: install dependencies with workspace setup"
```

---

## Task 15: End-to-End Testing

**Files:**
- Test: Docker container, backend API, frontend

**Step 1: Start backend (Docker)**

```bash
npm run dev:backend
```

Expected: Docker containers start, MongoDB and backend running

**Step 2: Verify backend is running**

In another terminal:

Run: `curl http://localhost:3100/`

Expected: Returns 200 OK

**Step 3: Test API endpoint**

Run: `curl "http://localhost:3100/komik/cache/stats"`

Expected: Returns cache stats JSON

**Step 4: Start frontend (Vite)**

In another terminal:

Run: `npm run dev:frontend`

Expected: Vite dev server starts on port 5173

**Step 5: Test frontend**

Open browser: `http://localhost:5173`

Expected: Frontend loads, can access backend via proxy

**Step 6: Test CORS**

Run: `curl -H "Origin: http://localhost:5173" http://localhost:3100/komik/cache/stats -v`

Expected: CORS headers present, request succeeds

**Step 7: Stop all services**

Run: `Ctrl+C` in all terminals, then `docker-compose -f docker-compose.dev.yml down`

**Step 8: Commit**

```bash
git add -A
git commit -m "test: verify end-to-end functionality after refactoring"
```

---

## Task 16: Final Verification and Documentation

**Files:**
- Verify: All files in correct locations
- Update: Any remaining documentation

**Step 1: Verify structure**

Run: `find . -maxdepth 3 -type d | grep -v node_modules | grep -v ".git" | sort`

Expected: Clean monorepo structure with backend/ and frontend/

**Step 2: Verify no broken imports**

Check `frontend/src` for any imports that need path updates:

Run: `grep -r "from.*styles" frontend/src/`

Expected: All style imports use correct paths

**Step 3: Build frontend**

Run: `cd frontend && npm run build`

Expected: Build succeeds, output in `frontend/dist`

**Step 4: Return to root and finalize**

Run: `cd ..`

**Step 5: Create migration summary**

Create `MIGRATION.md`:

```markdown
# Monorepo Migration Summary

## What Changed

- Project now uses npm workspaces with `backend/` and `frontend/` directories
- Backend runs in Docker, frontend runs with Vite
- Backend and frontend deploy separately

## Migration Steps Completed

1. Created root workspace configuration
2. Moved backend files to `backend/`
3. Moved frontend files to `frontend/`
4. Updated Docker compose files
5. Updated CORS configuration
6. Created deployment configs for Vercel/Netlify

## Development Workflow

```bash
npm run dev           # Start backend (Docker) + frontend (Vite)
npm run dev:backend   # Start backend only
npm run dev:frontend  # Start frontend only
npm run build         # Build frontend for production
```

## Deployment

- Backend: `docker-compose up -d` (on VPS)
- Frontend: `vercel deploy --prod` or `netlify deploy --prod`
```

**Step 6: Final commit**

```bash
git add MIGRATION.md
git commit -m "docs: add migration summary document"

# Tag the migration
git tag -a v2.0.0-monorepo -m "Monorepo refactoring complete"
```

---

## Testing Checklist

After completing all tasks, verify:

- [ ] Root `npm install` works with workspaces
- [ ] Backend starts with `npm run dev:backend`
- [ ] Backend API responds at `http://localhost:3100`
- [ ] Frontend starts with `npm run dev:frontend`
- [ ] Frontend loads at `http://localhost:5173`
- [ ] Frontend can call backend API via proxy
- [ ] CORS is configured correctly
- [ ] Frontend builds successfully (`npm run build`)
- [ ] Docker production build works
- [ ] Documentation is updated

## Rollback Plan

If issues arise:

```bash
# Reset to pre-migration state
git reset --hard <commit-before-migration>
git clean -fd
npm install
```
