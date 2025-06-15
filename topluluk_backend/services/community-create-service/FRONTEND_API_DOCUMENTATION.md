# 🏘️ Topluluk Oluşturma API - Frontend Dokümantasyonu

## 📋 Genel Bakış

Bu dokümantasyon, topluluk oluşturma işlemi için frontend tarafından kullanılacak API endpoint'ini detaylı bir şekilde açıklamaktadır. Yeni sistemde dosya yükleme özelliği de eklenmiştir.

## 🎯 API Endpoint

```
POST /api/v1/community-create/create
```

**Base URL:** `http://localhost:16041`  
**Full URL:** `http://localhost:16041/api/v1/community-create/create`

## 📊 Request Format

### Content-Type
```
multipart/form-data
```

### 📝 Form Data Alanları

#### **Zorunlu Metin Alanları**
| Alan | Tip | Açıklama | Validasyon |
|------|-----|----------|------------|
| `name` | string | Topluluk adı | Min: 3, Max: 100 karakter |
| `description` | string | Topluluk açıklaması | Min: 10, Max: 500 karakter |
| `universityName` | string | Üniversite adı | Min: 3, Max: 100 karakter |
| `universityDepartment` | string | Bölüm adı | Min: 3, Max: 100 karakter |
| `leaderId` | string | Lider kullanıcı ID'si | Valid ObjectId |

#### **Zorunlu Dosya Alanları**
| Alan | Tip | Açıklama | Validasyon |
|------|-----|----------|------------|
| `presidentDocument` | File | Başkan belgesi | PDF, JPG, PNG - Max: 10MB |
| `communityLogo` | File | Topluluk logosu | JPG, PNG, WebP - Max: 10MB |

#### **İsteğe Bağlı Dosya Alanları**
| Alan | Tip | Açıklama | Validasyon |
|------|-----|----------|------------|
| `coverPhoto` | File | Kapak fotoğrafı | JPG, PNG, WebP - Max: 10MB |

## 🔍 Detaylı Validasyon Kuralları

### 📄 Metin Alanları
```javascript
{
  name: {
    required: true,
    minLength: 3,
    maxLength: 100,
    type: "string"
  },
  description: {
    required: true,
    minLength: 10,
    maxLength: 500,
    type: "string"
  },
  universityName: {
    required: true,
    minLength: 3,
    maxLength: 100,
    type: "string"
  },
  universityDepartment: {
    required: true,
    minLength: 3,
    maxLength: 100,
    type: "string"
  },
  leaderId: {
    required: true,
    type: "string",
    format: "ObjectId"
  }
}
```

### 📁 Dosya Validasyonları
```javascript
{
  presidentDocument: {
    required: true,
    allowedTypes: ["application/pdf", "image/jpeg", "image/jpg", "image/png"],
    maxSize: "10MB",
    description: "Başkan belgesi (PDF veya resim formatında)"
  },
  communityLogo: {
    required: true,
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSize: "10MB",
    description: "Topluluk logosu (resim formatında)"
  },
  coverPhoto: {
    required: false,
    allowedTypes: ["image/jpeg", "image/jpg", "image/png", "image/webp"],
    maxSize: "10MB",
    description: "Kapak fotoğrafı (opsiyonel)"
  }
}
```

## 🎭 Frontend Implementation Örnekleri

### 🟨 Vanilla JavaScript
```javascript
async function createCommunity(formData) {
  try {
    const response = await fetch('http://localhost:16041/api/v1/community-create/create', {
      method: 'POST',
      body: formData, // FormData object
      // Content-Type header'ı otomatik set edilir
    });

    const result = await response.json();
    
    if (response.ok) {
      console.log('Topluluk başarıyla oluşturuldu:', result);
      return result;
    } else {
      throw new Error(result.message || 'Topluluk oluşturma hatası');
    }
  } catch (error) {
    console.error('API Hatası:', error);
    throw error;
  }
}

// Form handling örneği
document.getElementById('communityForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  
  const formData = new FormData();
  
  // Metin alanları
  formData.append('name', document.getElementById('name').value);
  formData.append('description', document.getElementById('description').value);
  formData.append('universityName', document.getElementById('universityName').value);
  formData.append('universityDepartment', document.getElementById('universityDepartment').value);
  formData.append('leaderId', document.getElementById('leaderId').value);
  
  // Dosyalar
  const presidentDoc = document.getElementById('presidentDocument').files[0];
  const logo = document.getElementById('communityLogo').files[0];
  const cover = document.getElementById('coverPhoto').files[0];
  
  if (presidentDoc) formData.append('presidentDocument', presidentDoc);
  if (logo) formData.append('communityLogo', logo);
  if (cover) formData.append('coverPhoto', cover);
  
  try {
    const result = await createCommunity(formData);
    alert('Topluluk başarıyla oluşturuldu!');
  } catch (error) {
    alert('Hata: ' + error.message);
  }
});
```

