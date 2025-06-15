# 🔐 Auth Service Documentation

## 📋 Service Overview

**Auth Service** is the authentication and authorization microservice for the Topluluk Community App. It handles user registration, login, JWT token management, session management, and device authentication.

**Port**: `16040`  
**Base URL**: `http://localhost:16040`

## 🎯 Core Responsibilities

- **User Registration & Authentication**
- **JWT Token Generation & Validation**
- **Session Management** (Redis-based)
- **Device Management & Security**
- **Email Verification**
- **Community Leader Management**
- **Multi-device Support**

## 🏗️ Service Architecture

```
┌─────────────────────────────────────────┐
│              Frontend                   │
│        (Web, Mobile, Admin)             │
└──────────────┬──────────────────────────┘
               │ HTTP Requests
┌──────────────▼──────────────────────────┐
│           Auth Controller               │
│    • register()  • login()              │
│    • validate()  • refresh()            │
│    • logout()    • checkAuth()          │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│           Auth Service                  │
│    • User Management                    │
│    • Password Handling                  │
│    • Community Integration              │
└─────┬────────────────────────────┬──────┘
      │                            │
┌─────▼─────┐              ┌──────▼──────┐
│ MongoDB   │              │    Redis    │
│   Users   │              │  Sessions   │
│Collection │              │   Cache     │
└───────────┘              └─────────────┘
```

## 🗂️ Directory Structure

```
services/auth-service/
├── src/
│   ├── controllers/          # HTTP request handlers
│   │   └── auth.controller.js
│   ├── services/             # Business logic
│   │   └── auth.service.js
│   ├── models/               # Database models
│   │   └── user.model.js
│   ├── routes/               # API routes
│   │   └── auth.routes.js
│   ├── middlewares/          # Service-specific middleware
│   ├── utils/                # Utility functions
│   │   └── database.js
│   ├── config/               # Service configuration
│   └── index.js              # Service entry point
├── package.json              # Dependencies
├── nodemon.json              # Development config
└── logs/                     # Service logs
```

## 📊 Database Schema

### User Model (`user.model.js`)

