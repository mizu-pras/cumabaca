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

WORKDIR /app

# Set Node environment
ENV NODE_ENV=production

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN npm ci --only=production

# Install Playwright browsers for production
RUN npx playwright install chromium --with-deps

# Copy built assets from builder
COPY --from=builder /app/public/output.css ./public/output.css

# Copy application files
COPY routes ./routes
COPY scrapers ./scrapers
COPY config ./config
COPY utils ./utils
COPY public ./public
COPY app.js ./
COPY bin ./bin

# Create logs directory
RUN mkdir -p /app/logs

# Create non-root user for security
RUN useradd -m -u 1000 -s /bin/bash appuser && \
    chown -R appuser:appuser /app

USER appuser

# Expose the application port
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3100/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "./bin/www"]
