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

## 🛣️ API Endpoints

### 1. Create Community with Files

**POST** `/api/v1/community-create/create`

**Content-Type**: `multipart/form-data`

**Required Fields:**
```javascript
{
  "name": "Yazılım Topluluğu",              // 3-100 chars
  "description": "Yazılım geliştirme...",   // 10-500 chars
  "universityName": "İstanbul Teknik Üniversitesi", // 3-100 chars
  "universityDepartment": "Bilgisayar Mühendisliği", // 3-100 chars
  "leaderId": "507f1f77bcf86cd799439011",    // Valid ObjectId
  "presidentDocument": File,                 // PDF, JPG, PNG - Max 10MB
  "communityLogo": File,                     // JPG, PNG, WebP - Max 10MB
  "coverPhoto": File                         // Optional - JPG, PNG, WebP
}
```

This service provides comprehensive community management with robust file handling capabilities. 