```javascript
{
  // Personal Information
  name: String,                    // Required
  surname: String,                 // Required
  email: String,                   // Required, unique
  phone: String,                   // Required, unique
  password: String,                // bcrypt hashed

  // University Information
  universityName: String,          // Optional
  universityDepartment: String,    // Optional
  classYear: String,               // Optional

  // Account Status
  isLoggedIn: Boolean,             // Default: false
  isVerified: String,              // 'notVerified'|'verified'|'blocked'|'deleted'
  lastLoginAt: Date,               // Last login timestamp
  status: String,                  // 'user'|'leader_of_community'|'member_of_community'|'admin'

  // Community Management
  communities: [CommunityMembershipSchema],  // Multiple community memberships
  leaderCommunityId: ObjectId,     // If user is a leader

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Community Membership Schema

```javascript
{
  communityId: ObjectId,           // Reference to Community
  role: String,                    // 'member'|'leader'|'admin'
  joinedAt: Date,                  // Join timestamp
  status: String,                  // 'pending'|'approved'|'rejected'|'banned'
}
```

### Redis Session Schema

```javascript
// Key: session:{sessionId}
{
  userId: ObjectId,
  deviceId: String,
  platform: String,
  deviceModel: String,
  deviceVersion: String,
  ipAddress: String,
  userAgent: String,
  loginTime: Date,
  lastActivity: Date,
  isActive: Boolean
}
// TTL: 24 hours
```

## 🛣️ API Endpoints

### 1. User Registration

**POST** `/api/v1/auth/register`

**Request Body:**
```javascript
{
  "name": "Ali",
  "surname": "Koçer",
  "email": "ali@example.com",
  "phone": "5551234567",
  "password": "Passw0rd123",
  "status": "user",                    // Required
  "universityName": "ITU",             // Optional
  "universityDepartment": "Computer",  // Optional
  "classYear": "2023"                  // Optional
}
```

**Validation Rules:**
- **Name**: 3-50 characters
- **Surname**: 3-50 characters  
- **Email**: Valid email format, unique
- **Phone**: Turkish phone format, unique
- **Password**: Min 8 chars, 1 uppercase, 1 lowercase, 1 number

**Response (201):**
```javascript
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "ali@example.com",
    "name": "Ali",
    "surname": "Koçer"
  }
}
```

### 2. User Login

**POST** `/api/v1/auth/login`

**Request Body:**
```javascript
{
  "email": "ali@example.com",         // Either email or phone
  "phone": "5551234567",              // Either email or phone
  "password": "Passw0rd123",
  "deviceInfo": {                     // Required for security
    "platform": "ios",               // ios|android|web
    "model": "iPhone 13",
    "version": "15.0"
  }
}
```

**Response (200):**
```javascript
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "ali@example.com",
    "name": "Ali",
    "surname": "Koçer",
    "status": "user",
    "isVerified": "verified",
    "communities": []
  },
  "session": {
    "sessionId": "uuid-session-id",
    "expiresAt": "2024-01-16T10:30:00.000Z"
  }
}
```

### 3. Token Validation

**POST** `/api/v1/auth/validate`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```javascript
{
  "deviceInfo": {
    "platform": "ios",
    "model": "iPhone 13",
    "version": "15.0"
  }
}
```

**Response (200):**
```javascript
{
  "success": true,
  "userId": "507f1f77bcf86cd799439011",
  "sessionId": "uuid-session-id",
  "message": "Token is valid"
}
```

### 4. Token Refresh

**POST** `/api/v1/auth/refresh`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```javascript
{
  "deviceInfo": {
    "platform": "ios",
    "model": "iPhone 13", 
    "version": "15.0"
  }
}
```

**Response (200):**
```javascript
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2024-01-16T11:30:00.000Z",
  "message": "Token refreshed successfully"
}
```

### 5. Authentication Check

**POST** `/api/v1/auth/check`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Request Body:**
```javascript
{
  "deviceInfo": {
    "platform": "ios",
    "model": "iPhone 13",
    "version": "15.0"
  }
}
```

**Response Scenarios:**

**Valid Auth (200):**
```javascript
{
  "isValid": true,
  "userId": "507f1f77bcf86cd799439011",
  "sessionId": "uuid-session-id",
  "message": "Authentication valid"
}
```

**Invalid Auth (200):**
```javascript
{
  "isValid": false,
  "reason": "token_expired",
  "clearToken": true,
  "message": "Oturum süresi doldu, lütfen tekrar giriş yapın"
}
```

### 6. User Logout

**POST** `/api/v1/auth/logout`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```javascript
{
  "success": true,
  "message": "Logged out successfully"
}
```

### 7. Session Information

**GET** `/api/v1/auth/session`

**Headers:**
```
Authorization: Bearer <access_token>
```

**Response (200):**
```javascript
{
  "success": true,
  "session": {
    "sessionId": "uuid-session-id",
    "userId": "507f1f77bcf86cd799439011",
    "deviceInfo": {
      "platform": "ios",
      "model": "iPhone 13",
      "version": "15.0"
    },
    "loginTime": "2024-01-15T10:30:00.000Z",
    "lastActivity": "2024-01-15T11:45:00.000Z",
    "ipAddress": "192.168.1.100"
  }
}
```

### 8. Email Verification

**Send Verification Email**
**POST** `/api/v1/auth/send-verification-email`

```javascript
{
  "email": "ali@example.com"
}
```

**Verify Email**
**POST** `/api/v1/auth/verify-email`

```javascript
{
  "email": "ali@example.com",
  "code": "123456"
}
```

## 🔐 Security Implementation

### JWT Token Structure

```javascript
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "507f1f77bcf86cd799439011",
    "email": "ali@example.com",
    "status": "user",
    "iat": 1642248600,
    "exp": 1642335000
  }
}
```

### Password Security

- **Hashing**: bcrypt with salt rounds 12
- **Validation**: Min 8 chars, uppercase, lowercase, number
- **Storage**: Never stored in plain text

### Session Security

```javascript
// Session creation with device binding
const session = {
  sessionId: uuid(),
  userId: user._id,
  deviceId: generateDeviceId(deviceInfo),
  platform: deviceInfo.platform,
  deviceModel: deviceInfo.model,
  deviceVersion: deviceInfo.version,
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  loginTime: new Date(),
  lastActivity: new Date(),
  isActive: true
};
```

### Device Management

- **Device Fingerprinting**: Platform + Model + Version
- **Multi-device Support**: Each device gets unique session
- **Device Mismatch Detection**: Validates device info on each request
- **Session Revocation**: Invalid device info revokes session

## 🔄 Event Bus Integration

### Outgoing Events

**None** - Auth service only responds to events, doesn't publish

### Incoming Events

#### 1. `user.auth.getMe`

**Purpose**: Get user details for community creation

**Payload:**
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "User found successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ali",
    "surname": "Koçer",
    "email": "ali@example.com",
    "status": "user"
  }
}
```

