const { getDatabase } = require('../config/database');

const CACHE_COLLECTION = 'cache_entries';

/**
 * Get cached value by key
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} - Cached value or null if not found/expired
 */
async function get(key) {
    try {
        const db = getDatabase();
        const collection = db.collection(CACHE_COLLECTION);

        const doc = await collection.findOne(
            { key },
            {
                projection: { value: 1, _id: 0 }
            }
        );

        return doc ? doc.value : null;
    } catch (error) {
        console.error(`Cache get error for key "${key}":`, error.message);
        return null;
    }
}

/**
 * Store value with expiration
 * @param {string} key - Cache key
 * @param {any} value - Value to cache (will be JSON stringified)
 * @param {number} ttl - Time to live in seconds
 * @returns {Promise<boolean>} - True if successful
 */
async function put(key, value, ttl) {
    try {
        const db = getDatabase();
        const collection = db.collection(CACHE_COLLECTION);

        const now = new Date();
        const expiresAt = new Date(now.getTime() + ttl * 1000);

        const result = await collection.updateOne(
            { key },
            {
                $set: {
                    key,
                    value,
                    createdAt: now,
                    expiresAt,
                }
            },
            { upsert: true }
        );

        return result.acknowledged;
    } catch (error) {
        console.error(`Cache put error for key "${key}":`, error.message);
        return false;
    }
}

/**
 * Delete specific cache entry
 * @param {string} key - Cache key to delete
 * @returns {Promise<boolean>} - True if deleted, false if not found
 */
async function del(key) {
    try {
        const db = getDatabase();
        const collection = db.collection(CACHE_COLLECTION);

        const result = await collection.deleteOne({ key });
        return result.deletedCount > 0;
    } catch (error) {
        console.error(`Cache delete error for key "${key}":`, error.message);
        return false;
    }
}

/**
 * Clear all cache entries
 * @returns {Promise<number>} - Number of entries deleted
 */
async function clear() {
    try {
        const db = getDatabase();
        const collection = db.collection(CACHE_COLLECTION);

        const result = await collection.deleteMany({});
        return result.deletedCount;
    } catch (error) {
        console.error('Cache clear error:', error.message);
        return 0;
    }
}

/**
 * Get cache statistics
 * @returns {Promise<Object>} - Cache stats
 */
async function getStats() {
    try {
        const db = getDatabase();
        const collection = db.collection(CACHE_COLLECTION);

        const totalEntries = await collection.countDocuments();
        const expiredEntries = await collection.countDocuments({
            expiresAt: { $lt: new Date() }
        });

        // Get size of cache entries in bytes (approximate)
        const stats = await collection.aggregate([
            {
                $group: {
                    _id: null,
                    totalSize: { $sum: { $strLenCP: { $toString: '$value' } } },
                    avgSize: { $avg: { $strLenCP: { $toString: '$value' } } }
                }
            }
        ]).toArray();

        return {
            totalEntries,
            expiredEntries,
            totalSize: stats[0]?.totalSize || 0,
            avgSize: Math.round(stats[0]?.avgSize || 0),
        };
    } catch (error) {
        console.error('Cache stats error:', error.message);
        return {
            totalEntries: 0,
            expiredEntries: 0,
            totalSize: 0,
            avgSize: 0,
        };
    }
}

module.exports = {
    get,
    put,
    del,
    clear,
    getStats,
};
