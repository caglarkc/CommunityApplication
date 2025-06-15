# 🏘️ Community Create Service Documentation

## 📋 Service Overview

**Community Create Service** is responsible for creating and managing communities within the Topluluk app. It handles community creation with file uploads, role management, permission systems, and integration with other services.

**Port**: `16041`  
**Base URL**: `http://localhost:16041`

## 🎯 Core Responsibilities

- **Community Creation & Configuration**
- **File Upload Integration** (Documents, Logos, Cover Photos)
- **Role & Permission Management**
- **Community Metadata Handling**
- **Leader Assignment**
- **Member Management Foundation**
- **Database Relationship Management**

## 🏗️ Service Architecture

```
┌─────────────────────────────────────────┐
│              Frontend                   │
│          (Form with Files)              │
└──────────────┬──────────────────────────┘
               │ Multipart/Form-Data
┌──────────────▼──────────────────────────┐
│      Community Create Controller        │
│   • Multer File Processing              │
│   • Input Validation                    │
│   • File Type Checking                  │
└──────────────┬──────────────────────────┘
               │
┌──────────────▼──────────────────────────┐
│      Community Create Service           │
│   • Business Logic                      │
│   • File Upload Orchestration           │
│   • Database Operations                 │
└─────┬──────────┬─────────────────────────┘
      │          │
      │          └──────────────────┐
      │                             │
┌─────▼─────┐              ┌───────▼────────┐
│ MongoDB   │              │ Upload Service │
│Communities│              │  (Event Bus)   │
│Collection │              │   Firebase     │
└───────────┘              └────────────────┘
```

## 🗂️ Directory Structure

```
services/community-create-service/
├── src/
│   ├── controllers/              # HTTP request handlers
│   │   └── community-create.controller.js
│   ├── services/                 # Business logic
│   │   └── community-create.service.js
│   ├── models/                   # Database models
│   │   └── community.model.js
│   ├── routes/                   # API routes
│   │   └── community-create.route.js
│   ├── utils/                    # Utility functions
│   │   ├── database.js
│   │   └── validationUtils.js
│   ├── config/                   # Service configuration
│   └── index.js                  # Service entry point
├── package.json                  # Dependencies
├── nodemon.json                  # Development config
└── logs/                         # Service logs
```

## 📊 Database Schema

### Community Model (`community.model.js`)

```javascript
{
  // Basic Information
  name: String,                     // Required, community name
  description: String,              // Required, community description
  universityName: String,           // Required, university affiliation
  universityDepartment: String,     // Required, department

  // Leadership
  leaderId: ObjectId,               // Required, reference to User
  membersIds: [ObjectId],           // Array of member User IDs

  // File URLs (from Upload Service)
  presidentDocumentUrl: String,     // President/Leader document
  logoUrl: String,                  // Community logo
  coverPhotoUrl: String,            // Cover photo (optional)

  // Role System
  roles: Map,                       // Role definitions
  rolePermissions: Map,             // Permission definitions

  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Default Role System

```javascript
// Default roles created for each community
{
  "leader": {
    permissions: ["all_access"],
    canDelete: false,
    isDefault: true
  },
  "member": {
    permissions: ["only_read"],
    canDelete: false,
    isDefault: true
  }
}