#### 2. `user.auth.addCommunityToLeader`

**Purpose**: Add community leadership to user

**Payload:**
```javascript
{
  "communityId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Community leadership added successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "leaderCommunityId": "507f1f77bcf86cd799439012",
    "status": "leader_of_community"
  }
}
```

## 📊 Business Logic

### User Registration Flow

```javascript
async registerUser(userData) {
  // 1. Validate input data
  validateUserData(userData);
  
  // 2. Check for existing email/phone
  await checkExistingUser(userData.email, userData.phone);
  
  // 3. Hash password
  const hashedPassword = await bcrypt.hash(userData.password, 12);
  
  // 4. Create user in database
  const user = await User.create({
    ...userData,
    password: hashedPassword
  });
  
  // 5. Return sanitized user data
  return sanitizeUserData(user);
}
```

### Login Flow

```javascript
async loginUser(credentials, deviceInfo, ipAddress) {
  // 1. Find user by email or phone
  const user = await findUserByCredentials(credentials);
  
  // 2. Validate password
  await validatePassword(credentials.password, user.password);
  
  // 3. Check user status
  validateUserStatus(user);
  
  // 4. Generate JWT token
  const accessToken = generateJWT(user);
  
  // 5. Create session with device info
  const session = await createSession(user._id, deviceInfo, ipAddress);
  
  // 6. Update user login status
  await updateUserLoginStatus(user._id);
  
  return {
    accessToken,
    user: sanitizeUserData(user),
    session
  };
}
```

### Authentication Check Flow

```javascript
async checkAuthStatus(accessToken, deviceInfo, ipAddress) {
  // 1. Validate JWT token structure
  const tokenInfo = validateJWT(accessToken);
  
  // 2. Find user in database
  const user = await User.findById(tokenInfo.userId);
  
  // 3. Validate user status
  validateUserStatus(user);
  
  // 4. Check session validity
  const session = await validateSession(tokenInfo.userId, deviceInfo);
  
  // 5. Update last activity
  await updateSessionActivity(session.sessionId);
  
  return {
    isValid: true,
    userId: user._id,
    sessionId: session.sessionId
  };
}
```

## 🔍 Error Handling

### Common Error Responses

**400 Bad Request:**
```javascript
{
  "success": false,
  "message": "Validation error",
  "error": "Email already exists"
}
```

**401 Unauthorized:**
```javascript
{
  "success": false,
  "message": "Authentication failed",
  "error": "Invalid credentials"
}
```

**403 Forbidden:**
```javascript
{
  "success": false,
  "message": "Access denied",
  "error": "Account not verified"
}
```

**404 Not Found:**
```javascript
{
  "success": false,
  "message": "Resource not found", 
  "error": "User not found"
}
```

