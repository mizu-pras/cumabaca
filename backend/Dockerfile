# Multi-stage Dockerfile for Cuma Baca Backend
# Uses Alpine + Puppeteer for minimal image size

# Stage 1: Development (with hot-reload support)
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

# Run as root for development mode to allow volume write access
# (acceptable for local development; production stage still uses non-root user)
# No USER directive in development stage

# Expose port for Express (3100)
EXPOSE 3100

# Run Express with nodemon for hot-reload
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
