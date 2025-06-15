require('dotenv').config(); // Önce lokal .env'yi yükle
require('dotenv').config({ path: '../../../.env', override: false }); // Eksik değerler için ana .env'yi yükle

// 🔥 FIX: Service name'i belirle - shared services için
process.env.SERVICE_NAME = 'auth-service';

const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const authRoutes = require('./routes/auth.routes');
const errorHandler = require('../../../shared/middlewares/errorHandler/errorHandler');
const { requestContextMiddleware } = require('../../../shared/middlewares/requestContext');
const { logger, httpLogger } = require('../../../shared/utils/logger');
const { specs, swaggerUi } = require('./config/swagger');
const authService = require('./services/auth.service');


const { 
  connectMongoDB, 
  connectRedis, 
  closeConnections 
} = require('./utils/database');

// Create Express application
const app = express();
const PORT = 16040;

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

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "User Auth Service API Documentation"
}));

// Routes
app.use('/api/v1/auth', authRoutes);

// Error handling middleware
app.use(errorHandler);

// Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    service: 'User Auth Service',
    status: 'running',
    message: 'Database connections test' 
  });
});

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

// Initialize event listeners for event bus communications
async function initializeEventHandlers() {
  try {
    await authService.initializeEventListeners();
    logger.info('Event listeners initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize event listeners', { error: error.message, stack: error.stack });
  }
}


// Start the server
async function startServer() {
  try {
    // Initialize database connections first
    await initializeDatabases();
    
    await initializeEventHandlers();
    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Server başlatıldı: http://localhost:${PORT}`);
    });
    
    // Handle application shutdown
    process.on('SIGINT', async () => {
      console.log('\n🔄 Uygulama kapatılıyor...');
      await closeConnections();
      console.log('✅ Bağlantılar kapatıldı.');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Uygulama kapatılıyor...');
      await closeConnections();
      console.log('✅ Bağlantılar kapatıldı.');
      process.exit(0);
    });

    // Beklenmeyen hatalar için global error handler
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled rejection', { reason: reason.message, stack: reason.stack });
    });
    
  } catch (error) {
    console.error('❌ Server başlatma hatası:', error.message);
    await closeConnections();
    process.exit(1);
  }
}

// Start the application only if not being required (imported) by another module (like tests)
if (require.main === module) {
  startServer();
}

module.exports = app;