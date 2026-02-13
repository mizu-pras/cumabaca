const { MongoClient } = require('mongodb');

let client = null;
let db = null;

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/cumabaca';
const DB_NAME = process.env.DB_NAME || 'cumabaca';

/**
 * Connect to MongoDB and initialize database indexes
 */
async function connectToDatabase() {
    if (client) {
        return { client, db };
    }

    try {
        client = new MongoClient(MONGODB_URI, {
            maxPoolSize: 10,
            minPoolSize: 2,
            serverSelectionTimeoutMS: 5000,
        });

        await client.connect();
        db = client.db(DB_NAME);

        // Create indexes for cache_entries collection
        const cacheCollection = db.collection('cache_entries');

        // Unique index on key for fast lookups
        await cacheCollection.createIndex('key', { unique: true });

        // TTL index on expiresAt for automatic expiration
        await cacheCollection.createIndex('expiresAt', {
            expireAfterSeconds: 0,
            name: 'ttl_index'
        });

        console.log(`Connected to MongoDB at ${MONGODB_URI}`);

        // Setup graceful shutdown handlers
        setupGracefulShutdown();

        return { client, db };
    } catch (error) {
        console.error('Failed to connect to MongoDB:', error.message);
        throw error;
    }
}

/**
 * Get database instance (must call connectToDatabase first)
 */
function getDatabase() {
    if (!db) {
        throw new Error('Database not initialized. Call connectToDatabase() first.');
    }
    return db;
}

/**
 * Setup graceful shutdown handlers
 */
function setupGracefulShutdown() {
    const shutdown = async (signal) => {
        console.log(`Received ${signal}, closing MongoDB connection...`);
        await closeDatabase();
        process.exit(0);
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
}

/**
 * Close MongoDB connection
 */
async function closeDatabase() {
    if (client) {
        try {
            await client.close();
            console.log('MongoDB connection closed');
        } catch (error) {
            console.error('Error closing MongoDB connection:', error.message);
        }
    }
}

module.exports = {
    connectToDatabase,
    getDatabase,
    closeDatabase,
};
