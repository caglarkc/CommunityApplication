# 📁 UPLOAD API DOCUMENTATION

## 🚀 **Genel Bakış**

Bu API, topluluk uygulaması için dosya yükleme işlemlerini yönetir. Firebase Storage kullanarak güvenli ve optimize edilmiş dosya yükleme sağlar.

**Base URL:** `http://localhost:3003/api/v1/upload`

---

## 🔒 **Authentication**

Tüm upload endpoint'leri JWT authentication ve device info gerektirir:

### **Headers:**
```javascript
{
  "Authorization": "Bearer YOUR_JWT_TOKEN",
  "Content-Type": "multipart/form-data"
}
```

### **Body (Device Info - ZORUNLU):**
```javascript
// FormData'ya device info eklemek için:
formData.append('deviceInfo', JSON.stringify({
  platform: "Android",
  model: "Samsung Galaxy S21", 
  version: "12.0"
}));

// VEYA request body'de:
{
  "deviceInfo": {
    "platform": "Android",
    "model": "Samsung Galaxy S21",
    "version": "12.0"
  }
}
```

---

## 📏 **Dosya Limitleri**

| Özellik | Limit |
|---------|-------|
| **Maksimum Dosya Boyutu** | 10MB |
| **Maksimum Dosya Sayısı** | 10 (event photos) |
| **Desteklenen Resim Formatları** | JPEG, JPG, PNG, WebP |
| **Desteklenen Belge Formatları** | PDF, JPEG, JPG, PNG |

---

## 🎯 **API Endpoints**

### **1. Etkinlik Fotoğrafları Yükleme**
**Çoklu fotoğraf yükleme (max 10)**

```http
POST /api/v1/upload/community/{communityId}/event-photos
```

**Request:**
```javascript
// FormData kullanımı
const formData = new FormData();
formData.append('photos', file1);
formData.append('photos', file2);
formData.append('photos', file3);

// ⚠️ ZORUNLU: Device info ekle
formData.append('deviceInfo', JSON.stringify({
  platform: "Android",
  model: "Samsung Galaxy S21",
  version: "12.0"
}));

fetch('/api/v1/upload/community/123/event-photos', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

**Response (200):**
```json
{
  "success": true,
  "message": "3 fotoğraf başarıyla yüklendi",
  "data": {
    "images": [
      {
        "url": "https://storage.googleapis.com/bucket/community-events/123/1234567890_uuid.jpg",
        "fileName": "community-events/123/1234567890_uuid.jpg",
        "size": 245760,
        "category": "community-events",
        "communityId": "123"
      }
    ],
    "count": 3
  }
}
```

---

### **2. Banner Fotoğrafı Yükleme**
**Ana ekran banner'ı (tek dosya)**

```http
POST /api/v1/upload/community/{communityId}/banner-photo
```

**Request:**
```javascript
const formData = new FormData();
formData.append('banner', bannerFile);

