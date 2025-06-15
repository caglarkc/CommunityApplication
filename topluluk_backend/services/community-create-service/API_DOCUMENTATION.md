# 📋 Community Create Service - Frontend API Dokümantasyonu

## 🚀 Genel Bilgiler

**Base URL:** `http://localhost:16041`  
**Service:** Community Create Service  
**API Version:** v1  

---

## 🏗️ Topluluk Oluşturma Endpoint'i

### **POST** `/api/v1/community-create/create`

Yeni bir topluluk oluşturmak için kullanılır.

---

## 📤 Request Format

### **Headers**
```http
Content-Type: application/json
```

### **Request Body**
```json
{
  "name": "string",
  "description": "string", 
  "universityName": "string",
  "universityDepartment": "string",
  "leaderId": "string (ObjectId)"
}
```

### **Örnek Request**
```javascript
// JavaScript Fetch API
const createCommunity = async (communityData) => {
  try {
    const response = await fetch('http://localhost:16041/api/v1/community-create/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: "Bilgisayar Mühendisliği Topluluğu",
        description: "Teknoloji ve yazılım geliştirme odaklı topluluk",
        universityName: "İstanbul Teknik Üniversitesi",
        universityDepartment: "Bilgisayar Mühendisliği",
        leaderId: "674d2a8e123456789abcdef0"
      })
    });

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Community creation error:', error);
  }
};
```

---

## ✅ Validasyon Kuralları

### **1. name (Topluluk Adı)**
- ✅ **Zorunlu alan**
- ✅ **Tip:** String
- ✅ **Min. uzunluk:** 2 karakter
- ✅ **Max. uzunluk:** 100 karakter
- ❌ **Geçersiz karakterler:** Özel karakterler (sadece harf, rakam, boşluk)

### **2. description (Açıklama)**
- ✅ **Zorunlu alan**
- ✅ **Tip:** String  
- ✅ **Min. uzunluk:** 10 karakter
- ✅ **Max. uzunluk:** 500 karakter

### **3. universityName (Üniversite Adı)**
- ✅ **Zorunlu alan**
- ✅ **Tip:** String
- ✅ **Min. uzunluk:** 5 karakter
- ✅ **Max. uzunluk:** 200 karakter

### **4. universityDepartment (Bölüm)**
- ✅ **Zorunlu alan**
- ✅ **Tip:** String
- ✅ **Min. uzunluk:** 3 karakter
- ✅ **Max. uzunluk:** 100 karakter

### **5. leaderId (Lider ID)**
- ✅ **Zorunlu alan**
- ✅ **Tip:** String (MongoDB ObjectId)
- ✅ **Format:** 24 karakter hexadecimal
- ✅ **Kontrol:** Auth service'den kullanıcı doğrulaması

---

## 📥 Response Format

### **✅ Başarılı Response (201 Created)**
```json
{
  "success": true,
  "message": "Topluluk başarıyla oluşturuldu",
  "data": {
    "_id": "674d2a8f123456789abcdef1",
    "name": "Bilgisayar Mühendisliği Topluluğu",
    "description": "Teknoloji ve yazılım geliştirme odaklı topluluk",
    "universityName": "İstanbul Teknik Üniversitesi", 
    "universityDepartment": "Bilgisayar Mühendisliği",
    "leaderId": "674d2a8e123456789abcdef0",
    "membersIds": [],
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
        "isDefault": true
      },
      "only_read": {
        "description": "Sadece okuma yetkisi", 
        "isDefault": true
      }
    },
    "createdAt": "2024-06-14T10:15:30.000Z",
    "updatedAt": "2024-06-14T10:15:30.000Z"
  }
}
```

---

## ❌ Error Responses

### **400 Bad Request - Eksik Alan**
```json
{
  "success": false, 
  "message": "Missing required fields",
  "error": "ValidationError"
}
```

### **400 Bad Request - Validasyon Hatası**
```json
{
  "success": false,
  "message": "İsim çok kısa olmamalı (min: 2 karakter)",
  "error": "ValidationError",
  "data": {
    "field": "name",
    "receivedValue": "A",
    "expectedFormat": "2-100 karakter arası"
  }
}
```

