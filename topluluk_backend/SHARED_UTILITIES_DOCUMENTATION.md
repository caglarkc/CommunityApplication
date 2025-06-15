# 🛠️ Shared Utilities Documentation

## 📋 Overview

The **shared** directory contains common utilities, services, and middleware used across all microservices in the Topluluk backend. This promotes code reusability, consistency, and maintainability.

## 🗂️ Directory Structure

```
shared/
├── config/                    # Configuration files
├── middlewares/               # Common middleware
│   ├── auth.middleware.js
│   ├── errorHandler/
│   └── requestContext.js
├── models/                    # Shared data models
├── services/                  # Shared services
│   ├── event/                 # Event bus system
│   ├── session.service.js
│   ├── device.service.js
│   ├── token.service.js
│   ├── redis.service.js
│   └── log.service.js
├── utils/                     # Utility functions
│   ├── logger.js
│   ├── tokenUtils.js
│   ├── validationUtils.js
│   ├── textUtils.js
│   ├── helpers.js
│   ├── stringUtils.js
│   ├── eventErrorHelper.js
│   ├── errors/                # Custom error classes
│   └── constants/             # Application constants
├── database.js                # Database utilities
└── package.json               # Shared dependencies
```

## 🔧 Core Utilities

### 1. Logger (`utils/logger.js`)

**Purpose**: Centralized logging system using Winston

**Features:**
- Structured JSON logging
- Multiple log levels (error, warn, info, debug)
- HTTP request logging with Morgan
- Service-specific log formatting
- Request ID tracking

**Usage:**
```javascript
const { logger, httpLogger } = require('../../../shared/utils/logger');

// Basic logging
logger.info('Operation completed', {
  userId: 'user123',
  operation: 'login',
  duration: '200ms'
});

logger.error('Database error', {
  error: error.message,
  stack: error.stack,
  requestId: req.requestId
});

// HTTP middleware
app.use(httpLogger);
```

**Log Format:**
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info",
  "service": "auth-service",
  "message": "User logged in successfully",
  "userId": "507f1f77bcf86cd799439011",
  "requestId": "uuid-request-id"
}
```

### 2. Token Utils (`utils/tokenUtils.js`)

**Purpose**: JWT token management and validation

**Key Functions:**
```javascript
// Generate JWT token
const token = generateJWT(payload, expiresIn);

// Validate JWT token
const isValid = validateJWT(token);

// Extract token information
const tokenInfo = extractTokenInfo(token);

// Generate unique token ID
const tokenId = generateTokenId();

// Check token expiration
const isExpired = isTokenExpired(token);
```

**Features:**
- JWT generation with custom payload
- Token validation and verification
- Token expiration checking
- Secure token ID generation
- Token blacklisting support

### 3. Validation Utils (`utils/validationUtils.js`)

**Purpose**: Common validation functions

**Key Functions:**
```javascript
// Email validation
const isValidEmail = validateEmail(email);

// Phone validation (Turkish format)
const isValidPhone = validateTurkishPhone(phone);

// Password strength validation
const isStrongPassword = validatePassword(password);

// ObjectId validation
const isValidObjectId = validateObjectId(id);

// Input sanitization
const sanitized = sanitizeInput(input);
```

**Validation Rules:**
```javascript
const VALIDATION_RULES = {
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    maxLength: 255
  },
  phone: {
    pattern: /^5[0-9]{9}$/,
    length: 10
  },
  password: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumber: true
  }
};
```

### 4. Text Utils (`utils/textUtils.js`)

**Purpose**: Text processing and formatting utilities

**Key Functions:**
```javascript
// Text normalization
const normalized = normalizeText(text);

// Slug generation
const slug = generateSlug(text);

// Text truncation
const truncated = truncateText(text, maxLength);

// Case conversion
const titleCase = toTitleCase(text);

// Text validation
const isValidText = validateTextLength(text, min, max);
```

### 5. String Utils (`utils/stringUtils.js`)

**Purpose**: String manipulation utilities

**Key Functions:**
```javascript
// String trimming and cleaning
const cleaned = cleanString(str);

// Random string generation
const randomStr = generateRandomString(length);

// String hashing
const hash = hashString(str);
```

### 6. Helpers (`utils/helpers.js`)

**Purpose**: General helper functions

**Key Functions:**
```javascript
// Object utilities
const cleaned = removeEmptyFields(obj);
const flattened = flattenObject(obj);

// Array utilities
const unique = getUniqueItems(array);
const chunked = chunkArray(array, size);

// Date utilities
const formatted = formatDate(date, format);
const isRecent = isRecentDate(date, hours);