// Default permissions
{
  "all_access": {
    description: "Toplulukta tüm yetkiler (Sadece Leader)",
    category: "community_settings",
    isDefault: true
  },
  "only_read": {
    description: "Sadece okuma yetkisi",
    category: "content_management",
    isDefault: true
  }
}
```

## 🛣️ API Endpoints

### 1. Create Community with Files

**POST** `/api/v1/community-create/create`

**Content-Type**: `multipart/form-data`

**Form Fields:**

**Required Text Fields:**
```javascript
{
  "name": "Yazılım Topluluğu",              // 3-100 chars
  "description": "Yazılım geliştirme...",   // 10-500 chars
  "universityName": "İstanbul Teknik Üniversitesi", // 3-100 chars
  "universityDepartment": "Bilgisayar Mühendisliği", // 3-100 chars
  "leaderId": "507f1f77bcf86cd799439011"    // Valid ObjectId
}
```

**Required File Fields:**
```javascript
{
  "presidentDocument": File,  // PDF, JPG, PNG - Max 10MB (Leader document)
  "communityLogo": File,      // JPG, PNG, WebP - Max 10MB (Community logo)
}
```

**Optional File Fields:**
```javascript
{
  "coverPhoto": File,         // JPG, PNG, WebP - Max 10MB (Cover photo)
}
```

**File Upload Process:**
1. **Multer Processing**: Files processed in memory
2. **Validation**: File type and size validation
3. **Event Publishing**: Files sent to Upload Service via Event Bus
4. **Firebase Storage**: Upload Service saves to Firebase
5. **URL Generation**: Signed URLs generated for files
6. **Database Update**: Community record updated with file URLs

**Response (201):**
```javascript
{
  "success": true,
  "message": "Topluluk ve tüm dosyalar başarıyla oluşturuldu",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Yazılım Topluluğu",
    "description": "Yazılım geliştirme odaklı topluluk",
    "universityName": "İstanbul Teknik Üniversitesi",
    "universityDepartment": "Bilgisayar Mühendisliği",
    "leaderId": "507f1f77bcf86cd799439012",
    
    // File URLs from Firebase Storage
    "presidentDocumentUrl": "https://firebase-storage-url/president-doc.pdf",
    "logoUrl": "https://firebase-storage-url/logo.png",
    "coverPhotoUrl": "https://firebase-storage-url/cover.jpg",
    
    "membersIds": ["507f1f77bcf86cd799439012"],
    "roles": {
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
    },
    "rolePermissions": {
      "all_access": {
        "description": "Toplulukta tüm yetkiler (Sadece Leader)",
        "category": "community_settings",
        "isDefault": true
      },
      "only_read": {
        "description": "Sadece okuma yetkisi",
        "category": "content_management",
        "isDefault": true
      }
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses:**

**400 Bad Request - Missing Fields:**
```javascript
{
  "success": false,
  "message": "Eksik gerekli alanlar (name, leaderId, universityName, universityDepartment, description)"
}
```

**400 Bad Request - Missing Files:**
```javascript
{
  "success": false,
  "message": "Başkan belgesi ve topluluk logosu zorunludur"
}
```

**400 Bad Request - Invalid File Type:**
```javascript
{
  "success": false,
  "message": "presidentDocument for unsupported file type: text/plain"
}
```

**413 Payload Too Large:**
```javascript
{
  "success": false,
  "message": "Dosya boyutu çok büyük (max 10MB)",
  "error": "FileTooLarge"
}
```

## 🔄 Event Bus Integration

### Outgoing Events

#### 1. To Auth Service: `user.auth.getMe`

**Purpose**: Validate leader before community creation

**Payload:**
```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Expected Response:**
```javascript
{
  "success": true,
  "message": "User found successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "name": "Ali",
    "surname": "Koçer",
    "email": "ali@example.com"
  }
}
```

#### 2. To Upload Service: `upload.uploadSingleFile`

**Purpose**: Upload community files to Firebase Storage

**Payload:**
```javascript
{
  "uploaderId": "507f1f77bcf86cd799439011",
  "communityId": "507f1f77bcf86cd799439012",
  "file": {
    "originalname": "logo.png",
    "mimetype": "image/png",
    "size": 140600,
    "buffer": Buffer // File content
  },
  "category": "community-logos" // or "president-documents", "cover-photos"
}
```

**Expected Response:**
```javascript
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileName": "507f1f77bcf86cd799439012/community-logos/abc123def456.png",
    "originalName": "logo.png",
    "url": "https://firebase-storage-url/signed-url",
    "size": 140600,
    "mimeType": "image/png",
    "uploaderId": "507f1f77bcf86cd799439011",
    "communityId": "507f1f77bcf86cd799439012",
    "category": "community-logos",
    "uploadedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

#### 3. To Auth Service: `user.auth.addCommunityToLeader`

**Purpose**: Add community leadership to user profile

**Payload:**
```javascript
{
  "communityId": "507f1f77bcf86cd799439012",
  "userId": "507f1f77bcf86cd799439011",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

### Incoming Events

#### 1. `community.create.getCommunity`

**Purpose**: Get community details for other services

**Payload:**
```javascript
{
  "communityId": "507f1f77bcf86cd799439012"
}
```

**Response:**
```javascript
{
  "success": true,
  "message": "Topluluk başarıyla alındı",
  "community": {
    "_id": "507f1f77bcf86cd799439012",
    "name": "Yazılım Topluluğu",
    "leaderId": "507f1f77bcf86cd799439011",
    // ... other community data
  }
}
```

## 🔍 Business Logic Flow

### Community Creation Process

```javascript
async createCommunity(communityData, files) {
  // 1. Validate input data
  validateCommunityData(communityData);
  
  // 2. Validate required files
  validateRequiredFiles(files);
  
  // 3. Verify leader exists (Auth Service)
  const leader = await getLeaderFromAuth(communityData.leaderId);
  
  // 4. Create community in database
  const community = await Community.create(communityData);
  
  // 5. Upload files in parallel (Upload Service)
  const uploadPromises = [
    uploadFile(files.presidentDocument, 'president-documents'),
    uploadFile(files.communityLogo, 'community-logos'),
    uploadFile(files.coverPhoto, 'cover-photos') // if exists
  ];
  
  const uploadResults = await Promise.allSettled(uploadPromises);
  
  // 6. Update community with file URLs
  await Community.findByIdAndUpdate(community._id, {
    presidentDocumentUrl: uploadResults[0]?.data?.url,
    logoUrl: uploadResults[1]?.data?.url,
    coverPhotoUrl: uploadResults[2]?.data?.url
  });
  
  // 7. Add community to leader profile (Auth Service)
  await addCommunityToLeader(community._id, communityData.leaderId);
  
  // 8. Return updated community
  return await Community.findById(community._id);
}
```

### File Upload Categories

```javascript
// File storage organization
const FILE_CATEGORIES = {
  PRESIDENT_DOCUMENTS: 'president-documents',  // Leader verification docs
  COMMUNITY_LOGOS: 'community-logos',          // Community branding
  COVER_PHOTOS: 'cover-photos',                // Community cover images
  EVENT_PHOTOS: 'event-photos',                // Future: Event images
  DOCUMENTS: 'documents'                       // Future: General documents
};
```

### Validation Rules

```javascript
// Text field validation
const VALIDATION_RULES = {
  name: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  description: {
    minLength: 10,
    maxLength: 500,
    required: true
  },
  universityName: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  universityDepartment: {
    minLength: 3,
    maxLength: 100,
    required: true
  },
  leaderId: {
    type: 'ObjectId',
    required: true
  }
};

// File validation
const FILE_VALIDATION = {
  presidentDocument: {
    required: true,
    allowedTypes: ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
    maxSize: '10MB'
  },
  communityLogo: {
    required: true,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: '10MB'
  },
  coverPhoto: {
    required: false,
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxSize: '10MB'
  }
};
```

## 🔧 File Processing Pipeline

### Multer Configuration

```javascript
const multer = require('multer');

const upload = multer({
  storage: multer.memoryStorage(),  // Store in memory for event bus
  limits: {
    fileSize: 10 * 1024 * 1024,    // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = {
      'presidentDocument': ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
      'communityLogo': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
      'coverPhoto': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    };

    const fieldAllowedTypes = allowedTypes[file.fieldname];
    if (fieldAllowedTypes && fieldAllowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`${file.fieldname} for unsupported file type: ${file.mimetype}`), false);
    }
  }
});
```

### File Upload Orchestration

```javascript
// Parallel file upload with error handling
async uploadCommunityFiles(communityId, leaderId, files) {
  const uploadPromises = [];
  
  // Required files
  if (files.presidentDocument) {
    uploadPromises.push(
      uploadFileToService(files.presidentDocument[0], 'president-documents')
    );
  }
  
  if (files.communityLogo) {
    uploadPromises.push(
      uploadFileToService(files.communityLogo[0], 'community-logos')
    );
  }
  
  // Optional files
  if (files.coverPhoto) {
    uploadPromises.push(
      uploadFileToService(files.coverPhoto[0], 'cover-photos')
    );
  }
  
  // Wait for all uploads (with error handling)
  const results = await Promise.allSettled(uploadPromises);
  
  return processUploadResults(results);
}
```

## 🔍 Error Handling & Recovery

### Upload Failure Scenarios

```javascript
// Partial upload failure handling
if (failedUploads.length > 0) {
  logger.warn('Some files failed to upload', { 
    failedUploads,
    communityId,
    leaderId 
  });
  
  // Adjust success message based on upload status
  const message = getUploadStatusMessage(failedUploads);
  
  // Community still created, but with missing file URLs
  return handleSuccess(community, message);
}
```

### Error Recovery Strategies

1. **Partial Success**: Community created even if some files fail
2. **Retry Logic**: Failed uploads can be retried via admin interface
3. **File Re-upload**: Missing files can be uploaded later
4. **Graceful Degradation**: Community functions without all files

## 🧪 Testing Scenarios

### Positive Test Cases

1. **Complete Upload**: All files uploaded successfully
2. **Partial Upload**: Community created with missing optional files
3. **Different File Formats**: PDF president doc, PNG logo
4. **Large Files**: 9MB file uploads

### Negative Test Cases

1. **Missing Required Fields**: Name, description, etc.
2. **Missing Required Files**: No president document or logo
3. **Invalid File Types**: TXT file upload attempts
4. **Oversized Files**: 11MB file uploads
5. **Invalid Leader ID**: Non-existent user ID
6. **Network Failures**: Upload service unavailable

## 🔧 Configuration

### Environment Variables

```env
# Service Configuration
COMMUNITY_SERVICE_PORT=16041
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/topluluk_communities

