const { testScraper, printTestResult } = require('./utils/test-scraper');

async function runTests() {
    // Test URLs - one from each supported website
    const testUrls = [
        'https://komiku.org/manga/komik-one-piece-indo/',
        // 'https://v1.komikcast.fit/manga/one-piece', // Uncomment to test komikcast
    ];

    for (const url of testUrls) {
        console.log(`\nTesting: ${url}`);
        console.log('='.repeat(60));

        const result = await testScraper(url, {
            verbose: true,
            testChapter: true,
        });

        printTestResult(result);
    }
}

runTests().catch(console.error);
