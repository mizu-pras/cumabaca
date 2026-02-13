# Multi-stage Dockerfile for Cuma Baca
# Uses official Playwright image with all required browser dependencies

# Stage 1: Builder
FROM mcr.microsoft.com/playwright:v1.58.2-jammy AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building CSS)
RUN npm ci

# Copy source files
COPY . .

# Build Tailwind CSS
RUN npm run build:css

# Install Playwright browsers
RUN npx playwright install chromium

# Stage 2: Production
FROM mcr.microsoft.com/playwright:v1.58.2-jammy

# Create non-root user first
RUN useradd -m -u 1001 -s /bin/bash appuser

WORKDIR /app

# Set Node environment
ENV NODE_ENV=production

# Copy package files with proper ownership
COPY --chown=appuser:appuser package*.json ./

# Install only production dependencies
RUN npm ci --only=production && \
    chown -R appuser:appuser /app/node_modules

# Install Playwright browsers for production
RUN npx playwright install chromium --with-deps

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

