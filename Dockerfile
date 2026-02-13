# Multi-stage Dockerfile for Cuma Baca
# Uses Alpine + Puppeteer for minimal image size

# Stage 1: Builder
FROM node:20-alpine AS builder

WORKDIR /app

# Install build dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building CSS)
RUN npm ci

# Copy source files
COPY . .

# Build Tailwind CSS
RUN npm run build:css


# Stage 2: Development (with hot-reload support)
FROM node:20-alpine AS development

# Install Chromium for Puppeteer (needed for Komikcast scraper)
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Tell Puppeteer to skip installing Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Install ALL dependencies (including devDependencies for nodemon)
COPY package*.json ./
RUN npm ci

# Copy source files
COPY . .

# Build CSS once for initial run
RUN npm run build:css

# Run as root for development mode to allow volume write access
# (acceptable for local development; production stage still uses non-root user)
# No USER directive in development stage

EXPOSE 3100

# Override with dev command that runs both nodemon and CSS watcher
CMD ["sh", "-c", "npm run build:css -- --watch & npm run dev"]


# Stage 3: Production
FROM node:20-alpine

# Install Chromium and its dependencies
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    # Chromium dependency
    && rm -rf /var/cache/apk/*

# Tell Puppeteer to skip installing Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser

WORKDIR /app

# Set Node environment
ENV NODE_ENV=production

# Copy package files with proper ownership
COPY --chown=appuser:appuser package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    chown -R appuser:appuser /app/node_modules

# Copy built assets from builder
COPY --chown=appuser:appuser --from=builder /app/public/output.css ./public/output.css

# Copy application files with proper ownership
COPY --chown=appuser:appuser routes ./routes
COPY --chown=appuser:appuser scrapers ./scrapers
COPY --chown=appuser:appuser config ./config
COPY --chown=appuser:appuser utils ./utils
COPY --chown=appuser:appuser public ./public
COPY --chown=appuser:appuser app.js ./
COPY --chown=appuser:appuser bin ./bin

# Create logs directory with proper ownership
RUN mkdir -p /app/logs && \
    chown appuser:appuser /app/logs

USER appuser

# Expose the application port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3100/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "./bin/www"]