fetch('/api/v1/upload/community/123/banner-photo', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

**Response (200):**
```json
{
  "success": true,
  "message": "Banner fotoğrafı başarıyla yüklendi",
  "data": {
    "url": "https://storage.googleapis.com/bucket/community-banners/123/1234567890_uuid.jpg",
    "fileName": "community-banners/123/1234567890_uuid.jpg",
    "size": 512000,
    "optimized": {
      "width": 1200,
      "height": 600,
      "format": "jpeg",
      "quality": 85
    }
  }
}
```

---

### **3. Logo Yükleme**
**Topluluk logosu (kare format önerilir)**

```http
POST /api/v1/upload/community/{communityId}/logo
```

**Request:**
```javascript
const formData = new FormData();
formData.append('logo', logoFile);

fetch('/api/v1/upload/community/123/logo', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

**Response (200):**
```json
{
  "success": true,
  "message": "Logo başarıyla yüklendi",
  "data": {
    "url": "https://storage.googleapis.com/bucket/community-logos/123/1234567890_uuid.png",
    "fileName": "community-logos/123/1234567890_uuid.png",
    "size": 89600,
    "optimized": {
      "width": 400,
      "height": 400,
      "format": "png",
      "quality": 90
    }
  }
}
```

---

### **4. Lider Belgesi Yükleme**
**Topluluk lideri belgeleri (PDF veya resim)**

```http
POST /api/v1/upload/community/{communityId}/leader-document
```

**Request:**
```javascript
const formData = new FormData();
formData.append('document', documentFile);
formData.append('documentType', 'identity_card');

fetch('/api/v1/upload/community/123/leader-document', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ' + token
  },
  body: formData
});
```

**Document Types:**
- `identity_card` - Kimlik kartı
- `address_document` - Adres belgesi
- `authorization` - Yetki belgesi
- `other` - Diğer

**Response (200):**
```json
{
  "success": true,
  "message": "Belge başarıyla yüklendi",
  "data": {
    "url": "https://storage.googleapis.com/bucket/community-documents/123/1234567890_uuid.pdf",
    "fileName": "community-documents/123/1234567890_uuid.pdf",
    "size": 1024000,
    "documentType": "identity_card",
    "verified": false
  }
}
```

---

### **5. Dosya Silme**
**Topluluk dosyası silme**

```http
DELETE /api/v1/upload/community/{communityId}/files/{fileName}
```

**Request:**
```javascript
fetch('/api/v1/upload/community/123/files/community-logos%2F123%2F1234567890_uuid.png', {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

**Response (200):**
```json
{
  "success": true,
  "message": "Dosya başarıyla silindi"
}
```

---

### **6. Dosya Listesi**
**Topluluk dosyalarını listeleme**

```http
GET /api/v1/upload/community/{communityId}/files
```

**Query Parameters:**
- `category` (optional): `event-photos`, `banners`, `logos`, `documents`
- `limit` (optional): Sayfa başına kayıt (default: 20)
- `page` (optional): Sayfa numarası (default: 1)

**Request:**
```javascript
fetch('/api/v1/upload/community/123/files?category=event-photos&limit=10&page=1', {
  method: 'GET',
  headers: {
    'Authorization': 'Bearer ' + token
  }
});
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "url": "https://storage.googleapis.com/bucket/community-events/123/1234567890_uuid.jpg",
        "fileName": "community-events/123/1234567890_uuid.jpg",
        "size": 245760,
        "category": "community-events",
        "uploadedAt": "2024-06-11T07:43:19.000Z",
        "uploadedBy": "userId123"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalFiles": 25,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

---

## 🎨 **Resim Optimizasyonu**

API otomatik olarak resimleri optimize eder:

| Kategori | Boyut | Format | Kalite |
|----------|-------|--------|--------|
| **Logo** | 400x400px | PNG | %90 |
| **Banner** | 1200x600px | JPEG | %85 |
| **Etkinlik** | 1200x1200px | JPEG | %80 |

---

## ❌ **Error Responses**

### **Validation Errors (400):**
```json
{
  "success": false,
  "status": 400,
  "message": "Dosya seçilmedi",
  "type": "ValidationError",
  "timestamp": "2024-06-11T07:43:19.872Z"
}
```

### **Authentication Errors (401):**
```json
{
  "success": false,
  "status": 401,
  "message": "Token geçersiz",
  "type": "AuthenticationError",
  "timestamp": "2024-06-11T07:43:19.872Z"
}
```

### **File Size Error (413):**
```json
{
  "success": false,
  "status": 413,
  "message": "Dosya boyutu 10MB'dan büyük olamaz",
  "type": "FileSizeError",
  "timestamp": "2024-06-11T07:43:19.872Z"
}
```

---

## 📱 **Frontend Integration Examples**

### **React/JavaScript:**

```javascript
// Upload Component
import React, { useState } from 'react';

const UploadComponent = ({ communityId, token }) => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);

  const handleFileSelect = (event) => {
    setFiles(Array.from(event.target.files));
  };

  const uploadEventPhotos = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    
    files.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const response = await fetch(`/api/v1/upload/community/${communityId}/event-photos`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('Upload successful:', result.data);
        // Handle success
      } else {
        console.error('Upload failed:', result.message);
        // Handle error
      }
    } catch (error) {
      console.error('Network error:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        multiple 
        accept="image/*" 
        onChange={handleFileSelect}
        disabled={uploading}
      />
      <button 
        onClick={uploadEventPhotos}
        disabled={uploading || files.length === 0}
      >
        {uploading ? 'Yükleniyor...' : 'Fotoğrafları Yükle'}
      </button>
    </div>
  );
};

