# Multi-stage Dockerfile for Cuma Baca Backend
# Lightweight API - scraping handled by separate scraper service

# Stage 1: Development (with hot-reload support)
FROM node:20-alpine AS development

WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Install dependencies
COPY package.json ./
RUN pnpm install

# Copy source files
COPY . . .

# Expose port for Express (3100)
EXPOSE 3100

# Run Express with nodemon for hot-reload
CMD ["npm", "run", "dev"]


# Production stage
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S appuser && \
    adduser -S -u 1001 -G appuser appuser

ENV NODE_ENV=production

COPY --chown=appuser:appuser package.json ./
RUN npm install -g pnpm && \
    pnpm install --prod && \
    chown -R appuser:appuser /app/node_modules

COPY --chown=appuser:appuser . .

USER appuser

EXPOSE 3100

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3100/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "./bin/www"]