### ⚛️ React Example
```jsx
import React, { useState } from 'react';

const CommunityCreateForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    universityName: '',
    universityDepartment: '',
    leaderId: ''
  });
  
  const [files, setFiles] = useState({
    presidentDocument: null,
    communityLogo: null,
    coverPhoto: null
  });
  
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleFileChange = (e) => {
    setFiles({
      ...files,
      [e.target.name]: e.target.files[0]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const submitData = new FormData();
    
    // Add text fields
    Object.keys(formData).forEach(key => {
      submitData.append(key, formData[key]);
    });
    
    // Add files
    if (files.presidentDocument) {
      submitData.append('presidentDocument', files.presidentDocument);
    }
    if (files.communityLogo) {
      submitData.append('communityLogo', files.communityLogo);
    }
    if (files.coverPhoto) {
      submitData.append('coverPhoto', files.coverPhoto);
    }

    try {
      const response = await fetch('http://localhost:16041/api/v1/community-create/create', {
        method: 'POST',
        body: submitData,
      });

      const result = await response.json();
      
      if (response.ok) {
        alert('Topluluk başarılla oluşturuldu!');
        console.log(result);
      } else {
        alert('Hata: ' + result.message);
      }
    } catch (error) {
      alert('Network hatası: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} encType="multipart/form-data">
      {/* Text inputs */}
      <input
        type="text"
        name="name"
        placeholder="Topluluk Adı"
        value={formData.name}
        onChange={handleInputChange}
        required
      />
      
      <textarea
        name="description"
        placeholder="Topluluk Açıklaması"
        value={formData.description}
        onChange={handleInputChange}
        required
      />
      
      <input
        type="text"
        name="universityName"
        placeholder="Üniversite Adı"
        value={formData.universityName}
        onChange={handleInputChange}
        required
      />
      
      <input
        type="text"
        name="universityDepartment"
        placeholder="Bölüm Adı"
        value={formData.universityDepartment}
        onChange={handleInputChange}
        required
      />
      
      <input
        type="text"
        name="leaderId"
        placeholder="Lider ID"
        value={formData.leaderId}
        onChange={handleInputChange}
        required
      />
      
      {/* File inputs */}
      <label>Başkan Belgesi (Zorunlu):</label>
      <input
        type="file"
        name="presidentDocument"
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={handleFileChange}
        required
      />
      
      <label>Topluluk Logosu (Zorunlu):</label>
      <input
        type="file"
        name="communityLogo"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
        required
      />
      
      <label>Kapak Fotoğrafı (Opsiyonel):</label>
      <input
        type="file"
        name="coverPhoto"
        accept=".jpg,.jpeg,.png,.webp"
        onChange={handleFileChange}
      />
      
      <button type="submit" disabled={loading}>
        {loading ? 'Oluşturuluyor...' : 'Topluluk Oluştur'}
      </button>
    </form>
  );
};

export default CommunityCreateForm;
```

### 💚 Vue.js Example
```vue
<template>
  <form @submit.prevent="createCommunity" enctype="multipart/form-data">
    <!-- Text fields -->
    <input v-model="form.name" type="text" placeholder="Topluluk Adı" required />
    <textarea v-model="form.description" placeholder="Açıklama" required></textarea>
    <input v-model="form.universityName" type="text" placeholder="Üniversite" required />
    <input v-model="form.universityDepartment" type="text" placeholder="Bölüm" required />
    <input v-model="form.leaderId" type="text" placeholder="Lider ID" required />
    
    <!-- File fields -->
    <input @change="handleFile('presidentDocument', $event)" 
           type="file" accept=".pdf,.jpg,.jpeg,.png" required />
    <input @change="handleFile('communityLogo', $event)" 
           type="file" accept=".jpg,.jpeg,.png,.webp" required />
    <input @change="handleFile('coverPhoto', $event)" 
           type="file" accept=".jpg,.jpeg,.png,.webp" />
    
    <button type="submit" :disabled="loading">
      {{ loading ? 'Oluşturuluyor...' : 'Topluluk Oluştur' }}
    </button>
  </form>
</template>

<script>
export default {
  data() {
    return {
      form: {
        name: '',
        description: '',
        universityName: '',
        universityDepartment: '',
        leaderId: ''
      },
      files: {
        presidentDocument: null,
        communityLogo: null,
        coverPhoto: null
      },
      loading: false
    }
  },
  methods: {
    handleFile(fieldName, event) {
      this.files[fieldName] = event.target.files[0];
    },
    
    async createCommunity() {
      this.loading = true;
      
      const formData = new FormData();
      
      // Add text fields
      Object.keys(this.form).forEach(key => {
        formData.append(key, this.form[key]);
      });
      
      // Add files
      Object.keys(this.files).forEach(key => {
        if (this.files[key]) {
          formData.append(key, this.files[key]);
        }
      });
      
      try {
        const response = await fetch('http://localhost:16041/api/v1/community-create/create', {
          method: 'POST',
          body: formData
        });
        
        const result = await response.json();
        
        if (response.ok) {
          this.$emit('community-created', result);
          alert('Topluluk başarıyla oluşturuldu!');
        } else {
          alert('Hata: ' + result.message);
        }
      } catch (error) {
        alert('Network hatası: ' + error.message);
      } finally {
        this.loading = false;
      }
    }
  }
}
</script>
```

