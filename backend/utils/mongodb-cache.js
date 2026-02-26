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
 * Get all cached comics from MongoDB
 * @returns {Promise<Array>} Array of cached comics with metadata
 */
async function getCachedComics() {
    try {
        const db = getDatabase();
        const collection = db.collection(CACHE_COLLECTION);

        // Query cache entries for chapter lists (pattern: __express__/komik/chapters?url=)
        const cursor = collection.find({
            key: { $regex: /^__express__\/komik\/chapters\?url=/ }
        });

        const entries = await cursor.toArray();

        // Process entries to extract comic metadata
        const comicsMap = new Map();

        for (const entry of entries) {
            try {
                // Parse URL from cache key
                // Key format: __express__/komik/chapters?url=<URL>[&mode=secret]
                const keyMatch = entry.key.match(/^__express__\/komik\/chapters\?url=(.+)$/);
                if (!keyMatch) continue;

                const rawUrl = decodeURIComponent(keyMatch[1]);
                // Remove mode parameter for deduplication
                const cleanUrl = rawUrl.split('&mode=')[0];

                // Parse cached value to get comic title
                let title = 'Unknown';
                if (entry.value && entry.value.body) {
                    const body = typeof entry.value.body === 'string'
                        ? JSON.parse(entry.value.body)
                        : entry.value.body;

                    if (body.data && body.data.title) {
                        title = body.data.title;
                    }
                }

                // Extract domain from URL
                let domain = '';
                try {
                    const urlObj = new URL(cleanUrl);
                    domain = urlObj.hostname;
                } catch (e) {
                    domain = 'unknown';
                }

                // Use the most recent entry (sorted by createdAt later)
                const existing = comicsMap.get(cleanUrl);
                if (!existing || new Date(entry.createdAt) > new Date(existing.cachedAt)) {
                    comicsMap.set(cleanUrl, {
                        url: cleanUrl,
                        title,
                        domain,
                        cachedAt: entry.createdAt,
                        expiresAt: entry.expiresAt,
                        isNsfw: rawUrl.includes('mode=secret')
                    });
                }
            } catch (parseError) {
                // Skip entries that can't be parsed
                console.debug('Failed to parse cache entry:', entry.key, parseError.message);
            }
        }

        // Convert to array and sort by cachedAt (newest first)
        const comics = Array.from(comicsMap.values()).sort((a, b) =>
            new Date(b.cachedAt) - new Date(a.cachedAt)
        );

        return comics;
    } catch (error) {
        console.error('Get cached comics error:', error.message);
        return [];
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
    getCachedComics,
};
