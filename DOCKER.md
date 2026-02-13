# Docker Setup for Cuma Baca

This guide covers running Cuma Baca with Docker, which bundles all dependencies including Playwright's Chromium browser for consistent environments across development and production.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose 2.0+

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

To override variables in docker-compose.yml:

```yaml
services:
  web:
    environment:
      - PORT=3000
      - NODE_ENV=development
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

### 4. Test Playwright Scraping

```bash
curl "http://localhost:3100/komik/chapters?url=https://v1.komikcast.fit/manga/one-piece/"
```

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

### Playwright Browser Issues

The official Playwright image includes all required browser dependencies. If you encounter browser launch errors:

```bash
# Verify Chromium is installed
docker-compose exec web npx playwright install --help

# Reinstall browsers if needed
docker-compose exec web npx playwright install chromium --with-deps
```

### Memory Issues

The Playwright base image is ~1GB. Adjust resource limits in `docker-compose.yml`:

```yaml
deploy:
  resources:
    limits:
      memory: 2G  # Increase if needed
```

### High CPU Usage

Playwright's headless browser can be CPU-intensive. Consider:
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

## Security Considerations

1. **Non-root User**: The container runs as `appuser` (UID 1000) for security
2. **Resource Limits**: Default limits prevent resource exhaustion
3. **Health Check**: Built-in health check monitors application status
4. **Minimal Attack Surface**: Only production dependencies are included

## Image Size

The final image size is approximately **1.5GB** due to:
- Playwright base image (~1GB)
- Chromium browser and dependencies
- Node.js runtime and application dependencies

This is expected and normal for Playwright-based applications.

## Development Mode

For development with hot-reload, create a `docker-compose.dev.yml`:

```yaml
version: '3.8'

services:
  web:
    build:
      context: .
      dockerfile: Dockerfile
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
    ports:
      - "3100:3100"
    command: npm run dev
```

Run with: `docker-compose -f docker-compose.dev.yml up`
