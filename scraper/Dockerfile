FROM node:20-slim AS base

# Install dependencies for Playwright Chromium
RUN apt-get update && \
    npx playwright install --with-deps chromium && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Development stage
FROM base AS development

RUN npm install -g pnpm

COPY package.json ./
RUN pnpm install

COPY . .

ENV NODE_ENV=development
EXPOSE 3200

CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

COPY package.json ./
RUN npm install --production

# Install Playwright Chromium browser
RUN npx playwright install chromium

COPY . .

ENV NODE_ENV=production
EXPOSE 3200

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3200/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/bin/www"]
