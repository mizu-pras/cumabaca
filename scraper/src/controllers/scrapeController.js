import { getScraperCache, setScraperCache, getScraperCacheStats, clearScraperCache } from '../utils/mongodb-cache.js';
import { fetchData, fetchDataWithBrowser } from '../utils/fetch.js';
import { getScraperForDomain, getWebsiteConfig } from '../scrapers/index.js';

/**
 * Scrape chapter list from comic URL
 */
export async function scrapeChapters(req, res, next) {
  const { url, mode = 'normal' } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  const startTime = Date.now();

  try {
    // Check cache first
    const cached = await getScraperCache(url, mode);
    if (cached) {
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        scrapeTime: cached.scrapeTime
      });
    }

    // Get website configuration
    const config = getWebsiteConfig(url);
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported website'
      });
    }

    // Check NSFW mode requirement
    if (config.nsfw && mode !== 'secret') {
      return res.status(403).json({
        success: false,
        error: 'This content requires secret mode'
      });
    }

    // Fetch HTML
    const $ = config.useBrowser
      ? await fetchDataWithBrowser(url, config)
      : await fetchData(url);

    if (!$) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch page'
      });
    }

    // Get scraper and extract data
    const scraper = getScraperForDomain(url);
    const chapters = scraper.getChapters($, new URL(url).origin);

    const scrapeTime = Date.now() - startTime;

    // Cache the result
    await setScraperCache(url, mode, chapters, scrapeTime);

    res.json({
      success: true,
      data: chapters,
      cached: false,
      scrapeTime
    });

  } catch (error) {
    console.error('Scrape chapters error:', error);
    next(error);
  }
}

/**
 * Scrape chapter data (images) from chapter URL
 */
export async function scrapeData(req, res, next) {
  const { url, mode = 'normal' } = req.body;

  if (!url) {
    return res.status(400).json({
      success: false,
      error: 'URL is required'
    });
  }

  const startTime = Date.now();

  try {
    // Check cache first
    const cached = await getScraperCache(url, mode);
    if (cached) {
      return res.json({
        success: true,
        data: cached.data,
        cached: true,
        scrapeTime: cached.scrapeTime
      });
    }

    // Get website configuration
    const config = getWebsiteConfig(url);
    if (!config) {
      return res.status(400).json({
        success: false,
        error: 'Unsupported website'
      });
    }

    // Check NSFW mode requirement
    if (config.nsfw && mode !== 'secret') {
      return res.status(403).json({
        success: false,
        error: 'This content requires secret mode'
      });
    }

    // Fetch HTML
    const $ = config.useBrowser
      ? await fetchDataWithBrowser(url, config)
      : await fetchData(url);

    if (!$) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch page'
      });
    }

    // Get scraper and extract data
    const scraper = getScraperForDomain(url);
    const data = scraper.getChapterData($, url);

    const scrapeTime = Date.now() - startTime;

    // Cache the result
    await setScraperCache(url, mode, data, scrapeTime);

    res.json({
      success: true,
      data,
      cached: false,
      scrapeTime
    });

  } catch (error) {
    console.error('Scrape data error:', error);
    next(error);
  }
}

/**
 * Get scraper cache statistics
 */
export async function getCacheStats(req, res) {
  try {
    const stats = await getScraperCacheStats();
    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error('Get cache stats error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}

/**
 * Clear scraper cache
 */
export async function clearCache(req, res) {
  try {
    const deleted = await clearScraperCache();
    res.json({
      success: true,
      deleted
    });
  } catch (error) {
    console.error('Clear cache error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