## 📨 Response Formatları

### ✅ Başarılı Response (201 Created)
```json
{
  "success": true,
  "message": "Topluluk ve dosyalar başarıyla oluşturuldu",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "Yazılım Topluluğu",
    "description": "Yazılım geliştirme odaklı topluluk",
    "universityName": "İstanbul Teknik Üniversitesi",
    "universityDepartment": "Bilgisayar Mühendisliği",
    "leaderId": "507f1f77bcf86cd799439012",
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
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### ❌ Hata Response'ları

#### 400 Bad Request - Eksik Alanlar
```json
{
  "success": false,
  "message": "Eksik gerekli alanlar (name, leaderId, universityName, universityDepartment, description)"
}
```

#### 400 Bad Request - Eksik Dosyalar
```json
{
  "success": false,
  "message": "Başkan belgesi ve topluluk logosu zorunludur"
}
```

#### 400 Bad Request - Geçersiz Dosya Türü
```json
{
  "success": false,
  "message": "presidentDocument for unsupported file type: text/plain"
}
```

#### 413 Payload Too Large
```json
{
  "success": false,
  "message": "Dosya boyutu çok büyük (max 10MB)",
  "error": "FileTooLarge"
}
```

#### 500 Internal Server Error
```json
{
  "success": false,
  "message": "Sunucu hatası",
  "error": "InternalServerError"
}
```

## 🧪 cURL Test Örnekleri

### Temel Test
```bash
curl -X POST http://localhost:16041/api/v1/community-create/create \
  -F "name=Test Topluluğu" \
  -F "description=Bu bir test topluluğudur" \
  -F "universityName=Test Üniversitesi" \
  -F "universityDepartment=Test Bölümü" \
  -F "leaderId=507f1f77bcf86cd799439012" \
  -F "presidentDocument=@/path/to/president-doc.pdf" \
  -F "communityLogo=@/path/to/logo.png" \
  -F "coverPhoto=@/path/to/cover.jpg"
```

### Sadece Zorunlu Alanlar
```bash
curl -X POST http://localhost:16041/api/v1/community-create/create \
  -F "name=Minimal Topluluk" \
  -F "description=Minimal açıklama test için" \
  -F "universityName=Test Üniversitesi" \
  -F "universityDepartment=Test Bölümü" \
  -F "leaderId=507f1f77bcf86cd799439012" \
  -F "presidentDocument=@president.pdf" \
  -F "communityLogo=@logo.png"
