require('dotenv').config(); // Önce lokal .env'yi yükle
require('dotenv').config({ path: '../../../.env', override: false }); // Eksik değerler için ana .env'yi yükle

// 🔥 FIX: Service name'i belirle - shared services için
process.env.SERVICE_NAME = 'community-service';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const errorHandler = require('../../../shared/middlewares/errorHandler/errorHandler');
const { requestContextMiddleware } = require('../../../shared/middlewares/requestContext');
const { logger, httpLogger } = require('../../../shared/utils/logger');
const eventBus = require('../../../shared/services/event/eventBus.service');
const communityCreateService = require('./services/community-create.service');
const communityCreateRoute = require('./routes/community-create.route');

const { 
  connectMongoDB, 
  connectRedis, 
  closeConnections 
} = require('./utils/database');

// Create Express application
const app = express();
const PORT = 16041; // Community service port (auth-service uses 16040)

// CORS middleware - Frontend'in 3000 portundan isteklere izin ver
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true
}));

app.use(httpLogger);

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(requestContextMiddleware);

// Routes
app.use('/api/v1/community-create', communityCreateRoute);

// Error handling middleware
app.use(errorHandler);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    service: 'Community Create Service',
    status: 'running',
    message: 'Database connections test',
    port: PORT
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    service: 'Community Create Service',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Initialize event bus and listeners
async function initializeEventBus() {
  try {
    await eventBus.connect();
    logger.info('EventBus connection established successfully');
    
    // Initialize event listeners for admin service
    await communityCreateService.initializeEventListeners();
    logger.info('Community Create Service event publishers initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize EventBus', { error: error.message, stack: error.stack });
  }
}

// Initialize database connections
async function initializeDatabases() {
  try {
    console.log('🔄 Database bağlantıları başlatılıyor...');
    
    // Connect to MongoDB
    console.log('📊 MongoDB bağlantısı kuruluyor...');
    await connectMongoDB();
    console.log('✅ MongoDB bağlantısı başarılı!');
    
    // Connect to Redis
    console.log('🔴 Redis bağlantısı kuruluyor...');
    await connectRedis();
    console.log('✅ Redis bağlantısı başarılı!');
    
    console.log('🎉 Tüm database bağlantıları başarılı!');
  } catch (error) {
    console.error('❌ Database bağlantı hatası:', error.message);
    console.error('   Tam hata:', error);
    process.exit(1);
  }
}

// Start the server
async function startServer() {
  try {
    // Initialize database connections first
    await initializeDatabases();
    
    // 🔥 FIX: Enable EventBus initialization
    await initializeEventBus();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Community CreateService başlatıldı: http://localhost:${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/health`);
    });
    
    // Handle application shutdown
    process.on('SIGINT', async () => {
      console.log('\n🔄 Community Create Service kapatılıyor...');

      // Close EventBus connection
      await eventBus.close();
      logger.info('EventBus connection closed');

      await closeConnections();
      console.log('✅ Bağlantılar kapatıldı.');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Community Create Service kapatılıyor...');

      // Close EventBus connection
      await eventBus.close();
      logger.info('EventBus connection closed');
      
      await closeConnections();
      console.log('✅ Bağlantılar kapatıldı.');
      process.exit(0);
    });

    // Beklenmeyen hatalar için global error handler
    process.on('uncaughtException', (error) => {
      logger.error('Community Create Service: Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Community Create Service: Unhandled rejection', { reason: reason.message, stack: reason.stack });
    });
    
  } catch (error) {
    console.error('❌ Community Create Service başlatma hatası:', error.message);
    await closeConnections();
    process.exit(1);
  }
}

// Start the application only if not being required (imported) by another module (like tests)
if (require.main === module) {
  startServer();
}

module.exports = app;