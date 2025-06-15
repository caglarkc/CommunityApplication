# 🏗️ Topluluk Backend Architecture Documentation

## 📋 Project Overview

**Topluluk Community App Backend** is a microservices-based Node.js application designed for managing community operations, user authentication, and file handling. The architecture follows domain-driven design principles with event-driven communication between services.

## 🎯 Core Features

- **User Authentication & Authorization** (JWT-based)
- **Community Management** (Creation, Configuration, Member Management)
- **File Upload & Processing** (Images, Documents, Firebase Storage)
- **Event-Driven Communication** (Inter-service messaging)
- **Session Management** (Redis-based)
- **Device Management** (Multi-device support)
- **Real-time Logging** (Winston-based structured logging)

## 🏛️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Applications                     │
│                 (Web, Mobile, Admin Panel)                 │
└─────────────────────────┬───────────────────────────────────┘
                          │
┌─────────────────────────┴───────────────────────────────────┐
│                     API Gateway                            │
│                   (Future Implementation)                  │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
┌────────▼────────┐ ┌─────▼─────┐ ┌───────▼────────┐
│   Auth Service  │ │Community  │ │ Upload Service │
│   Port: 16040   │ │ Service   │ │  Port: 16042   │
│                 │ │Port: 16041│ │                │
└────────┬────────┘ └─────┬─────┘ └───────┬────────┘
         │                │               │
         └────────────────┼───────────────┘
                          │
              ┌───────────▼───────────┐
              │    Event Bus System   │
              │   (Redis Pub/Sub)     │
              └───────────┬───────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
┌───────▼────────┐ ┌──────▼──────┐ ┌────────▼───────┐
│   MongoDB      │ │    Redis    │ │ Firebase       │
│   (Primary DB) │ │  (Sessions, │ │ Storage        │
│                │ │   Cache)    │ │ (Files)        │
└────────────────┘ └─────────────┘ └────────────────┘
```

## 🔧 Technology Stack

### **Backend Framework**
- **Node.js** v18+ (Runtime)
- **Express.js** v4.18 (Web framework)
- **Mongoose** v8.12 (MongoDB ODM)

### **Databases & Storage**
- **MongoDB** (Primary database)
- **Redis** v4.6 (Session store, caching)
- **Firebase Storage** (File storage)

### **Communication & Events**
- **Custom Event Bus** (Redis Pub/Sub based)
- **EventEmitter** (Internal service events)

### **Security & Authentication**
- **JWT** (JSON Web Tokens)
- **bcrypt** (Password hashing)
- **Helmet** (Security headers)
- **CORS** (Cross-origin requests)

### **File Processing**
- **Multer** (File upload handling)
- **Sharp** (Image processing & optimization)
- **Firebase Admin SDK** (Storage management)

### **Development & Monitoring**
- **Winston** (Structured logging)
- **Morgan** (HTTP request logging)
- **Nodemon** (Development server)
- **Jest** (Testing framework)
- **ESLint** (Code linting)

## 🏗️ Project Structure

```
topluluk_backend/
├── docs/                           # Documentation
├── gateway/                        # API Gateway (future)
├── services/                       # Microservices
│   ├── auth-service/              # Authentication service
│   ├── community-create-service/   # Community management
│   └── upload-service/            # File upload service
├── shared/                        # Shared utilities
│   ├── config/                    # Configuration
│   ├── middlewares/               # Common middlewares
│   ├── models/                    # Shared data models
│   ├── services/                  # Shared services
│   └── utils/                     # Utility functions
├── package.json                   # Root package configuration
├── nodemon.json                   # Development configuration
└── README.md                      # Project documentation
```

## 🎛️ Service Architecture

### **1. Auth Service (Port: 16040)**
**Responsibilities:**
- User registration and login
- JWT token generation and validation
- Password management
- Session management
- Device authentication
- Community leader management

**Database Schema:**
- Users collection
- Sessions collection (Redis)
- Device registrations

### **2. Community Create Service (Port: 16041)**
**Responsibilities:**
- Community creation and configuration
- Member management
- Role and permission management
- Community metadata handling
- File URL integration

**Database Schema:**
- Communities collection
- Roles and permissions
- Member relationships

### **3. Upload Service (Port: 16042)**
**Responsibilities:**
- File upload to Firebase Storage
- Image optimization and processing
- File categorization and organization
- URL generation and management
- File deletion and cleanup

**Storage Organization:**
```
Firebase Storage Structure:
/{communityId}/
  ├── president-documents/    # Leader documents
  ├── community-logos/        # Community logos
  ├── cover-photos/          # Cover images
  ├── event-photos/          # Event images
  └── documents/             # General documents
