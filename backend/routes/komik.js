const express = require('express');
const { cacheMiddleware } = require('../utils/cache');
const asyncHandler = require('../utils/asyncHandler');
const {
    getChapters,
    getChapterData,
} = require('../controllers/komikController');
const {
    getCacheStats,
    getCachedComicsList,
    clearCacheEntries,
} = require('../controllers/cacheController');
const {
    proxyImage,
} = require('../controllers/imageProxyController');

const ONE_DAY = 3600 * 24;
const router = express.Router();

/**
 * FRONTEND/BACKEND CONTRACT FOR NSFW/SECRET MODE
 * =================================================
 *
 * **Frontend Behavior:**
 * - NSFW preference is stored in localStorage as 'nsfwEnabled' ('true' or 'false')
 * - Frontend sends `mode=secret` query parameter to API when localStorage.nsfwEnabled === 'true'
 * - Navigation URLs are clean (no ?mode=secret parameter)
 * - Frontend filters NSFW content from cached-comics list based on localStorage
 *
 * **Backend Behavior:**
 * - API receives `mode=secret` parameter from frontend based on localStorage state
 * - Backend validates: if (mode !== 'secret' && config.nsfw) returns 403
 * - Backend is authoritative for security - frontend cannot bypass this check
 * - No security reduction - NSFW content is still protected server-side
 *
 * **Migration:**
 * - Old URL-based system: ?mode=secret parameter polluted browser history
 * - New localStorage system: Setting persists across sessions without URL pollution
 * - Old 'secretMode' localStorage key migrates to new 'nsfwEnabled' key
 */

// === Comic Endpoints ===

/**
 * GET /komik/chapters?url=<comic-url>&mode=<normal|secret>
 * Returns chapter list for a comic
 */
router.get('/chapters', cacheMiddleware(ONE_DAY), asyncHandler(getChapters));

/**
 * GET /komik/data?url=<chapter-url>&mode=<normal|secret>
 * Returns images for a specific chapter
 */
router.get('/data', cacheMiddleware(ONE_DAY), asyncHandler(getChapterData));

/**
 * GET /komik/image?url=<image-url>
 * Image proxy to bypass CORS and hotlink protection
 */
router.get('/image', asyncHandler(proxyImage));

// === Admin Endpoints ===

/**
 * GET /komik/cache/stats
 * View cache statistics
 */
router.get('/cache/stats', asyncHandler(getCacheStats));

/**
 * GET /komik/cached-comics
 * Returns array of cached comics with: { url, title, domain, cachedAt, expiresAt, isNsfw }
 */
router.get('/cached-comics', asyncHandler(getCachedComicsList));

/**
 * DELETE /komik/cache?key=<cache-key>
 * Delete specific cache entry by key
 * DELETE /komik/cache
 * Clear all cache entries
 */
router.delete('/cache', asyncHandler(clearCacheEntries));

module.exports = router;
