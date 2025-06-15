const { logger } = require('../../utils/logger');
const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Stack trace'ler için ayrı logger oluştur
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const stackLogger = winston.createLogger({
  level: 'error',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf(({ timestamp, message, stack, ...meta }) => {
      return `${timestamp} ERROR: ${message}\nSTACK TRACE:\n${stack}\nMETA: ${JSON.stringify(meta, null, 2)}\n${'='.repeat(80)}\n`;
    })
  ),
  transports: [
    new winston.transports.File({ 
      filename: path.join(logDir, 'stack.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    })
  ]
});

/**
 * Central error handling middleware
 */
function errorHandler(err, req, res, next) {
  // HTTP durum kodunu belirle
  const statusCode = err.statusCode || 500;
  
  // 🔒 GÜVENLIK: Stack trace'leri frontend'e gönderme
  // Frontend için güvenli error response
  const errorResponse = {
    success: false,
    status: statusCode,
    message: err.message || 'Internal Server Error',
    details: err.details || null,
    type: err.type || null,
    timestamp: new Date().toISOString()
    // ❌ Stack trace kaldırıldı - güvenlik riski
  };
  
  // 📝 Stack trace'leri ayrı dosyaya kaydet
  if (err.stack) {
    stackLogger.error(err.message, {
      stack: err.stack,
      statusCode: statusCode,
      details: err.details,
      type: err.type,
      path: req.path,
      method: req.method,
      requestId: req.requestId,
      userAgent: req.get('user-agent'),
      ip: req.ip
    });
  }
  
  // Hatayı normal loglara da yaz (stack olmadan)
  if (statusCode >= 500) {
    logger.error(`${statusCode} Error:`, {
      error: err.message,
      details: err.details,
      type: err.type,
      path: req.path,
      method: req.method,
      requestId: req.requestId
    });
  } else if (statusCode >= 400) {
    logger.warn(`${statusCode} Error:`, {
      error: err.message,
      details: err.details,
      type: err.type,
      path: req.path,
      method: req.method,
      requestId: req.requestId
    });
  }
  
  // 🔒 Frontend'e güvenli response gönder (stack olmadan)
  res.status(statusCode).json(errorResponse);
}

module.exports = errorHandler;