```

## 🔄 Inter-Service Communication

### **Event-Driven Architecture**
Services communicate through a custom event bus system built on Redis Pub/Sub:

```javascript
// Event Publisher (Sender)
await eventPublisher.request('service.action.method', payload, options);

// Event Subscriber (Receiver)  
await eventSubscriber.respondTo('service.action.method', async (payload, metadata) => {
  // Handle request
  return response;
});
```

### **Communication Patterns**

1. **Request-Response**: Synchronous communication with timeout
2. **Fire-and-Forget**: Asynchronous notifications
3. **Event Sourcing**: State change notifications

### **Event Flow Examples**

**Community Creation Flow:**
```
1. Frontend → Community Service (HTTP POST)
2. Community Service → Auth Service (Event: user.auth.getMe)
3. Community Service → Upload Service (Event: upload.uploadSingleFile)
4. Upload Service → Firebase Storage (File upload)
5. Community Service → Database (Save community with URLs)
6. Community Service → Auth Service (Event: user.auth.addCommunityToLeader)
7. Community Service → Frontend (HTTP Response)
```

## 🛡️ Security Implementation

### **Authentication Flow**
```
1. User Login → Auth Service
2. Validate Credentials → Database
3. Generate JWT Token → Token includes: userId, roles, permissions
4. Store Session → Redis
5. Return Token → Frontend
6. Protected Requests → Middleware validates JWT
```

### **Security Middleware Stack**
```javascript
app.use(helmet());                    // Security headers
app.use(cors(corsOptions));          // CORS protection
app.use(rateLimit(rateLimitConfig)); // Rate limiting
app.use(authMiddleware);             // JWT validation
app.use(requestContextMiddleware);   // Request tracking
```

### **Permission System**
```javascript
// Role-based permissions
{
  "leader": {
    "permissions": ["all_access"],
    "canDelete": false,
    "isDefault": true
  },
  "member": {
    "permissions": ["only_read"],
    "canDelete": false,
    "isDefault": true
  }
}
```

## 📊 Database Design

### **MongoDB Collections**

#### **Users Collection (Auth Service)**
```javascript
{
  _id: ObjectId,
  email: String,
  password: String, // bcrypt hashed
  firstName: String,
  lastName: String,
  phoneNumber: String,
  isEmailVerified: Boolean,
  communities: [ObjectId], // Community IDs user belongs to
  devices: [DeviceSchema],
  createdAt: Date,
  updatedAt: Date
}
```

#### **Communities Collection (Community Service)**
```javascript
{
  _id: ObjectId,
  name: String,
  description: String,
  universityName: String,
  universityDepartment: String,
  leaderId: ObjectId,
  membersIds: [ObjectId],
  presidentDocumentUrl: String,
  logoUrl: String,
  coverPhotoUrl: String,
  roles: Map, // Role definitions
  rolePermissions: Map, // Permission definitions
  createdAt: Date,
  updatedAt: Date
}
```

### **Redis Data Structures**

#### **Session Management**
```
Key: session:{sessionId}
Value: {
  userId: ObjectId,
  deviceId: String,
  ipAddress: String,
  userAgent: String,
  loginTime: Date,
  lastActivity: Date
}
TTL: 24 hours
```

#### **Event Bus Messaging**
```
Channel: {serviceName}.{action}.{method}
Message: {
  eventId: UUID,
  timestamp: ISO8601,
  sourceService: String,
  correlationId: UUID,
  payload: Object,
  replyTo: String
}
```

## 🔍 Monitoring & Logging

### **Logging Strategy**
```javascript
// Structured logging with Winston
logger.info('Operation completed', {
  userId: 'user123',
  operation: 'community_creation',
  duration: '1.2s',
  status: 'success'
});
```

### **Log Levels**
- **Error**: System errors, exceptions
- **Warn**: Business logic warnings
- **Info**: Business operations, successful actions
- **Debug**: Development information

### **Request Tracing**
Each request gets a unique `requestId` for full traceability across services.

## 🚀 Deployment Architecture

### **Development Environment**
```bash
# Start all services in development
npm run dev:microservices

