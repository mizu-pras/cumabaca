# Cuma Baca

A minimalist comic scraper from [komiku.org](https://komiku.org) and [komikcast.fit](https://v1.komikcast.fit), Cuma Baca (_Just Read_) focuses on delivering a clean, distraction-free reading experience.

## Tech Stack

- **Backend:** Node.js, Express.js, MongoDB
- **Frontend:** React 19, Vite, Tailwind CSS v4
- **Scraping:** Puppeteer, Cheerio
- **Package Manager:** pnpm (required for monorepo workspace)
- **Deployment:** Docker, Podman

## Demo

Visit the [Cuma Baca Website](https://cumabaca.com) to try it out.

## Local Setup

### Option 1: Docker (Recommended)

The easiest way to run Cuma Baca is with Docker/Podman. All services (Express, Vite, MongoDB) run in containers with hot-reload enabled.

**Prerequisites:**
- Docker or Podman (Fedora: `sudo dnf install podman podman-compose`)
- pnpm (npm alternative for workspace management): `npm install -g pnpm`

**Start development environment:**
```bash
podman-compose -f docker-compose.dev.yml up
```

**Access the app:**
- Frontend (Vite): http://localhost:5173
- Backend API: http://localhost:3100
- MongoDB: localhost:27017

**Stop containers:**
```bash
podman-compose -f docker-compose.dev.yml down
```

### Option 2: Without Docker

1. Clone the repository:
    ```bash
    git clone <repository-url>
    cd <repository-name>
    ```

2. Install dependencies:
    ```bash
    pnpm install
    ```

3. Start MongoDB (required for caching):
    ```bash
    # Using Docker
    docker run -d -p 27017:27017 --name mongodb mongo:7

    # Or install MongoDB locally
    ```

4. Run the application:
    ```bash
    pnpm run dev
    ```

   This starts both Express backend (port 3100) and Vite frontend (port 5173) concurrently.

**Available scripts:**
| Command | Description |
|---------|-------------|
| `pnpm run dev` | Start Express + Vite concurrently |
| `pnpm run dev:backend` | Start Express only (nodemon) |
| `pnpm run dev:frontend` | Start Vite only |
| `pnpm run build` | Build all workspaces |
| `pnpm run build:backend` | Build backend for production |
| `pnpm run build:frontend` | Build React app for production |
| `pnpm run start` | Start production server |

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
