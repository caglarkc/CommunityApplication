require('dotenv').config(); // Önce lokal .env'yi yükle
require('dotenv').config({ path: '../../../.env', override: false }); // Eksik değerler için ana .env'yi yükle

// 🔥 FIX: Service name'i belirle - shared services için
process.env.SERVICE_NAME = 'upload-service';

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const uploadService = require('./services/upload.service');
const { logger } = require('../../../shared/utils/logger');
const eventBus = require('../../../shared/services/event/eventBus.service');

// Firebase connection test
const { testBucketConnection } = require('../config/firebase');

// Create Express application
const app = express();
const PORT = 16042; // Upload service port

// 🔒 Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// 🚦 Rate limiting - Upload specific limits
const uploadRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 50, // Max 50 upload per 15 minutes
  message: {
    success: false,
    message: 'Çok fazla dosya yükleme isteği. 15 dakika sonra tekrar deneyin.',
    error: 'TooManyRequests'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🌐 CORS middleware - Frontend'in 3000 portundan isteklere izin ver
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 📝 HTTP request logging
app.use(morgan('combined'));

// ⚙️ Basic middleware
app.use(express.json({ limit: '15mb' })); // Upload için büyük limit
app.use(express.urlencoded({ extended: true, limit: '15mb' }));
app.use(cookieParser());

// 🚦 Apply rate limiting to all upload routes
app.use('/api/v1/upload', uploadRateLimit);

// 🛣️ Upload routes
const uploadRoutes = require('./routes/upload.routes');
app.use('/api/v1/upload', uploadRoutes);

// 🏠 Basic route for testing
app.get('/', (req, res) => {
  res.json({ 
    service: 'Upload Service',
    status: 'running',
    version: '1.0.0',
    port: PORT,
    description: 'File upload and processing microservice',
    endpoints: {
      health: '/health',
      info: '/info',
      upload: '/api/v1/upload/*'
    }
  });
});

// 🏥 Health check endpoint
app.get('/health', async (req, res) => {
  try {
    // Test Firebase connection
    const firebaseStatus = await testBucketConnection();
    
    res.json({
      service: 'Upload Service',
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
      },
      connections: {
        firebase: firebaseStatus ? 'connected' : 'disconnected'
      }
    });
  } catch (error) {
    res.status(503).json({
      service: 'Upload Service',
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// ℹ️ Service info endpoint
app.get('/info', (req, res) => {
  res.json({
    service: 'Upload Service',
    version: '1.0.0',
    description: 'Mikroservis tabanlı dosya yükleme ve işleme servisi',
    features: [
      'File upload to Firebase Storage',
      'Image optimization with Sharp',
      'Community-based file organization',
      '14-digit unique file ID system',
      'Multiple file format support',
      'Rate limiting protection',
      'Security middleware'
    ],
    supportedFormats: {
      images: ['JPEG', 'PNG', 'WebP'],
      documents: ['PDF']
    },
    limits: {
      maxFileSize: '10MB',
      maxFilesPerRequest: 10,
      rateLimit: '50 uploads per 15 minutes'
    },
    endpoints: {
      'POST /api/v1/upload/images': 'Upload image files (PNG, JPG, JPEG, WebP)',
      'POST /api/v1/upload/pdf': 'Upload PDF documents',
      'POST /api/v1/upload/get-files': 'Get files by community and category',
      'DELETE /api/v1/upload/delete-file': 'Delete file'
    }
  });
});

// 🚫 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint bulunamadı',
    error: 'NotFound',
    availableEndpoints: {
      root: '/',
      health: '/health',
      info: '/info',
      upload: '/api/v1/upload/*'
    }
  });
});

// 🚨 Global error handler
app.use((error, req, res, next) => {
  console.error('Upload Service Error:', error);
  
  // Multer errors (file upload errors)
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      message: 'Dosya boyutu çok büyük (max 10MB)',
      error: 'FileTooLarge'
    });
  }
  
  if (error.code === 'LIMIT_FILE_COUNT') {
    return res.status(413).json({
      success: false,
      message: 'Çok fazla dosya (max 10 dosya)',
      error: 'TooManyFiles'
    });
  }

  // Sharp errors (image processing errors)
  if (error.message && error.message.includes('Input buffer')) {
    return res.status(400).json({
      success: false,
      message: 'Geçersiz resim formatı',
      error: 'InvalidImageFormat'
    });
  }

  // Firebase errors
  if (error.code && error.code.startsWith('storage/')) {
    return res.status(503).json({
      success: false,
      message: 'Dosya depolama hatası',
      error: 'StorageError'
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    message: 'Sunucu hatası',
    error: 'InternalServerError'
  });
});

// 🚀 Initialize Firebase connection
async function initializeFirebase() {
  try {
    console.log('🔥 Firebase bağlantısı test ediliyor...');
    const connected = await testBucketConnection();
    if (connected) {
      console.log('✅ Firebase Storage bağlantısı başarılı!');
    } else {
      console.log('⚠️  Firebase Storage bağlantısı başarısız!');
    }
  } catch (error) {
    console.error('❌ Firebase bağlantı hatası:', error.message);
  }
}

// Initialize event listeners for event bus communications
async function initializeEventHandlers() {
  try {
    await eventBus.connect();
    logger.info('EventBus connection established successfully');
    
    await uploadService.initializeEventListeners();
    logger.info('Event listeners initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize event listeners', { error: error.message, stack: error.stack });
  }
}

// 🚀 Start the server
async function startServer() {
  try {
    // Initialize Firebase connection
    await initializeFirebase();
    
    // Initialize event handlers
    await initializeEventHandlers();
    
    // Start listening
    app.listen(PORT, () => {
      console.log(`✅ Upload Service başlatıldı: http://localhost:${PORT}`);
      console.log(`📚 Health check: http://localhost:${PORT}/health`);
      console.log(`ℹ️  Service info: http://localhost:${PORT}/info`);
      console.log(`🔥 Firebase Storage ready for file uploads`);
      console.log(`🎧 Event listeners ready for file operations`);
    });
    
    // Handle application shutdown
    process.on('SIGINT', async () => {
      console.log('\n🔄 Upload Service kapatılıyor...');
      
      // Close EventBus connection
      await eventBus.close();
      logger.info('EventBus connection closed');
      
      console.log('✅ Upload Service kapatıldı.');
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      console.log('\n🔄 Upload Service kapatılıyor...');
      
      // Close EventBus connection
      await eventBus.close();
      logger.info('EventBus connection closed');
      
      console.log('✅ Upload Service kapatıldı.');
      process.exit(0);
    });

    // Beklenmeyen hatalar için global error handler
    process.on('uncaughtException', (error) => {
      console.error('Upload Service: Uncaught exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('Upload Service: Unhandled rejection', { reason: reason.message, stack: reason.stack });
    });
    
  } catch (error) {
    console.error('❌ Upload Service başlatma hatası:', error.message);
    process.exit(1);
  }
}

// Start the application only if not being required (imported) by another module (like tests)
if (require.main === module) {
  startServer();
}

module.exports = app;
