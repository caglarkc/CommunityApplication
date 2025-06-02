/**
 * Database connection module
 * Handles connections to Redis and MongoDB
 */

const { MongoClient } = require('mongodb');
const redis = require('redis');

// Environment variables ile config
const config = {
  mongodb: {
    url: process.env.MONGODB_URI || process.env.MONGODB_URL || 'mongodb://localhost:27017',
    dbName: process.env.MONGODB_DB_NAME || 'topluluk_db',
    options: {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      bufferCommands: false
    }
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    username: process.env.REDIS_USERNAME || '',
    password: process.env.REDIS_PASSWORD || '',
    db: process.env.REDIS_DB || 0
  },
  testDB: {
    url: process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017',
    dbName: process.env.TEST_MONGODB_DB_NAME || 'topluluk_test_db',
    options: {
      maxPoolSize: 5,
      serverSelectionTimeoutMS: 5000
    }
  }
};

// MongoDB connection
let mongoClient = null;
let mongoDb = null;

// Redis connection
let redisClient = null;

/**
 * Initialize MongoDB connection
 */
async function connectMongoDB() {
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(config.mongodb.url, config.mongodb.options);
      await mongoClient.connect();
      mongoDb = mongoClient.db(config.mongodb.dbName);
      console.log('MongoDB connection established successfully');
    }
    return mongoDb;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

/**
 * Initialize Redis connection
 */
async function connectRedis() {
  try {
    if (!redisClient) {
      redisClient = redis.createClient({
        url: `redis://${config.redis.username}:${config.redis.password}@${config.redis.host}:${config.redis.port}`,
        database: config.redis.db
      });

      // Redis error handling
      redisClient.on('error', (err) => {
        console.error('Redis error:', err);
      });

      // Connect to Redis
      await redisClient.connect();
      console.log('Redis connection established successfully');
    }
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
}

/**
 * Close database connections
 */
async function closeConnections() {
  try {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
      mongoDb = null;
      console.log('MongoDB connection closed');
    }
    
    if (redisClient) {
      await redisClient.quit();
      redisClient = null;
      console.log('Redis connection closed');
    }
  } catch (error) {
    console.error('Error closing database connections:', error);
    throw error;
  }
}

async function connectTestDB() {
  try {
    if (!mongoClient) {
      mongoClient = new MongoClient(config.testDB.url, config.testDB.options);
      await mongoClient.connect();
      mongoDb = mongoClient.db(config.testDB.dbName);
      console.log('Test MongoDB connection established successfully');
    }
    return mongoDb;
  } catch (error) {
    console.error('Test MongoDB connection error:', error);
    throw error;
  }
}

async function closeTestDB() {
  try {
    if (mongoClient) {
      await mongoClient.close();
      mongoClient = null;
      mongoDb = null;
      console.log('Test MongoDB connection closed');
    }
  } catch (error) {
    console.error('Error closing test database connections:', error);
    throw error;
  }
}


module.exports = {
  connectMongoDB,
  connectRedis,
  closeConnections,
  getMongoDb: () => mongoDb,
  getRedisClient: () => redisClient,
  connectTestDB,
  closeTestDB
}; 