```

## 🔍 Frontend Validasyon Önerileri

### JavaScript Validasyon Fonksiyonları
```javascript
// Dosya boyutu kontrolü
function validateFileSize(file, maxSizeMB = 10) {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

// Dosya türü kontrolü
function validateFileType(file, allowedTypes) {
  return allowedTypes.includes(file.type);
}

// Metin alanı kontrolü
function validateText(text, minLength, maxLength) {
  return text.length >= minLength && text.length <= maxLength;
}

// ObjectId format kontrolü
function validateObjectId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

// Tam form validasyonu
function validateCommunityForm(formData, files) {
  const errors = [];
  
  // Text validations
  if (!validateText(formData.name, 3, 100)) {
    errors.push('Topluluk adı 3-100 karakter arası olmalıdır');
  }
  
  if (!validateText(formData.description, 10, 500)) {
    errors.push('Açıklama 10-500 karakter arası olmalıdır');
  }
  
  if (!validateObjectId(formData.leaderId)) {
    errors.push('Geçersiz lider ID formatı');
  }
  
  // File validations
  if (!files.presidentDocument) {
    errors.push('Başkan belgesi zorunludur');
  } else {
    if (!validateFileSize(files.presidentDocument)) {
      errors.push('Başkan belgesi 10MB\'den küçük olmalıdır');
    }
    if (!validateFileType(files.presidentDocument, ['application/pdf', 'image/jpeg', 'image/png'])) {
      errors.push('Başkan belgesi PDF veya resim formatında olmalıdır');
    }
  }
  
  if (!files.communityLogo) {
    errors.push('Topluluk logosu zorunludur');
  } else {
    if (!validateFileSize(files.communityLogo)) {
      errors.push('Logo 10MB\'den küçük olmalıdır');
    }
    if (!validateFileType(files.communityLogo, ['image/jpeg', 'image/png', 'image/webp'])) {
      errors.push('Logo resim formatında olmalıdır');
    }
  }
  
  return errors;
}
```

## 🎨 HTML Form Örneği
```html
<!DOCTYPE html>
<html>
<head>
    <title>Topluluk Oluştur</title>
    <style>
        .form-group { margin: 15px 0; }
        .error { color: red; font-size: 14px; }
        .required { color: red; }
    </style>
</head>
<body>
    <h1>Topluluk Oluştur</h1>
    
    <form id="communityForm" enctype="multipart/form-data">
        <div class="form-group">
            <label>Topluluk Adı <span class="required">*</span></label>
            <input type="text" id="name" name="name" required maxlength="100" minlength="3">
        </div>
        
        <div class="form-group">
            <label>Açıklama <span class="required">*</span></label>
            <textarea id="description" name="description" required maxlength="500" minlength="10"></textarea>
        </div>
        
        <div class="form-group">
            <label>Üniversite <span class="required">*</span></label>
            <input type="text" id="universityName" name="universityName" required maxlength="100" minlength="3">
        </div>
        
        <div class="form-group">
            <label>Bölüm <span class="required">*</span></label>
            <input type="text" id="universityDepartment" name="universityDepartment" required maxlength="100" minlength="3">
        </div>
        
        <div class="form-group">
            <label>Lider ID <span class="required">*</span></label>
            <input type="text" id="leaderId" name="leaderId" required pattern="^[0-9a-fA-F]{24}$">
        </div>
        
        <div class="form-group">
            <label>Başkan Belgesi <span class="required">*</span> (PDF, JPG, PNG - Max 10MB)</label>
            <input type="file" id="presidentDocument" name="presidentDocument" 
                   accept=".pdf,.jpg,.jpeg,.png" required>
        </div>
        
        <div class="form-group">
            <label>Topluluk Logosu <span class="required">*</span> (JPG, PNG, WebP - Max 10MB)</label>
            <input type="file" id="communityLogo" name="communityLogo" 
                   accept=".jpg,.jpeg,.png,.webp" required>
        </div>
        
        <div class="form-group">
            <label>Kapak Fotoğrafı (Opsiyonel - JPG, PNG, WebP - Max 10MB)</label>
            <input type="file" id="coverPhoto" name="coverPhoto" 
                   accept=".jpg,.jpeg,.png,.webp">
        </div>
        
        <div id="errors" class="error"></div>
        
        <button type="submit" id="submitBtn">Topluluk Oluştur</button>
    </form>

    <script>
        // Previous JavaScript code here...
    </script>
</body>
</html>
```

## 📊 Test Senaryoları

### ✅ Pozitif Test Senaryoları
1. **Tam Form**: Tüm alanları doldurulmuş form
2. **Minimal Form**: Sadece zorunlu alanlar
3. **Farklı Dosya Formatları**: PDF başkan belgesi, PNG logo
4. **Büyük Dosyalar**: 9MB dosya yükleme

### ❌ Negatif Test Senaryoları
1. **Eksik Metin Alanları**: Name, description vs. eksik
2. **Eksik Dosyalar**: Başkan belgesi veya logo eksik
3. **Geçersiz Dosya Türü**: TXT dosyası yükleme
4. **Büyük Dosya**: 11MB dosya yükleme
5. **Geçersiz ObjectId**: Hatalı leaderId formatı

## 🔧 Troubleshooting

### Yaygın Hatalar ve Çözümleri

1. **CORS Hatası**
   ```
   Access to fetch at 'http://localhost:16041' from origin 'http://localhost:3000' has been blocked by CORS policy
   ```
   **Çözüm**: Server CORS ayarları düzeltildi, sorun olmamalı.

2. **Dosya Yükleme Hatası**
   ```
   Error: multipart/form-data request required
   ```
   **Çözüm**: FormData kullanın, Content-Type header'ı manuel olarak set etmeyin.

3. **Dosya Boyut Hatası**
   ```
   Payload Too Large
   ```
   **Çözüm**: Dosya boyutunu 10MB altında tutun.

## 🚀 Sonuç

Bu API ile topluluk oluşturma işlemi artık dosya yükleme özelliği ile birlikte tam fonksiyonel hale geldi. Frontend tarafında FormData kullanarak kolayca entegre edebilirsiniz.

**Önemli Notlar:**
- Dosyaların Firebase Storage'da saklandığı
- Unique dosya ID'leri oluşturulduğu
- Resim dosyalarının otomatik optimize edildiği
- Event-driven mikroservis mimarisi kullanıldığı

Herhangi bir sorun yaşarsanız, server loglarını kontrol edin ve gerekirse dokümantasyonu güncelleyin. 