**409 Conflict:**
```javascript
{
  "success": false,
  "message": "Resource conflict",
  "error": "Email already exists"
}
```

### Auth Check Error Reasons

- `invalid_token`: Malformed or invalid JWT
- `token_expired`: JWT token has expired
- `user_not_found`: User ID not found in database
- `user_blocked`: User account is blocked
- `user_deleted`: User account is deleted
- `user_not_verified`: Email not verified
- `session_not_found`: Session doesn't exist in Redis
- `session_inactive`: Session marked as inactive
- `activity_timeout`: Session timeout (30 minutes)
- `device_mismatch`: Different device detected
- `invalid_device_info`: Device info missing or invalid

## 🧪 Testing

### Unit Tests

```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests
npm run test:coverage      # Coverage report
```

### Test Categories

1. **User Registration Tests**
   - Valid registration data
   - Duplicate email/phone handling
   - Password validation
   - Input sanitization

2. **Authentication Tests**
   - Valid login credentials
   - Invalid credentials
   - Account status validation
   - Device info validation

3. **Token Management Tests**
   - JWT generation and validation
   - Token refresh mechanics
   - Token expiration handling
   - Token security

4. **Session Management Tests**
   - Session creation and validation
   - Multi-device sessions
   - Session timeout
   - Device mismatch detection

## 🔧 Configuration

### Environment Variables

```env
# Database
MONGODB_URI=mongodb://localhost:27017/topluluk_auth
REDIS_URI=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=24h

# Service Configuration
AUTH_SERVICE_PORT=16040
NODE_ENV=development

# Email Service (Future)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_password

# Security
BCRYPT_ROUNDS=12
SESSION_TIMEOUT=30 # minutes
MAX_LOGIN_ATTEMPTS=5
LOCKOUT_TIME=15 # minutes
```

### Service Dependencies

```javascript
// package.json dependencies
{
  "bcrypt": "^5.1.1",           // Password hashing
  "jsonwebtoken": "^9.0.2",     // JWT tokens
  "mongoose": "^8.12.1",        // MongoDB ODM
  "express": "^4.18.2",         // Web framework
  "cors": "^2.8.5",             // CORS handling
  "helmet": "^7.1.0",           // Security headers
  "express-validator": "^7.0.1", // Input validation
  "winston": "^3.17.0"          // Logging
}
```

## 🚀 Deployment & Monitoring

### Health Check Endpoint

**GET** `/health`

```javascript
{
  "service": "Auth Service",
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "connections": {
    "mongodb": "connected",
    "redis": "connected"
  }
}
```

### Logging Strategy

```javascript
// Successful operations
logger.info('User logged in successfully', {
  userId: user._id,
  deviceInfo: deviceInfo.platform,
  ipAddress,
  requestId
});

// Security events
logger.warn('Failed login attempt', {
  email: credentials.email,
  ipAddress,
  reason: 'invalid_password',
  requestId
});

// System errors
logger.error('Database connection error', {
  error: error.message,
  stack: error.stack,
  requestId
});
```

### Performance Metrics

- **Response Time**: Target < 200ms for auth operations
- **Throughput**: Handle 1000+ requests/minute
- **Availability**: 99.9% uptime target
- **Session Management**: Redis-based for horizontal scaling

## 🔮 Future Enhancements

### Planned Features

1. **Two-Factor Authentication (2FA)**
   - SMS-based verification
   - TOTP authenticator support
   - Backup codes

2. **OAuth Integration**
   - Google OAuth
   - Facebook OAuth
   - Apple Sign-In

3. **Advanced Security**
   - Rate limiting per user
   - Suspicious activity detection
   - Geographic login validation
   - Account lockout mechanisms

4. **Password Management**
   - Password reset via email
   - Password history tracking
   - Password strength requirements
   - Password expiration policies

5. **Audit Logging**
   - Login history tracking
   - Device management logs
   - Permission change logs
   - Security event alerts

This Auth Service provides a robust foundation for user authentication and authorization with modern security practices and scalability considerations. 