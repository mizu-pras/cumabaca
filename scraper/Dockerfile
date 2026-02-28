FROM node:20-alpine AS base

# Install dependencies for Puppeteer
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Set Puppeteer to use installed Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Development stage
FROM base AS development

COPY package.json ./
RUN npm install

COPY . .

ENV NODE_ENV=development
EXPOSE 3200

CMD ["npm", "run", "dev"]

# Production stage
FROM base AS production

COPY package.json ./
RUN npm install --production

COPY . .

ENV NODE_ENV=production
EXPOSE 3200

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3200/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "src/bin/www"]