# Individual service management
npm run dev:auth          # Auth service only
npm run dev:community     # Community service only
npm run dev:upload        # Upload service only
```

### **Production Considerations**
- **Load Balancing**: Nginx reverse proxy
- **Process Management**: PM2 cluster mode
- **Database**: MongoDB replica set
- **Caching**: Redis cluster
- **Storage**: Firebase Storage with CDN
- **Monitoring**: Application metrics and health checks

## 📈 Scalability Design

### **Horizontal Scaling**
- Each service can be scaled independently
- Stateless service design
- Session data stored in Redis
- File storage in Firebase (managed service)

### **Performance Optimizations**
- **Image Processing**: Sharp-based optimization
- **Caching**: Redis for session and temporary data
- **Database**: Mongoose with connection pooling
- **File Upload**: Direct Firebase upload with signed URLs

## 🔧 Configuration Management

### **Environment Variables**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/topluluk_db
REDIS_URI=redis://localhost:6379

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=24h

# Firebase
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_PRIVATE_KEY_ID=your_key_id

# Service Ports
AUTH_SERVICE_PORT=16040
COMMUNITY_SERVICE_PORT=16041
UPLOAD_SERVICE_PORT=16042
```

### **Service Configuration**
Each service has its own configuration structure with defaults and environment overrides.

## 🧪 Testing Strategy

### **Unit Tests**
- Service layer business logic
- Utility function validation
- Model validation

### **Integration Tests**
- API endpoint testing
- Database operations
- Event bus communication

### **End-to-End Tests**
- Complete user flows
- Multi-service operations
- File upload scenarios

## 🔮 Future Enhancements

### **Planned Features**
1. **API Gateway**: Centralized routing and load balancing
2. **Message Queue**: RabbitMQ for heavy operations
3. **Notification Service**: Email, SMS, push notifications
4. **Analytics Service**: User behavior and metrics
5. **Content Moderation**: Automated content filtering
6. **Search Service**: Elasticsearch integration
7. **Real-time Features**: WebSocket support

### **Technical Improvements**
1. **Docker Containerization**: Full Docker setup
2. **Kubernetes Deployment**: Container orchestration
3. **Database Sharding**: Horizontal database scaling
4. **CDN Integration**: Content delivery optimization
5. **Backup Automation**: Automated database backups
6. **Health Monitoring**: Advanced service monitoring
7. **Circuit Breakers**: Fault tolerance patterns

## 📋 Development Guidelines

### **Code Standards**
- ES6+ JavaScript features
- Async/await for asynchronous operations
- Error handling with try-catch blocks
- Consistent naming conventions
- JSDoc documentation for functions

### **Git Workflow**
- Feature branches for new development
- Pull request reviews
- Semantic commit messages
- Automated testing on PR

### **Best Practices**
- Input validation on all endpoints
- Proper error handling and logging
- Security middleware on all routes
- Database transaction usage where appropriate
- Resource cleanup and connection management

This architecture provides a solid foundation for the Topluluk Community App with room for growth and scalability as the application evolves. 