# File Upload
MAX_FILE_SIZE=10485760          # 10MB in bytes
ALLOWED_FILE_TYPES=pdf,jpg,jpeg,png,webp

# Event Bus
EVENT_TIMEOUT=30000             # 30 seconds for file uploads
AUTH_SERVICE_TIMEOUT=10000      # 10 seconds for auth calls
```

### Service Dependencies

```javascript
// package.json key dependencies
{
  "express": "^4.18.2",         // Web framework
  "multer": "^2.0.1",           // File upload handling
  "mongoose": "^8.12.1",        // MongoDB ODM
  "joi": "^17.12.2",            // Input validation
  "sharp": "^0.34.2",           // Image processing (shared)
  "winston": "^3.17.0"          // Logging
}
```

## 🚀 Performance Considerations

### File Upload Optimization

- **Parallel Processing**: Files uploaded simultaneously
- **Memory Management**: Multer memory storage for event bus compatibility
- **Error Handling**: Graceful failure handling for individual files
- **Timeout Management**: Appropriate timeouts for large file uploads

### Database Optimization

- **Indexes**: Created on leaderId, universityName for queries
- **Connection Pooling**: Mongoose connection pooling enabled
- **Validation**: Input validation before database operations

## 🔮 Future Enhancements

### Planned Features

1. **Community Templates**: Pre-defined community structures
2. **Bulk Member Import**: CSV-based member addition
3. **Advanced Permissions**: Fine-grained permission system
4. **Community Analytics**: Usage and engagement metrics
5. **File Versioning**: Version control for uploaded documents
6. **Community Categories**: Categorization system for communities

### Technical Improvements

1. **File Compression**: Automatic image compression before upload
2. **CDN Integration**: Content delivery network for faster file access
3. **Webhook Support**: Real-time notifications for community events
4. **Audit Logging**: Detailed activity logs for community operations
5. **Backup Integration**: Automated backup for community data

This Community Create Service provides a comprehensive foundation for community management with robust file handling and integration capabilities. 