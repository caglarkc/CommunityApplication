import 'dart:async';
import 'api_service.dart';
import 'token_service.dart';
import 'device_service.dart';

class AuthService {
  // Singleton pattern
  static final AuthService _instance = AuthService._internal();
  factory AuthService() => _instance;
  AuthService._internal();

  // App startup'ta auth durumu kontrol et
  Future<AuthCheckResult> checkAuthStatus() async {
    try {
      print('🔐 AuthService: Startup auth check başlatılıyor...');
      
      // 1. Stored token kontrol et
      final storedToken = await TokenService.getAccessToken();
      if (storedToken == null) {
        print('❌ Stored token bulunamadı');
        return AuthCheckResult(
          isValid: false,
          reason: 'no_stored_token',
          shouldClearToken: false,
          message: 'Lütfen giriş yapın',
        );
      }
      
      // 2. Device info al
      final deviceInfo = await DeviceService.getDeviceInfo();
      print('📱 Device info alındı');
      
      // 3. Backend'e auth check isteği
      final response = await ApiService.post('/auth/check', {
        'deviceInfo': deviceInfo,
      }, requireAuth: true); // Auth gerekli olduğunu belirt
      
      if (response.success && response.data['isValid'] == true) {
        // ✅ Auth geçerli
        print('✅ Auth check başarılı: ${response.data['userId']}');
        return AuthCheckResult(
          isValid: true,
          message: response.data['message'] ?? 'Oturum geçerli',
          userId: response.data['userId'],
          sessionId: response.data['sessionId'],
        );
      } else {
        // ❌ Auth geçersiz
        final reason = response.data['reason'] ?? 'unknown_error';
        final shouldClear = response.data['clearToken'] ?? true;
        final message = response.data['message'] ?? 'Oturum geçersiz, lütfen tekrar giriş yapın';
        
        print('❌ Auth check başarısız: $reason');
        
        // Debug bilgisi varsa yazdır
        if (response.data['debug'] != null) {
          print('🐛 Debug info: ${response.data['debug']}');
        }
        
        return AuthCheckResult(
          isValid: false,
          reason: reason,
          shouldClearToken: shouldClear,
          message: message,
          email: _extractEmailFromDebugOrUserData(response.data),
        );
      }
    } catch (e) {
      print('❌ Auth check error: $e');
      return AuthCheckResult(
        isValid: false,
        reason: 'network_error',
        shouldClearToken: true,
        message: 'Bağlantı hatası, lütfen tekrar giriş yapın',
      );
    }
  }

  // Debug veya user data'sından email çıkar
  String? _extractEmailFromDebugOrUserData(Map<String, dynamic> data) {
    // User data'dan email almaya çalış
    if (data['user'] != null && data['user']['email'] != null) {
      return data['user']['email'];
    }
    // Debug info'dan email almaya çalış
    if (data['debug'] != null && data['debug']['userEmail'] != null) {
      return data['debug']['userEmail'];
    }
    return null;
  }

  // Login işlemi - Backend API'sine uygun hale getirildi
  Future<AuthResult> login({
    required String emailOrPhone,
    required String password,
    required bool isEmail,
    required Map<String, dynamic> deviceInfo,
  }) async {
    try {
      print('🔐 AuthService: Login başlatılıyor...');
      
      final requestData = <String, dynamic>{
        'password': password,
        'deviceInfo': deviceInfo,
      };
      
      // Email veya phone ekle
      if (isEmail) {
        requestData['email'] = emailOrPhone;
      } else {
        requestData['phone'] = emailOrPhone;
      }

      final response = await ApiService.post('/auth/login', requestData);
      
      if (response.success) {
        print('✅ Login başarılı!');
        return AuthResult(
          success: true,
          message: response.data['message'] ?? 'Giriş başarılı',
          data: response.data,
        );
      } else {
        // Backend'den gelen error mesajını analiz et
        final errorMessage = response.data['error'] ?? response.data['message'] ?? response.message;
        print('❌ Login başarısız: $errorMessage');
        
        // Spesifik error türlerini belirle
        String? errorType;
        if (errorMessage.contains('doğrulamanız gerekiyor') || errorMessage.contains('doğrulanmamış')) {
          errorType = 'email_not_verified';
        } else if (errorMessage.contains('bloke edilmiş')) {
          errorType = 'account_blocked';
        } else if (errorMessage.contains('silinmiş')) {
          errorType = 'account_deleted';
        } else if (errorMessage.contains('geçersiz')) {
          errorType = 'invalid_credentials';
        }

        return AuthResult(
          success: false,
          message: errorMessage,
          errorType: errorType,
          email: isEmail ? emailOrPhone : null, // Email verification için gerekebilir
        );
      }
    } catch (e) {
      print('❌ AuthService login error: $e');
      return AuthResult(
        success: false,
        message: 'Beklenmeyen hata oluştu: $e',
        errorType: 'network_error',
      );
    }
  }