// ID generation
const uniqueId = generateUniqueId();
```

### 7. Event Error Helper (`utils/eventErrorHelper.js`)

**Purpose**: Standardized error handling for event bus communication

**Key Functions:**
```javascript
// Success response wrapper
const successResponse = handleSuccess(data, message);

// Error response wrapper
const errorResponse = handleError(error, message);

// Type-specific error handling
const typedError = handleErrorWithType(response, context, message);
```

**Response Formats:**
```javascript
// Success format
{
  success: true,
  message: "Operation completed successfully",
  data: { /* response data */ },
  timestamp: "2024-01-15T10:30:00.000Z"
}

// Error format
{
  success: false,
  message: "Operation failed",
  error: "ValidationError",
  details: "Invalid input data",
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

## 🔗 Shared Services

### 1. Event Bus System (`services/event/`)

**Purpose**: Inter-service communication via Redis Pub/Sub

#### Event Bus Service (`eventBus.service.js`)
```javascript
// Connect to Redis
await eventBus.connect();

// Close connection
await eventBus.close();

// Publish event
await eventBus.publish(channel, message);

// Subscribe to events
await eventBus.subscribe(channel, handler);
```

#### Event Publisher (`eventPublisher.js`)
```javascript
// Send request and wait for response
const response = await eventPublisher.request(
  'service.action.method',
  payload,
  { timeout: 10000 }
);

// Fire and forget
await eventPublisher.publish('service.notification', data);
```

#### Event Subscriber (`eventSubscriber.js`)
```javascript
// Respond to requests
await eventSubscriber.respondTo('service.action.method', async (payload, metadata) => {
  // Process request
  return response;
});

// Listen to notifications
await eventSubscriber.subscribe('service.notification', async (data) => {
  // Handle notification
});
```

#### Event Schema (`eventSchema.js`)
```javascript
// Standard event structure
{
  eventId: UUID,
  timestamp: ISO8601,
  sourceService: String,
  correlationId: UUID,
  payload: Object,
  replyTo: String
}
```

### 2. Session Service (`services/session.service.js`)

**Purpose**: Redis-based session management

**Key Functions:**
```javascript
// Create session
const session = await createSession(userId, deviceInfo, ipAddress);

// Get session
const session = await getSession(sessionId);

// Update session activity
await updateSessionActivity(sessionId);

// Delete session
await deleteSession(sessionId);

// Get user sessions
const sessions = await getUserSessions(userId);

// Clean expired sessions
await cleanExpiredSessions();
```

**Session Structure:**
```javascript
{
  sessionId: UUID,
  userId: ObjectId,
  deviceId: String,
  platform: String,
  deviceModel: String,
  deviceVersion: String,
  ipAddress: String,
  userAgent: String,
  loginTime: Date,
  lastActivity: Date,
  isActive: Boolean,
  expiresAt: Date
}
```

### 3. Device Service (`services/device.service.js`)

**Purpose**: Device management and fingerprinting

**Key Functions:**
```javascript
// Generate device fingerprint
const deviceId = generateDeviceId(deviceInfo);

// Register device
const device = await registerDevice(userId, deviceInfo);

// Get user devices
const devices = await getUserDevices(userId);

// Validate device
const isValid = await validateDevice(userId, deviceInfo);

// Remove device
await removeDevice(userId, deviceId);
```

**Device Structure:**
```javascript
{
  deviceId: String,
  userId: ObjectId,
  platform: String,      // ios, android, web
  model: String,         // iPhone 13, Samsung Galaxy, etc.
  version: String,       // OS version
  appVersion: String,    // App version
  isActive: Boolean,
  firstSeen: Date,
  lastSeen: Date
}
```

### 4. Token Service (`services/token.service.js`)

**Purpose**: Advanced JWT token management

**Key Functions:**
```javascript
// Generate access token with session
const tokenData = await generateAccessTokenWithSession(user, deviceInfo, ipAddress);

// Validate token with session
const validation = await validateTokenWithSession(token, deviceInfo, ipAddress);

// Refresh access token
const newToken = await refreshAccessToken(userId, deviceInfo, ipAddress);

// Revoke token
await revokeToken(token);

// Extract token info
const info = extractTokenInfo(token);
```

### 5. Redis Service (`services/redis.service.js`)

**Purpose**: Redis connection and operations

**Key Functions:**
```javascript
// Connect to Redis
await connectRedis();

// Basic operations
await redisSet(key, value, ttl);
const value = await redisGet(key);
await redisDel(key);

// Hash operations
await redisHSet(key, field, value);
const value = await redisHGet(key, field);

// List operations
await redisLPush(key, value);
const value = await redisRPop(key);
```

### 6. Log Service (`services/log.service.js`)

**Purpose**: Centralized logging operations

**Key Functions:**
```javascript
// Service-specific logger
const serviceLogger = createServiceLogger(serviceName);

// Log with context
await logWithContext(level, message, context);

// Log request/response
await logRequest(req, res, duration);

// Log error with stack trace
await logError(error, context);
```

## 🚫 Custom Error Classes (`utils/errors/`)

### ValidationError
```javascript
class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
  }
}
```

### AuthenticationError
```javascript
class AuthenticationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}
```

### AuthorizationError
```javascript
class AuthorizationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}
```

## 🛡️ Shared Middleware

### 1. Auth Middleware (`middlewares/auth.middleware.js`)

**Purpose**: JWT token validation middleware

```javascript
// Protect routes
app.use('/protected', authMiddleware);

// Optional authentication
app.use('/optional', authMiddleware({ optional: true }));

// Role-based protection
app.use('/admin', authMiddleware({ requiredRole: 'admin' }));
```

### 2. Request Context Middleware (`middlewares/requestContext.js`)

**Purpose**: Add request tracking and context

```javascript
// Adds unique requestId to each request
app.use(requestContextMiddleware);

// Usage in controllers
logger.info('Operation completed', {
  userId: user.id,
  requestId: req.requestId
});
```

### 3. Error Handler (`middlewares/errorHandler/`)

**Purpose**: Centralized error handling

```javascript
// Global error handler
app.use(errorHandler);

// Async wrapper for route handlers
router.get('/endpoint', asyncHandler(async (req, res) => {
  // Route logic
}));
```

## 📊 Database Utilities (`database.js`)

**Purpose**: MongoDB connection and utilities

**Key Functions:**
```javascript
// Connect to MongoDB
await connectMongoDB();

// Close connections
await closeConnections();

// Health check
const isHealthy = await checkDatabaseHealth();

// Transaction wrapper
await withTransaction(async (session) => {
  // Database operations within transaction
});
```

## 🔧 Constants (`utils/constants/`)

**Purpose**: Application-wide constants

```javascript
// HTTP status codes
const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_ERROR: 500
};

// Error messages
const ERROR_MESSAGES = {
  VALIDATION: {
    INVALID_EMAIL: 'Invalid email format',
    WEAK_PASSWORD: 'Password too weak',
    REQUIRED_FIELD: 'This field is required'
  },
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Token has expired',
    ACCESS_DENIED: 'Access denied'
  }
};

// Service constants
const SERVICES = {
  AUTH: 'auth-service',
  COMMUNITY: 'community-service',
  UPLOAD: 'upload-service'
};
```

## 🧪 Testing Utilities

**Purpose**: Common testing helpers and utilities

```javascript
// Mock data generators
const mockUser = generateMockUser();
const mockCommunity = generateMockCommunity();

// Test database helpers
await setupTestDatabase();
await cleanupTestDatabase();

// Mock event bus
const mockEventBus = createMockEventBus();
```

## 🔧 Configuration Management

### Environment Variables
```env
# Shared configuration
NODE_ENV=development
LOG_LEVEL=info

# Database
MONGODB_URI=mongodb://localhost:27017/topluluk_db
REDIS_URI=redis://localhost:6379

# JWT
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=24h

# Event Bus
EVENT_BUS_TIMEOUT=10000
MAX_RETRY_ATTEMPTS=3
```

### Service Integration
```javascript
// How services use shared utilities
const { logger } = require('../../../shared/utils/logger');
const { validateEmail } = require('../../../shared/utils/validationUtils');
const eventPublisher = require('../../../shared/services/event/eventPublisher');
```

## 🚀 Performance & Best Practices

### Memory Management
- Connection pooling for databases
- Redis connection reuse
- Event listener cleanup

### Error Handling
- Graceful error degradation
- Circuit breaker patterns
- Retry mechanisms with backoff

### Monitoring
- Health check endpoints
- Performance metrics
- Resource usage tracking

## 🔮 Future Enhancements

### Planned Additions
1. **Rate Limiting Utilities**: Shared rate limiting logic
2. **Caching Utilities**: Advanced caching strategies
3. **Monitoring Utilities**: APM integration helpers
4. **Security Utilities**: Advanced security helpers
5. **Testing Utilities**: Enhanced testing frameworks

This shared utilities foundation provides a robust, reusable codebase that ensures consistency and maintainability across all microservices. 