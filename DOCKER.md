# Docker Setup for Cuma Baca

This guide covers running Cuma Baca with Docker, which bundles all dependencies including Puppeteer's Chromium browser and MongoDB for consistent environments across development and production.

## Prerequisites

**Docker (Linux/Mac/Windows):**
- Docker Engine 20.10+
- Docker Compose 2.0+

**Podman (Fedora/CentOS/RHEL):**
```bash
# Install podman-compose
sudo dnf install podman-compose

# Or via pip
pip install podman-compose
```

Use `podman-compose` instead of `docker-compose` for all commands below.

## Quick Start

```bash
# Build and start the application
docker-compose up -d

# View logs
docker-compose logs -f

# Stop the application
docker-compose down
```

## Manual Docker Build

If you prefer to use Docker directly without Compose:

```bash
# Build the image
docker build -t cumabaca .

# Run the container
docker run -d -p 3100:3100 --name cumabaca cumabaca
```

## Environment Configuration

The application uses the following environment variables (with defaults):

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Node environment |
| `PORT` | `3100` | Application port |
| `MONGODB_URI` | `mongodb://mongodb:27017/cumabaca` | MongoDB connection string |
| `CACHE_TTL` | `86400` | Cache TTL in seconds (24 hours) |

To override variables in docker-compose.yml:

```yaml
services:
  web:
    environment:
      - PORT=3000
      - CACHE_TTL=3600  # 1 hour cache
```

## Production Deployment

### 1. Build for Production

```bash
docker-compose build
```

### 2. Start the Service

```bash
docker-compose up -d
```

### 3. Verify Health

```bash
curl http://localhost:3100/
```

### 4. Test Puppeteer Scraping

```bash
curl "http://localhost:3100/komik/chapters?url=https://v1.komikcast.fit/manga/one-piece/"
```

## Services

The docker-compose setup includes two services:

| Service | Description | Port |
|---------|-------------|------|
| `web` | Express backend + React frontend | 3100 |
| `mongodb` | MongoDB for cache persistence | 27017 |

## Volumes

| Volume | Purpose |
|--------|---------|
| `mongodb_data` | MongoDB data persistence |
| `./logs:/app/logs` | Application logs (mapped to host) |

## Docker Compose Commands Reference

```bash
# Start the application
docker-compose up -d

# View logs (follow mode)
docker-compose logs -f

# View logs for specific service
docker-compose logs -f web

# Stop the application
docker-compose down

# Rebuild after code changes
docker-compose up -d --build

# Restart the service
docker-compose restart

# Execute commands inside the container
docker-compose exec web bash

# Check container status
docker-compose ps
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs for errors
docker-compose logs -f

# Inspect the container
docker-compose exec web ps aux
```

### Port Already in Use

If port 3100 is already in use, modify the port mapping in `docker-compose.yml`:

```yaml
ports:
  - "3000:3100"  # Maps host port 3000 to container port 3100
```

### Puppeteer Browser Issues

The container uses Puppeteer with Chromium. If you encounter browser launch errors:

```bash
# Verify Chromium is installed
docker-compose exec web ls -la /usr/bin/chromium*

# Test Puppeteer in container
docker-compose exec web node -e "require('puppeteer').then(p => p.executablePath())"
```

### Memory Issues

Adjust resource limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Increase if needed
```

### High CPU Usage

Puppeteer's headless browser can be CPU-intensive. Consider:
- Reducing concurrent scraping requests
- Increasing the CPU limit in docker-compose.yml
- Implementing request queuing in the application

## Reverse Proxy Setup

For production, use a reverse proxy (Nginx/Traefik) for HTTPS and better routing:

### Example Nginx Configuration

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3100;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Cache Management

The application uses MongoDB for persistent caching. Manage cache via API endpoints:

```bash
# View cache statistics
curl "http://localhost:3100/komik/cache/stats"

# Clear all cache entries
curl -X DELETE "http://localhost:3100/komik/cache"

# Delete specific cache entry
curl -X DELETE "http://localhost:3100/komik/cache?key=<cache-key>"
```

**Cache Stats Response:**
```json
{
  "totalEntries": 42,
  "expiredEntries": 0,
  "totalSize": 125000,
  "avgSize": 2976
}
```

## Security Considerations

1. **Non-root User**: Container runs as `appuser` (UID 1001) for security
2. **Resource Limits**: Default limits (1 CPU, 1GB RAM) prevent resource exhaustion
3. **Health Check**: HTTP GET to `/` every 30s (10s timeout, 40s start period)
4. **MongoDB**: Internal service, not exposed to host network

## Image Size

The final image size is approximately **1.5GB** due to:
- `node:20-alpine` base image with Chromium
- Puppeteer and browser dependencies
- Node.js runtime and application dependencies

This is expected and normal for Puppeteer-based applications.

## Development Mode

For development with hot-reload, use the provided `docker-compose.dev.yml`:

```bash
# Initial setup (builds and starts)
docker-compose -f docker-compose.dev.yml up --build

# Daily development (starts with hot-reload)
docker-compose -f docker-compose.dev.yml up

# View logs
docker-compose -f docker-compose.dev.yml logs -f

# Stop dev container
docker-compose -f docker-compose.dev.yml down

# Stop and remove all data (including cache)
docker-compose -f docker-compose.dev.yml down -v
```

### Hot-Reload Behavior

| Change Type | Behavior |
|-------------|----------|
| Backend/Route/Scraper changes | Nodemon auto-restarts instantly |
| CSS changes | PostCSS watcher rebuilds automatically |
| package.json changes | Rebuild with `--build` flag |
| Dockerfile changes | Rebuild with `--build` flag |

### Development Stage Details

- Installs ALL dependencies (including devDependencies)
- Runs CSS watcher and nodemon in parallel
- Volume mounts source code for instant sync
- Preserves node_modules inside container
