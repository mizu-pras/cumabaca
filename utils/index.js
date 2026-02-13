const cheerio = require('cheerio');
const axios = require('axios');
const puppeteer = require('puppeteer');

// Validates URL and returns its origin
const getDomain = (url) => {
    try {
        const parsedUrl = new URL(url);
        return parsedUrl.origin; // Returns protocol along with hostname
    } catch (error) {
        console.error('Invalid URL:', url);
        return null;
    }
};

// Loads HTML into Cheerio, removing any whitespace characters
const loadCheerio = (html) => {
    const cleanHtml = html.replace(/[\t\r\n]/g, '').trim();
    return cheerio.load(cleanHtml);
};

// Fetches data from URL and loads it into Cheerio
const fetchData = async (url) => {
    const response = await axios(url);
    if (!response.data) {
        throw new Error('Something went wrong!');
    }

    return loadCheerio(response.data);
};

// Validates URL and throws an error if invalid
const validateUrl = (url) => {
    const domain = getDomain(url);
    if (!domain) {
        throw new Error('Invalid URL');
    }

    return domain;
};

// Fetches data from URL using headless browser for JS-rendered content
const fetchDataWithBrowser = async (url, config = {}) => {
    let browser = null;
    try {
        browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser',
            headless: 'new',
            args: [
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage',
                '--disable-gpu',
            ],
        });
        const page = await browser.newPage();

        // Navigate and wait for network to be idle
        await page.goto(url, {
            waitUntil: config.waitUntil ? config.waitUntil : 'networkidle0',
        });

        // Get the rendered HTML
        const html = await page.content();

        return loadCheerio(html);
    } finally {
        if (browser) {
            await browser.close();
        }
    }
};

module.exports = {
    getDomain,
    loadCheerio,
    fetchData,
    fetchDataWithBrowser,
    validateUrl,
};
