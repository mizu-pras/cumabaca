# Cuma Baca

A minimalist comic scraper from [komiku.org](https://komiku.org) and [komikcast.fit](https://v1.komikcast.fit), Cuma Baca (_Just Read_) focuses on delivering a clean, distraction-free reading experience.

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB
- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Scraping:** Puppeteer, Cheerio
- **Package Manager:** pnpm (required for monorepo workspace)
- **Architecture:** Monorepo with backend/frontend separation
- **Deployment:** Backend (Docker/Podman on VPS), Frontend (Vercel/Netlify)

## Project Structure

```
cumabaca/                      # Monorepo root
├── package.json                # Root workspace config
├── pnpm-workspace.yaml         # Workspace definition
├── docker-compose.yml          # Production: Backend + MongoDB
├── docker-compose.dev.yml      # Development: Backend + MongoDB
│
├── backend/                    # Express.js API
│   ├── package.json
│   ├── Dockerfile
│   ├── app.js
│   ├── bin/, routes/, controllers/, scrapers/, config/, utils/
│
└── frontend/                   # React + Vite
    ├── package.json
    ├── vite.config.js
    ├── vercel.json, netlify.toml
    ├── src/
    │   ├── components/, pages/, stores/, lib/, styles/
    │   └── main.jsx, App.jsx
    └── public/
```

- **Backend:** Node.js, Express.js, MongoDB
- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Scraping:** Puppeteer, Cheerio
- **Package Manager:** pnpm (required for monorepo workspace)
- **Architecture:** Monorepo with backend/frontend separation
- **Deployment:** Backend (Docker/Podman on VPS), Frontend (Vercel/Netlify)

## Demo

Visit the [Cuma Baca Website](https://cumabaca.com) to try it out.

## Local Setup

### Prerequisites

- **pnpm** (required for monorepo workspace): `npm install -g pnpm`
- **Docker** or **Podman** (for backend and MongoDB): `sudo dnf install podman podman-compose`

### Install Dependencies

```bash
pnpm install
```

### Development

Start all services (backend in Docker + frontend locally):
```bash
pnpm run dev
```

**Individual services:**
```bash
# Backend (Docker + MongoDB)
pnpm run dev:backend

# Frontend (Vite dev server)
pnpm run dev:frontend
```

**Access points:**
- Frontend (Vite): http://localhost:5173
- Backend API: http://localhost:3100
- MongoDB: localhost:27017

**Stop backend containers:**
```bash
podman-compose -f docker-compose.dev.yml down
```

### Build for Production

```bash
pnpm run build
```

This builds the frontend for deployment to Vercel/Netlify.

**Available scripts:**
| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start backend (Docker) + frontend (Vite) concurrently |
| `pnpm run dev:backend` | Start backend in Docker with MongoDB |
| `pnpm run dev:frontend` | Start frontend Vite dev server |
| `pnpm run build` | Build frontend for production |

### Usage

1. Visit one of the supported sites and find a comic you want to read:
   - [komiku.org](https://komiku.org)
   - [v1.komikcast.fit](https://v1.komikcast.fit)
   - [sektedoujin.cc](https://sektedoujin.cc) (NSFW - requires enabling Secret mode)

2. Copy the comic's URL and paste it into the app.

3. Enjoy an uninterrupted reading experience with:
   - Chapter preloading for instant navigation
   - Image proxy for hotlink-protected sources
   - Persistent cache using MongoDB

### Screenshots

The platform is designed for a variety of devices.

#### Mobile

![Mobile view](/screenshot/mobile.PNG 'Mobile View')

#### Tablet

![Tablet view](/screenshot/tablet.jpg 'Tablet View')

#### Desktop

![Desktop view](/screenshot/desktop.png 'Desktop View')