  // Kayıt işlemi - Backend API'sine uygun hale getirildi
  Future<AuthResult> register({
    required String name,
    required String surname,
    required String email,
    required String phone,
    required String password,
    String? university,
    String? department,
    String? grade,
    String? status, // user veya leader_of_community
  }) async {
    try {
      print('🔐 AuthService: Register başlatılıyor...');
      
      final requestData = {
        'name': name,
        'surname': surname,
        'email': email,
        'phone': phone,
        'password': password,
      };

      // Opsiyonel alanları ekle (sadece dolu olanları)
      if (university != null && university.trim().isNotEmpty) {
        requestData['universityName'] = university.trim();
      }
      if (department != null && department.trim().isNotEmpty) {
        requestData['universityDepartment'] = department.trim();
      }
      if (grade != null && grade.trim().isNotEmpty) {
        requestData['classYear'] = grade.trim();
      }
      
      // Status bilgisini ekle (varsayılan: user)
      requestData['status'] = status ?? 'user';
      
      print('📊 Register request data: $requestData');

      final response = await ApiService.post('/auth/register', requestData);
      
      if (response.success) {
        print('✅ Kayıt başarılı!');
        return AuthResult(
          success: true,
          message: response.message,
          data: response.data,
        );
      } else {
        print('❌ Kayıt başarısız: ${response.message}');
        return AuthResult(
          success: false,
          message: response.message,
        );
      }
    } catch (e) {
      print('❌ AuthService register error: $e');
      return AuthResult(
        success: false,
        message: 'Beklenmeyen hata oluştu: $e',
      );
    }
  }

  // Çıkış işlemi
  Future<void> logout() async {
    try {
      print('🚪 AuthService: Logout başlatılıyor...');
      
      // Backend'e logout isteği gönder
      final response = await ApiService.post('/auth/logout', {}, requireAuth: true);
      
      if (response.success) {
        print('✅ Backend logout başarılı: ${response.message}');
      } else {
        print('⚠️ Backend logout hatası: ${response.message}');
        // Backend hatası olsa bile frontend'te token'ları temizle
      }
    } catch (e) {
      print('❌ Logout API error: $e');
      // Network hatası olsa bile frontend'te token'ları temizle
    } finally {
      // Her durumda frontend'te token'ları temizle
      await TokenService.clearAllTokens();
      print('🔐 AuthService: Frontend logout tamamlandı');
    }
  }

  // Şifre sıfırlama
  Future<AuthResult> resetPassword(String email) async {
    try {
      print('🔐 AuthService: Password reset için $email');
      
      final requestData = {'email': email};
      final response = await ApiService.post('/auth/forgot-password', requestData);
      
      return AuthResult(
        success: response.success,
        message: response.message,
      );
    } catch (e) {
      print('❌ Password reset error: $e');
      return AuthResult(
        success: false,
        message: 'Şifre sıfırlama hatası: $e',
      );
    }
  }

  // Email doğrulama kodu gönder
  Future<AuthResult> sendVerificationEmail(String email) async {
    try {
      print('📧 AuthService: Verification email gönderiliyor: $email');
      
      final requestData = {'email': email};
      final response = await ApiService.post('/auth/send-verification-email', requestData);
      
      if (response.success) {
        print('✅ Verification email gönderildi');
        return AuthResult(
          success: true,
          message: response.data['message'] ?? 'Doğrulama e-postası gönderildi',
          data: response.data, // expiresAt bilgisi için
        );
      } else {
        print('❌ Verification email gönderme hatası: ${response.message}');
        return AuthResult(
          success: false,
          message: response.data['error'] ?? response.message,
        );
      }
    } catch (e) {
      print('❌ Send verification email error: $e');
      return AuthResult(
        success: false,
        message: 'E-posta gönderme hatası: $e',
      );
    }
  }

  // Email doğrulama kodunu kontrol et
  Future<AuthResult> verifyEmail({
    required String email,
    required String code,
  }) async {
    try {
      print('🔍 AuthService: Email verification: $email, code: $code');
      
      final requestData = {
        'email': email,
        'code': code,
      };
      
      final response = await ApiService.post('/auth/verify-email', requestData);
      
      if (response.success) {
        print('✅ Email verification başarılı');
        return AuthResult(
          success: true,
          message: response.data['message'] ?? 'E-posta adresiniz başarıyla doğrulandı',
          data: response.data, // user bilgisi için
        );
      } else {
        print('❌ Email verification hatası: ${response.message}');
        
        // Spesifik error türlerini belirle
        String? errorType;
        final errorMessage = response.data['error'] ?? response.message;
        
        if (errorMessage.contains('süresi dolmuş')) {
          errorType = 'code_expired';
        } else if (errorMessage.contains('Geçersiz')) {
          errorType = 'invalid_code';
        } else if (errorMessage.contains('bulunamadı')) {
          errorType = 'user_not_found';
        }
        
        return AuthResult(
          success: false,
          message: errorMessage,
          errorType: errorType,
        );
      }
    } catch (e) {
      print('❌ Verify email error: $e');
      return AuthResult(
        success: false,
        message: 'Email doğrulama hatası: $e',
        errorType: 'network_error',
      );
    }
  }
}

// Auth işlemlerinin sonucunu döndüren sınıf
class AuthResult {
  final bool success;
  final String message;
  final dynamic data;
  final String? errorType; // Backend'den gelen spesifik error türü
  final String? email; // Email verification için gerekli

  AuthResult({
    required this.success,
    required this.message,
    this.data,
    this.errorType,
    this.email,
  });
}

// Auth check sonucunu döndüren sınıf
class AuthCheckResult {
  final bool isValid;
  final String? reason;
  final bool shouldClearToken;
  final String message;
  final String? userId;
  final String? sessionId;
  final String? email; // Email verification için gerekebilir

  AuthCheckResult({
    required this.isValid,
    this.reason,
    this.shouldClearToken = false,
    required this.message,
    this.userId,
    this.sessionId,
    this.email,
  });
}
