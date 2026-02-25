const {
    del,
    clear,
    getStats,
    getCachedComics,
} = require('../utils/mongodb-cache');

/**
 * Cache controller - handles cache management and statistics
 * Provides admin endpoints for monitoring and managing the MongoDB cache
 */

/**
 * GET /komik/cache/stats
 * Returns cache statistics including total entries, expired entries, and size
 */
async function getCacheStats(req, res, next) {
    const stats = await getStats();
    res.json(stats);
}

/**
 * GET /komik/cached-comics
 * Returns array of cached comics with: { url, title, domain, cachedAt, expiresAt, isNsfw }
 */
async function getCachedComicsList(req, res, next) {
    const comics = await getCachedComics();
    res.json(comics);
}

/**
 * DELETE /komik/cache?key=<cache-key>
 * Delete specific cache entry by key
 * DELETE /komik/cache
 * Clear all cache entries
 */
async function clearCacheEntries(req, res, next) {
    const { key } = req.query;

    if (key) {
        // Delete specific cache entry
        const deleted = await del(key);

        if (deleted) {
            return res.json({
                success: true,
                message: `Cache entry deleted: ${key}`,
            });
        } else {
            return res.status(404).json({
                success: false,
                message: `Cache entry not found: ${key}`,
            });
        }
    } else {
        // Clear all cache entries
        const deletedCount = await clear();
        return res.json({
            success: true,
            deletedEntries: deletedCount,
            message: `Cleared ${deletedCount} cache entries`,
        });
    }
}

module.exports = {
    getCacheStats,
    getCachedComicsList,
    clearCacheEntries,
};
