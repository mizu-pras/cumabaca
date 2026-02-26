const { validateUrl } = require('./index');
const { getScraperForDomain, getWebsiteConfig } = require('../scrapers');

/**
 * Test scraper for a given comic URL
 * Checks if:
 * 1. URL is valid and has a supported scraper
 * 2. Website is accessible (fetch works)
 * 3. Chapters can be extracted
 *
 * @param {string} comicUrl - The URL of the comic's main page
 * @param {Object} options - Optional test options
 * @param {boolean} options.verbose - Show detailed output (default: false)
 * @param {boolean} options.testChapter - Test first chapter data extraction (default: false)
 * @returns {Promise<Object>} Test result object
 */
async function testScraper(comicUrl, options = {}) {
    const { verbose = false, testChapter = false } = options;
    const result = {
        url: comicUrl,
        success: false,
        steps: {
            validation: { pass: false, message: '' },
            connectivity: { pass: false, message: '' },
            scraper: { pass: false, message: '' },
            chapters: { pass: false, message: '', count: 0 },
            chapterData: { pass: false, message: '', imageCount: 0 },
        },
        error: null,
    };

    const log = (message) => {
        if (verbose) {
            console.log(`[testScraper] ${message}`);
        }
    };

    try {
        // Step 1: Validate URL
        log('Step 1: Validating URL...');
        try {
            const domain = validateUrl(comicUrl);
            result.steps.validation.pass = true;
            result.steps.validation.message = `Valid URL, domain: ${domain}`;
            log(result.steps.validation.message);
        } catch (error) {
            result.steps.validation.message = `Invalid URL: ${error.message}`;
            result.error = 'URL validation failed';
            return result;
        }

        // Step 2: Check scraper availability
        log('Step 2: Checking scraper availability...');
        try {
            const domain = validateUrl(comicUrl);
            const scraper = getScraperForDomain(domain);
            const config = getWebsiteConfig(domain);
            result.steps.scraper.pass = true;
            result.steps.scraper.message = `Scraper found: ${config.name}, useBrowser: ${!!config.useBrowser}`;
            log(result.steps.scraper.message);
        } catch (error) {
            result.steps.scraper.message = `No scraper found: ${error.message}`;
            result.error = 'No scraper available for this domain';
            return result;
        }

        // Step 3: Test connectivity and fetch
        log('Step 3: Testing connectivity...');
        const { fetchData, fetchDataWithBrowser } = require('./index');
        const domain = validateUrl(comicUrl);
        const config = getWebsiteConfig(domain);
        const fetchFn = config.useBrowser ? fetchDataWithBrowser : fetchData;

        let $;
        try {
            $ = await fetchFn(comicUrl);
            result.steps.connectivity.pass = true;
            result.steps.connectivity.message = 'Successfully fetched HTML';
            log(result.steps.connectivity.message);
        } catch (error) {
            result.steps.connectivity.message = `Fetch failed: ${error.message}`;
            result.error = 'Cannot fetch page';
            return result;
        }

        // Step 4: Test chapter extraction
        log('Step 4: Testing chapter extraction...');
        try {
            const scraper = getScraperForDomain(domain);
            const chapters = scraper.getChapters($, domain);

            if (!Array.isArray(chapters) || chapters.length === 0) {
                result.steps.chapters.message = 'No chapters found';
                result.error = 'Chapter extraction failed';
                return result;
            }

            result.steps.chapters.pass = true;
            result.steps.chapters.count = chapters.length;
            result.steps.chapters.message = `Found ${chapters.length} chapters`;
            log(result.steps.chapters.message);

            // Step 5: Test first chapter data (optional)
            if (testChapter && chapters.length > 0) {
                log('Step 5: Testing first chapter data extraction...');
                const firstChapterUrl = chapters[0].url;

                try {
                    const $chapter = await fetchFn(firstChapterUrl);
                    const chapterData = scraper.getChapterData($chapter, firstChapterUrl);

                    if (!chapterData.data || chapterData.data.length === 0) {
                        result.steps.chapterData.message = 'Chapter has no images';
                    } else {
                        result.steps.chapterData.pass = true;
                        result.steps.chapterData.imageCount = chapterData.data.length;
                        result.steps.chapterData.message = `Chapter "${chapterData.title}" has ${chapterData.data.length} images`;
                        log(result.steps.chapterData.message);
                    }
                } catch (error) {
                    result.steps.chapterData.message = `Failed to fetch chapter: ${error.message}`;
                }
            }
        } catch (error) {
            result.steps.chapters.message = `Chapter extraction failed: ${error.message}`;
            result.error = 'Cannot extract chapters';
            return result;
        }

        // All critical steps passed
        result.success = true;
    } catch (error) {
        result.error = error.message;
    }

    return result;
}

/**
 * Print test result in a formatted way
 *
 * @param {Object} result - Result from testScraper()
 */
function printTestResult(result) {
    console.log('\n=== Scraper Test Result ===');
    console.log(`URL: ${result.url}`);
    console.log(`Status: ${result.success ? 'PASS' : 'FAIL'}`);

    if (result.error) {
        console.log(`Error: ${result.error}`);
    }

    console.log('\nSteps:');
    const stepLabels = {
        validation: '1. URL Validation',
        connectivity: '2. Connectivity',
        scraper: '3. Scraper',
        chapters: '4. Chapter Extraction',
        chapterData: '5. Chapter Data',
    };

    for (const [key, label] of Object.entries(stepLabels)) {
        const step = result.steps[key];
        if (!step) continue;
        const icon = step.pass ? '' : '';
        console.log(`  ${icon} ${label}: ${step.pass ? 'PASS' : 'FAIL'} - ${step.message}`);
    }

    console.log('========================\n');
}

/**
 * Quick test - returns true if basic scraping works
 *
 * @param {string} comicUrl - The URL of the comic's main page
 * @returns {Promise<boolean>} True if scraping works
 */
async function canScrape(comicUrl) {
    const result = await testScraper(comicUrl);
    return result.success;
}

module.exports = {
    testScraper,
    printTestResult,
    canScrape,
};
