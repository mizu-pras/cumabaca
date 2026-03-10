import * as cheerio from 'cheerio';
import axios from 'axios';
import { chromium } from 'playwright';
import { getRandomUserAgent } from './user-agents.js';

// Validates URL and returns its origin
export const getDomain = (url) => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.origin; // Returns protocol along with hostname
    } catch (error) {
        console.error('Invalid URL:', url);
        return null;
    }
};

// Loads HTML into Cheerio, removing any whitespace characters
export const loadCheerio = (html) => {
    const cleanHtml = html.replace(/[\t\r\n]/g, '').trim();
    return cheerio.load(cleanHtml);
};

// Fetches data from URL and loads it into Cheerio
export const fetchData = async (url, _config) => {
    const response = await axios(url, {
        maxRedirects: 5,
        headers: {
            'User-Agent': getRandomUserAgent(),
        },
    });
    if (!response.data) {
        throw new Error('Something went wrong!');
    }

    return loadCheerio(response.data);
};

// Validates URL and throws an error if invalid
export const validateUrl = (url) => {
    const domain = getDomain(url);
    if (!domain) {
        throw new Error('Invalid URL');
    }

    return domain;
};

// Fetches data from URL using headless browser for JS-rendered content
export const fetchDataWithBrowser = async (url, config) => {
    let browser = null;
    try {
        browser = await chromium.launch({
            headless: true,
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
                '--disable-blink-features=AutomationControlled',
            ],
        });

        const context = await browser.newContext({
            userAgent: getRandomUserAgent(),
            viewport: { width: 1920, height: 1080 },
            locale: 'id-ID',
            timezoneId: 'Asia/Jakarta',
        });

        const page = await context.newPage();

        // Stealth: override navigator properties before any page scripts run
        await page.addInitScript(() => {
            // Hide webdriver flag
            Object.defineProperty(navigator, 'webdriver', {
                get: () => false,
            });

            // Fake plugins (Chrome PDF Plugin, Chrome PDF Viewer, Native Client)
            Object.defineProperty(navigator, 'plugins', {
                get: () => [
                    { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
                    { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
                    { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
                ],
            });

            // Fake languages
            Object.defineProperty(navigator, 'languages', {
                get: () => ['id-ID', 'id', 'en-US', 'en'],
            });

            // Fake chrome.runtime to appear as real Chrome
            if (!window.chrome) {
                window.chrome = {};
            }
            window.chrome.runtime = {
                connect: () => {},
                sendMessage: () => {},
            };
        });

        // Map Puppeteer waitUntil values to Playwright equivalents
        let waitUntil = config.waitUntil || 'domcontentloaded';
        if (waitUntil === 'networkidle0' || waitUntil === 'networkidle2') {
            waitUntil = 'networkidle';
        }

        await page.goto(url, {
            waitUntil,
            timeout: 60000,
        });

        const html = await page.content();

        return loadCheerio(html);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};
