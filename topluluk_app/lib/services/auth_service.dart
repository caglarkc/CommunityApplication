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
      });
      
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
        
        print('❌ Auth check başarısız: $reason');
        
        return AuthCheckResult(
          isValid: false,
          reason: reason,
          shouldClearToken: shouldClear,
          message: response.data['message'] ?? 'Oturum geçersiz, lütfen tekrar giriş yapın',
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
        print('❌ Login başarısız: ${response.message}');
        return AuthResult(
          success: false,
          message: response.data['error'] ?? response.message,
        );
      }
    } catch (e) {
      print('❌ AuthService login error: $e');
      return AuthResult(
        success: false,
        message: 'Beklenmeyen hata oluştu: $e',
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
      // Token'ları temizle
      await TokenService.clearAllTokens();
      print('🔐 AuthService: Logout tamamlandı');
    } catch (e) {
      print('❌ Logout error: $e');
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
}

// Auth işlemlerinin sonucunu döndüren sınıf
class AuthResult {
  final bool success;
  final String message;
  final dynamic data;

  AuthResult({
    required this.success,
    required this.message,
    this.data,
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

  AuthCheckResult({
    required this.isValid,
    this.reason,
    this.shouldClearToken = false,
    required this.message,
    this.userId,
    this.sessionId,
  });
}