export default UploadComponent;
```

### **Flutter/Dart:**

```dart
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';

class UploadService {
  final String baseUrl = 'http://localhost:3003/api/v1/upload';
  final String token;

  UploadService(this.token);

  Future<Map<String, dynamic>> uploadEventPhotos(
    String communityId, 
    List<File> photos
  ) async {
    try {
      var uri = Uri.parse('$baseUrl/community/$communityId/event-photos');
      var request = http.MultipartRequest('POST', uri);
      
      // Add authorization header
      request.headers['Authorization'] = 'Bearer $token';
      
      // Add files
      for (var photo in photos) {
        var multipartFile = await http.MultipartFile.fromPath(
          'photos',
          photo.path,
          contentType: MediaType('image', 'jpeg'),
        );
        request.files.add(multipartFile);
      }
      
      var response = await request.send();
      var responseBody = await response.stream.bytesToString();
      
      if (response.statusCode == 200) {
        return json.decode(responseBody);
      } else {
        throw Exception('Upload failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }

  Future<Map<String, dynamic>> uploadBanner(
    String communityId, 
    File bannerFile
  ) async {
    try {
      var uri = Uri.parse('$baseUrl/community/$communityId/banner-photo');
      var request = http.MultipartRequest('POST', uri);
      
      request.headers['Authorization'] = 'Bearer $token';
      
      var multipartFile = await http.MultipartFile.fromPath(
        'banner',
        bannerFile.path,
        contentType: MediaType('image', 'jpeg'),
      );
      request.files.add(multipartFile);
      
      var response = await request.send();
      var responseBody = await response.stream.bytesToString();
      
      if (response.statusCode == 200) {
        return json.decode(responseBody);
      } else {
        throw Exception('Upload failed: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('Network error: $e');
    }
  }
}
```

---

## 🔧 **Best Practices**

### **1. File Validation (Frontend):**
```javascript
const validateFile = (file) => {
  // Size check
  if (file.size > 10 * 1024 * 1024) {
    throw new Error('Dosya boyutu 10MB\'dan büyük olamaz');
  }
  
  // Type check
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('Desteklenmeyen dosya türü');
  }
  
  return true;
};
```

### **2. Progress Tracking:**
```javascript
const uploadWithProgress = (formData, onProgress) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const percentComplete = (e.loaded / e.total) * 100;
        onProgress(percentComplete);
      }
    });
    
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error(`Upload failed: ${xhr.status}`));
      }
    });
    
    xhr.open('POST', '/api/v1/upload/community/123/event-photos');
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.send(formData);
  });
};
```

### **3. Error Handling:**
```javascript
const handleUploadError = (error) => {
  if (error.status === 413) {
    return 'Dosya boyutu çok büyük';
  } else if (error.status === 401) {
    return 'Oturum süresi dolmuş, lütfen tekrar giriş yapın';
  } else if (error.status === 400) {
    return error.message || 'Dosya formatı desteklenmiyor';
  } else {
    return 'Yükleme sırasında bir hata oluştu';
  }
};
```

---

## 📞 **Support**

API ile ilgili sorularınız için:
- **Endpoint Issues**: Backend team
- **Authentication**: Auth service team  
- **File Storage**: Firebase configuration team

---

*Bu dokümantasyon topluluk uygulaması upload API v1.0 için hazırlanmıştır.* 