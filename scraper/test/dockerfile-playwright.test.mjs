import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

test('installs the Playwright browser after the pinned scraper dependency is installed', async () => {
  const dockerfile = await readFile(new URL('../Dockerfile', import.meta.url), 'utf8');
  const dependencyInstall = dockerfile.indexOf('RUN pnpm install');
  const browserInstall = dockerfile.indexOf('pnpm exec playwright install --with-deps chromium');

  assert.ok(dependencyInstall >= 0, 'Dockerfile must install scraper dependencies');
  assert.ok(browserInstall > dependencyInstall, 'Playwright browser must be installed after pnpm install');
  assert.match(
    dockerfile,
    /RUN npm install --production && \\\n    \.\/node_modules\/\.bin\/playwright install --with-deps chromium/,
    'production image must install Chromium through its local Playwright dependency',
  );
});