### **404 Not Found - Kullanıcı Bulunamadı**
```json
{
  "success": false,
  "message": "Kullanıcı detayları alınamadı",
  "error": "NotFoundError", 
  "data": {
    "id": "674d2a8e123456789abcdef0",
    "timestamp": "2024-06-14T10:15:30.000Z"
  }
}
```

### **500 Internal Server Error**
```json
{
  "success": false,
  "message": "Topluluk oluşturma sırasında hata oluştu",
  "error": "InternalServerError"
}
```

---

## 🔄 İşlem Akışı

```
Frontend Request → Validasyon Kontrol → Auth Service User Kontrol → MongoDB Community Create → Success Response
```

**Detaylı Akış:**
1. **Request Alınır** - Frontend'den POST isteği
2. **Validasyon** - Tüm alanlar kontrol edilir
3. **User Kontrol** - Auth service'den leaderId doğrulanır
4. **Database İşlemi** - MongoDB'ye community kaydı oluşturulur
5. **Default Settings** - Varsayılan roller ve yetkiler atanır
6. **Response** - Başarı/hata mesajı döndürülür

---

## 🛠️ Frontend Implementation Örneği

### **React Component**
```jsx
import React, { useState } from 'react';

const CreateCommunityForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    universityName: '',
    universityDepartment: '',
    leaderId: '' // Bu kullanıcı login bilgilerinden gelecek
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:16041/api/v1/community-create/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        alert('Topluluk başarıyla oluşturuldu!');
        // Redirect veya success handling
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Bağlantı hatası oluştu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Topluluk Adı"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
        minLength={2}
        maxLength={100}
      />
      
      <textarea
        placeholder="Topluluk Açıklaması"
        value={formData.description}
        onChange={(e) => setFormData({...formData, description: e.target.value})}
        required
        minLength={10}
        maxLength={500}
      />
      
      <input
        type="text"
        placeholder="Üniversite Adı"
        value={formData.universityName}
        onChange={(e) => setFormData({...formData, universityName: e.target.value})}
        required
        minLength={5}
        maxLength={200}
      />
      
      <input
        type="text"
        placeholder="Bölüm Adı"
        value={formData.universityDepartment}
        onChange={(e) => setFormData({...formData, universityDepartment: e.target.value})}
        required
        minLength={3}
        maxLength={100}
      />
      
      {error && <div className="error">{error}</div>}
      
      <button type="submit" disabled={loading}>
        {loading ? 'Oluşturuluyor...' : 'Topluluk Oluştur'}
      </button>
    </form>
  );
};

export default CreateCommunityForm;
```

---

## 🔧 Test Örneği

### **Postman/Insomnia Test**
```http
POST http://localhost:16041/api/v1/community-create/create
Content-Type: application/json

{
  "name": "Test Topluluğu",
  "description": "Bu bir test topluluğudur ve geliştirme amaçlı oluşturulmuştur",
  "universityName": "Test Üniversitesi",
  "universityDepartment": "Test Bölümü", 
  "leaderId": "674d2a8e123456789abcdef0"
}
```

### **cURL Örneği**
```bash
curl -X POST http://localhost:16041/api/v1/community-create/create \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Topluluğu",
    "description": "Bu bir test topluluğudur ve geliştirme amaçlı oluşturulmuştur",
    "universityName": "Test Üniversitesi", 
    "universityDepartment": "Test Bölümü",
    "leaderId": "674d2a8e123456789abcdef0"
  }'
```

---

## 📝 Notlar

- **leaderId** gerçek bir kullanıcı ID'si olmalı (Auth service'de kayıtlı)
- Topluluk oluşturulduktan sonra varsayılan olarak **leader** ve **member** rolleri atanır
- Leader otomatik olarak **all_access** yetkisine sahip olur
- Tüm validasyon hataları detaylı mesajlarla döndürülür
- Service MongoDB ve Redis bağlantısı gerektirir

---

## 🤝 Destek

Herhangi bir sorun yaşadığınızda:
1. Console loglarını kontrol edin
2. Network sekmesinde response'u inceleyin  
3. Service'in çalışır durumda olduğundan emin olun (`http://localhost:16041/health`)

---

**Son Güncelleme:** 14 Haziran 2025  
**Version:** 1.0.0 