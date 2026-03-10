import express from 'express';
import {
  scrapeChapters,
  scrapeData,
  getCacheStats,
  clearCache,
  scrapeComics
} from '../controllers/scrapeController.js';

const router = express.Router();

/**
 * POST /scrape/chapters
 * Scrape chapter list from comic URL
 */
router.post('/chapters', scrapeChapters);

/**
 * POST /scrape/data
 * Scrape chapter data (images) from chapter URL
 */
router.post('/data', scrapeData);

/**
 * GET /scrape/cache/stats
 * Get scraper cache statistics
 */
router.get('/cache/stats', getCacheStats);

/**
 * DELETE /scrape/cache
 * Clear all scraper cache
 */
router.delete('/cache', clearCache);

/**
 * POST /scrape/comics
 * Scrape comic listings from a website (paginated)
 */
router.post('/comics', scrapeComics);

export default router;
