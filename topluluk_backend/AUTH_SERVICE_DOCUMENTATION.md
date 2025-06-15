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

This Auth Service provides a robust foundation for user authentication and authorization with modern security practices and scalability considerations. 