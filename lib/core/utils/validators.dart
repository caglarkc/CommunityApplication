class Validators {
  static String? validateEmail(String? value) {
    if (value == null || value.isEmpty) {
      return 'E-posta alanı boş bırakılamaz';
    }
    
    // Email regex pattern
    final emailRegex = RegExp(r'^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$');
    if (!emailRegex.hasMatch(value)) {
      return 'Geçerli bir e-posta giriniz';
    }


    /*
    Normalde mu adresi kullanılmalı fakat şuan test aşamasında hepsine izin veriliyor
    if (!value.contains('@posta.mu.edu.tr')) {
      return 'Mu adresi kullanılmalıdır';
    }
    */
    
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Şifre alanı boş bırakılamaz';
    }
    
    if (value.length < 8 || value.length > 20) {
      return 'Şifre 8-20 karakter arasında olmalı';
    }
    
    // En az bir büyük harf
    if (!RegExp(r'[A-Z]').hasMatch(value)) {
      return 'Şifre en az bir büyük harf içermeli';
    }

    // En az bir küçük harf
    if (!RegExp(r'[a-z]').hasMatch(value)) {
      return 'Şifre en az bir küçük harf içermeli';
    }
    
    // En az bir sayı
    if (!RegExp(r'[0-9]').hasMatch(value)) {
      return 'Şifre en az bir sayı içermeli';
    }
    
    return null;
  }

  static String? validateName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'İsim alanı boş bırakılamaz';
    }
    
    final trimmedValue = value.trim();
    
    if (trimmedValue.length < 3 || trimmedValue.length > 50) {
      return 'İsim 3-50 karakter arasında olmalı';
    }
    
    // Türkçe karakterler dahil sadece harf ve boşluk
    if (!RegExp(r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$').hasMatch(trimmedValue)) {
      return 'İsim sadece harf ve boşluk içerebilir';
    }
    
    return null;
  }

  static String? validateSurname(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Soyisim alanı boş bırakılamaz';
    }
    
    final trimmedValue = value.trim();
    
    if (trimmedValue.length < 3 || trimmedValue.length > 50) {
      return 'Soyisim 3-50 karakter arasında olmalı';
    }
    
    // Türkçe karakterler dahil sadece harf ve boşluk
    if (!RegExp(r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$').hasMatch(trimmedValue)) {
      return 'Soyisim sadece harf ve boşluk içerebilir';
    }
    
    return null;
  }

  static String? validatePhone(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Telefon numarası boş bırakılamaz';
    }
    
    final trimmedValue = value.trim();
    
    // Tam 10 haneli olmalı
    if (trimmedValue.length != 10) {
      return 'Telefon numarası 10 haneli olmalı';
    }
    
    // Sadece rakam olmalı
    if (!RegExp(r'^[0-9]+$').hasMatch(trimmedValue)) {
      return 'Telefon numarası sadece rakam içerebilir';
    }
    
    return null;
  }

  static String? validatePasswordMatch(String? value, String password) {
    if (value == null || value.isEmpty) {
      return 'Şifre doğrulama alanı boş bırakılamaz';
    }
    
    if (value != password) {
      return 'Şifreler eşleşmiyor';
    }
    
    return null;
  }

  // Opsiyonel üniversite validation
  static String? validateUniversityOptional(String? value) {
    // Opsiyonel alan - boş olabilir
    if (value != null && value.trim().isNotEmpty) {
      final trimmedValue = value.trim();
      
      if (trimmedValue.length < 3 || trimmedValue.length > 80) {
        return 'Üniversite adı 3-80 karakter arasında olmalı';
      }
      
      // Türkçe karakterler dahil sadece harf ve boşluk
      if (!RegExp(r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$').hasMatch(trimmedValue)) {
        return 'Üniversite adı sadece harf ve boşluk içerebilir';
      }
    }
    return null;
  }

  // Opsiyonel bölüm validation
  static String? validateDepartmentOptional(String? value) {
    // Opsiyonel alan - boş olabilir
    if (value != null && value.trim().isNotEmpty) {
      final trimmedValue = value.trim();
      
      if (trimmedValue.length < 3 || trimmedValue.length > 50) {
        return 'Bölüm adı 3-50 karakter arasında olmalı';
      }
      
      // Türkçe karakterler dahil sadece harf ve boşluk
      if (!RegExp(r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$').hasMatch(trimmedValue)) {
        return 'Bölüm adı sadece harf ve boşluk içerebilir';
      }
    }
    return null;
  }

  // Opsiyonel sınıf validation
  static String? validateGradeOptional(String? value) {
    // Opsiyonel alan - boş olabilir
    if (value != null && value.trim().isNotEmpty) {
      final trimmedValue = value.trim();
      
      // Geçerli sınıf değerleri
      final validGrades = ['1', '2', '3', '4', '5', '6', 'Hazırlık', 'Yüksek Lisans', 'Doktora'];
      
      if (!validGrades.contains(trimmedValue)) {
        return 'Geçerli sınıf: 1, 2, 3, 4, 5, 6, Hazırlık, Yüksek Lisans, Doktora';
      }
    }
    return null;
  }

  // Zorunlu topluluk adı validation
  static String? validateCommunityName(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Topluluk adı gerekli';
    }
    
    final trimmedValue = value.trim();
    
    if (trimmedValue.length < 3 || trimmedValue.length > 50) {
      return 'Topluluk adı 3-50 karakter arasında olmalı';
    }
    
    // Türkçe karakterler dahil harf, sayı, boşluk ve bazı özel karakterler
    if (!RegExp(r'^[a-zA-Z0-9çÇğĞıİöÖşŞüÜ\s\-&.()]+$').hasMatch(trimmedValue)) {
      return 'Topluluk adı sadece harf, sayı, boşluk ve - & . ( ) içerebilir';
    }
    
    return null;
  }

  // Zorunlu üniversite validation (topluluk için)
  static String? validateUniversityRequired(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Üniversite adı gerekli';
    }
    
    final trimmedValue = value.trim();
    
    if (trimmedValue.length < 3 || trimmedValue.length > 80) {
      return 'Üniversite adı 3-80 karakter arasında olmalı';
    }
    
    // Türkçe karakterler dahil sadece harf ve boşluk
    if (!RegExp(r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$').hasMatch(trimmedValue)) {
      return 'Üniversite adı sadece harf ve boşluk içerebilir';
    }
    
    return null;
  }

  // Zorunlu topluluk açıklaması validation
  static String? validateCommunityDescription(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Topluluk açıklaması gerekli';
    }
    
    final trimmedValue = value.trim();
    
    if (trimmedValue.length < 10 || trimmedValue.length > 500) {
      return 'Açıklama 10-500 karakter arasında olmalı';
    }
    
    return null;
  }

  // Kuruluş tarihi validation
  static String? validateFoundingDate(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Kuruluş tarihi gerekli';
    }
    // Basit tarih formatı kontrolü
    final dateRegExp = RegExp(r'^\d{2}/\d{2}/\d{4}$');
    if (!dateRegExp.hasMatch(value.trim())) {
      return 'Geçerli tarih formatı: GG/AA/YYYY';
    }
    return null;
  }

  // Aktiviteler validation
  static String? validateActivities(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Aktivite bilgisi gerekli';
    }
    return null;
  }

  // İletişim bilgisi validation
  static String? validateContactInfo(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'İletişim bilgisi gerekli';
    }
    return null;
  }

  // Zorunlu üniversite validation (kayıt için)
  static String? validateUniversityRequiredForRegistration(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Üniversite adı gerekli';
    }
    
    final trimmedValue = value.trim();
    
    if (trimmedValue.length < 3 || trimmedValue.length > 80) {
      return 'Üniversite adı 3-80 karakter arasında olmalı';
    }
    
    // Türkçe karakterler dahil sadece harf ve boşluk
    if (!RegExp(r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$').hasMatch(trimmedValue)) {
      return 'Üniversite adı sadece harf ve boşluk içerebilir';
    }
    
    return null;
  }

  // Zorunlu bölüm validation (kayıt için)
  static String? validateDepartmentRequiredForRegistration(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Bölüm adı gerekli';
    }
    
    final trimmedValue = value.trim();
    
    if (trimmedValue.length < 3 || trimmedValue.length > 50) {
      return 'Bölüm adı 3-50 karakter arasında olmalı';
    }
    
    // Türkçe karakterler dahil sadece harf ve boşluk
    if (!RegExp(r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$').hasMatch(trimmedValue)) {
      return 'Bölüm adı sadece harf ve boşluk içerebilir';
    }
    
    return null;
  }

  // Zorunlu sınıf validation (kayıt için)
  static String? validateGradeRequiredForRegistration(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Sınıf bilgisi gerekli';
    }
    
    final trimmedValue = value.trim();
    
    // Geçerli sınıf değerleri
    final validGrades = ['1', '2', '3', '4', '5', '6', 'Hazırlık', 'Yüksek Lisans', 'Doktora'];
    
    if (!validGrades.contains(trimmedValue)) {
      return 'Geçerli sınıf: 1, 2, 3, 4, 5, 6, Hazırlık, Yüksek Lisans, Doktora';
    }
    
    return null;
  }

  // Zorunlu topluluk departmanı validation
  static String? validateCommunityDepartment(String? value) {
    if (value == null || value.trim().isEmpty) {
      return 'Topluluk departmanı gerekli';
    }
    
    final trimmedValue = value.trim();
    
    if (trimmedValue.length < 3 || trimmedValue.length > 50) {
      return 'Departman adı 3-50 karakter arasında olmalı';
    }
    
    // Türkçe karakterler dahil sadece harf ve boşluk
    if (!RegExp(r'^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$').hasMatch(trimmedValue)) {
      return 'Departman adı sadece harf ve boşluk içerebilir';
    }
    
    return null;
  }

}
