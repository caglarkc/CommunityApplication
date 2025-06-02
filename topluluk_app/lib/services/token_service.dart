import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

class TokenService {
  // Secure storage instance
  static const FlutterSecureStorage _secureStorage = FlutterSecureStorage(
    aOptions: AndroidOptions(
      encryptedSharedPreferences: true,
    ),
    iOptions: IOSOptions(
      accessibility: KeychainAccessibility.first_unlock_this_device,
    ),
  );

  // Storage keys
  static const String _accessTokenKey = 'access_token';
  static const String _userDataKey = 'user_data';
  static const String _deviceFingerprintKey = 'device_fingerprint';

  /// Access token kaydet (secure storage)
  static Future<void> saveAccessToken(String token) async {
    try {
      await _secureStorage.write(key: _accessTokenKey, value: token);
      print('✅ Access token saved securely');
    } catch (e) {
      print('❌ Access token save error: $e');
    }
  }

  /// Access token oku
  static Future<String?> getAccessToken() async {
    try {
      return await _secureStorage.read(key: _accessTokenKey);
    } catch (e) {
      print('❌ Access token read error: $e');
      return null;
    }
  }

  /// User data kaydet (JSON format)
  static Future<void> saveUserData(Map<String, dynamic> userData) async {
    try {
      final userDataJson = jsonEncode(userData);
      await _secureStorage.write(key: _userDataKey, value: userDataJson);
      print('✅ User data saved');
    } catch (e) {
      print('❌ User data save error: $e');
    }
  }

  /// User data oku
  static Future<Map<String, dynamic>?> getUserData() async {
    try {
      final userDataJson = await _secureStorage.read(key: _userDataKey);
      if (userDataJson != null) {
        return jsonDecode(userDataJson) as Map<String, dynamic>;
      }
      return null;
    } catch (e) {
      print('❌ User data read error: $e');
      return null;
    }
  }

  /// Device fingerprint kaydet (normal storage)
  static Future<void> saveDeviceFingerprint(String fingerprint) async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(_deviceFingerprintKey, fingerprint);
      print('✅ Device fingerprint saved: $fingerprint');
    } catch (e) {
      print('❌ Device fingerprint save error: $e');
    }
  }

  /// Device fingerprint oku
  static Future<String?> getDeviceFingerprint() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      return prefs.getString(_deviceFingerprintKey);
    } catch (e) {
      print('❌ Device fingerprint read error: $e');
      return null;
    }
  }

  /// Login data'sini toplu kaydet (sadece access token + user data)
  static Future<void> saveLoginData({
    required String accessToken,
    required Map<String, dynamic> userData,
    required String deviceFingerprint,
  }) async {
    await Future.wait([
      saveAccessToken(accessToken),
      saveUserData(userData),
      saveDeviceFingerprint(deviceFingerprint),
    ]);
    
    print('🎉 Login data saved successfully');
  }

  /// Kullanıcının login olup olmadığını kontrol et
  static Future<bool> isLoggedIn() async {
    try {
      final accessToken = await getAccessToken();
      return accessToken != null;
    } catch (e) {
      print('❌ Login check error: $e');
      return false;
    }
  }

  /// Tüm authentication verilerini temizle (logout)
  static Future<void> clearAllTokens() async {
    try {
      await Future.wait([
        _secureStorage.delete(key: _accessTokenKey),
        _secureStorage.delete(key: _userDataKey),
        _clearDeviceFingerprint(),
      ]);
      
      print('🧹 All tokens cleared');
    } catch (e) {
      print('❌ Token clear error: $e');
    }
  }

  /// Device fingerprint temizle
  static Future<void> _clearDeviceFingerprint() async {
    try {
      final prefs = await SharedPreferences.getInstance();
      await prefs.remove(_deviceFingerprintKey);
    } catch (e) {
      print('❌ Device fingerprint clear error: $e');
    }
  }

  /// JWT token'ın expire olup olmadığını kontrol et
  static bool isTokenExpired(String token) {
    try {
      // JWT token'ı decode et (basit kontrol)
      final parts = token.split('.');
      if (parts.length != 3) return true;

      // Payload kısmını decode et
      final payload = parts[1];
      final normalizedPayload = base64Url.normalize(payload);
      final payloadMap = jsonDecode(utf8.decode(base64Url.decode(normalizedPayload)));

      // Expire time kontrolü
      final exp = payloadMap['exp'] as int?;
      if (exp == null) return true;

      final expireDate = DateTime.fromMillisecondsSinceEpoch(exp * 1000);
      final now = DateTime.now();

      // 5 dakika öncesinden expire kabul et (güvenlik için)
      final bufferTime = expireDate.subtract(const Duration(minutes: 5));
      
      return now.isAfter(bufferTime);
    } catch (e) {
      print('❌ Token expire check error: $e');
      return true; // Hata durumunda expire kabul et
    }
  }

  /// Debug için tüm token bilgilerini yazdır
  static Future<void> printStoredTokens() async {
    print('🔐 Stored Tokens:');
    
    final accessToken = await getAccessToken();
    final userData = await getUserData();
    final fingerprint = await getDeviceFingerprint();
    
    print('  Access Token: ${accessToken != null ? "✅ Exists" : "❌ Missing"}');
    print('  User Data: ${userData != null ? "✅ Exists" : "❌ Missing"}');
    print('  Device Fingerprint: ${fingerprint ?? "❌ Missing"}');
    
    if (accessToken != null) {
      print('  Access Token Expired: ${isTokenExpired(accessToken) ? "❌ Yes" : "✅ No"}');
    }
  }
} 