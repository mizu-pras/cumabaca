import { MongoClient } from 'mongodb';

let client = null;
let db = null;
let scraperCacheCollection = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cumabaca';
const SCRAPER_CACHE_TTL = parseInt(process.env.SCRAPER_CACHE_TTL || '172800'); // 48 hours default

export async function connectDatabase() {
  if (client) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();

  // Get or create scraper cache collection with TTL index
  scraperCacheCollection = db.collection('scraper_cache');
  await scraperCacheCollection.createIndex(
    { expiresAt: 1 },
    { expireAfterSeconds: 0, name: 'ttl_index' }
  );
  await scraperCacheCollection.createIndex(
    { url: 1, mode: 1 },
    { name: 'url_mode_index' }
  );

  console.log('Scraper cache collection ready');
  return db;
}

// Generate cache key from URL and mode
function getCacheKey(url, mode) {
  return `${url}|${mode || 'normal'}`;
}

// Get cached scraping result
export async function getScraperCache(url, mode) {
  if (!scraperCacheCollection) {
    await connectDatabase();
  }

  const key = getCacheKey(url, mode);
  const cached = await scraperCacheCollection.findOne({ key });

  if (cached && cached.expiresAt > new Date()) {
    console.log(`Scraper cache hit: ${key}`);
    return {
      data: cached.data,
      scrapeTime: cached.scrapeTime,
      cached: true
    };
  }

  console.log(`Scraper cache miss: ${key}`);
  return null;
}

// Store scraping result in cache
export async function setScraperCache(url, mode, data, scrapeTime) {
  if (!scraperCacheCollection) {
    await connectDatabase();
  }

  const key = getCacheKey(url, mode);
  const expiresAt = new Date(Date.now() + SCRAPER_CACHE_TTL * 1000);

  await scraperCacheCollection.updateOne(
    { key },
    {
      $set: {
        key,
        url,
        mode: mode || 'normal',
        data,
        scrapeTime,
        expiresAt,
        createdAt: new Date()
      }
    },
    { upsert: true }
  );

  console.log(`Scraper cache set: ${key} (TTL: ${SCRAPER_CACHE_TTL}s)`);
}

// Get cache statistics
export async function getScraperCacheStats() {
  if (!scraperCacheCollection) {
    await connectDatabase();
  }

  const total = await scraperCacheCollection.countDocuments();
  const expired = await scraperCacheCollection.countDocuments({
    expiresAt: { $lt: new Date() }
  });

  return {
    total,
    active: total - expired,
    expired,
    ttl: SCRAPER_CACHE_TTL
  };
}

// Clear all scraper cache
export async function clearScraperCache() {
  if (!scraperCacheCollection) {
    await connectDatabase();
  }

  const result = await scraperCacheCollection.deleteMany({});
  console.log(`Cleared ${result.deletedCount} scraper cache entries`);
  return result.deletedCount;
}

// Close database connection
export async function closeDatabase() {
  if (client) {
    await client.close();
    client = null;
    db = null;
    scraperCacheCollection = null;
  }
}
