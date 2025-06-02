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
    
    return null;
  }

  static String? validatePassword(String? value) {
    if (value == null || value.isEmpty) {
      return 'Şifre alanı boş bırakılamaz';
    }
    
    if (value.length < 8) {
      return 'Şifre en az 8 karakter olmalı';
    }

    if (value.length > 24) {
      return 'Şifre en fazla 24 karakter olmalı';
    }
    
    // En az bir büyük harf
    if (!value.contains(RegExp(r'[A-Z]'))) {
      return 'Şifre en az bir büyük harf içermeli';
    }

    // En az bir küçük harf
    if (!value.contains(RegExp(r'[a-z]'))) {
      return 'Şifre en az bir küçük harf içermeli';
    }
    
    // En az bir sayı
    if (!value.contains(RegExp(r'[0-9]'))) {
      return 'Şifre en az bir sayı içermeli';
    }
    
    return null;
  }

  static String? validateName(String? value) {
    if (value == null || value.isEmpty) {
      return 'İsim alanı boş bırakılamaz';
    }
    
    if (value.length < 2) {
      return 'İsim en az 2 karakter olmalı';
    }
    
    return null;
  }

  static String? validateSurname(String? value) {
    if (value == null || value.isEmpty) {
      return 'Soyisim alanı boş bırakılamaz';
    }
    
    if (value.length < 2) {
      return 'Soyisim en az 2 karakter olmalı';
    }
    
    return null;
  }

  static String? validatePhone(String? value) {
    if (value == null || value.isEmpty) {
      return 'Telefon numarası boş bırakılamaz';
    }
    
    // Sadece rakam ve başında 5 olması kontrol edilir
    final phoneRegex = RegExp(r'^5[0-9]{9}$');
    if (!phoneRegex.hasMatch(value)) {
      return 'Geçerli telefon numarası giriniz (5xxxxxxxxx)';
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
}
