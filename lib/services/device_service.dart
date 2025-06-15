import 'dart:io';
import 'package:device_info_plus/device_info_plus.dart';
import 'package:flutter/foundation.dart';

class DeviceService {
  static final DeviceInfoPlugin _deviceInfo = DeviceInfoPlugin();
  
  /// Device bilgilerini toplar ve API formatında döndürür
  static Future<Map<String, dynamic>> getDeviceInfo() async {
    try {
      if (Platform.isAndroid) {
        return await _getAndroidInfo();
      } else if (Platform.isIOS) {
        return await _getIOSInfo();
      } else if (kIsWeb) {
        return await _getWebInfo();
      } else {
        // Windows, macOS, Linux için fallback
        return _getDesktopInfo();
      }
    } catch (e) {
      print('❌ Device info error: $e');
      return _getFallbackInfo();
    }
  }
  
  /// Android device bilgileri
  static Future<Map<String, dynamic>> _getAndroidInfo() async {
    final androidInfo = await _deviceInfo.androidInfo;
    
    return {
      // 🔴 ZORUNLU ALANLAR
      'platform': 'android',
      'model': androidInfo.model,
      'version': androidInfo.version.release,
      
      // 🟡 İSTEĞE BAĞLI ALANLAR
      'userAgent': 'ToplulukApp/1.0.0 (Android ${androidInfo.version.release}; ${androidInfo.model})',
      'screenResolution': _getScreenResolution(),
      'timeZone': DateTime.now().timeZoneName,
      'language': Platform.localeName,
      
      // Debug bilgileri
      'brand': androidInfo.brand,
      'manufacturer': androidInfo.manufacturer,
      'device': androidInfo.device,
    };
  }
  
  /// iOS device bilgileri
  static Future<Map<String, dynamic>> _getIOSInfo() async {
    final iosInfo = await _deviceInfo.iosInfo;
    
    return {
      // 🔴 ZORUNLU ALANLAR
      'platform': 'ios',
      'model': iosInfo.model,
      'version': iosInfo.systemVersion,
      
      // 🟡 İSTEĞE BAĞLI ALANLAR
      'userAgent': 'ToplulukApp/1.0.0 (iOS ${iosInfo.systemVersion}; ${iosInfo.model})',
      'screenResolution': _getScreenResolution(),
      'timeZone': DateTime.now().timeZoneName,
      'language': Platform.localeName,
      
      // Debug bilgileri
      'name': iosInfo.name,
      'systemName': iosInfo.systemName,
      'identifierForVendor': iosInfo.identifierForVendor,
    };
  }
  
  /// Web platform bilgileri
  static Future<Map<String, dynamic>> _getWebInfo() async {
    final webInfo = await _deviceInfo.webBrowserInfo;
    
    return {
      // 🔴 ZORUNLU ALANLAR
      'platform': 'web',
      'model': webInfo.browserName.name,
      'version': webInfo.appVersion ?? 'unknown',
      
      // 🟡 İSTEĞE BAĞLI ALANLAR
      'userAgent': webInfo.userAgent ?? 'ToplulukApp/1.0.0 (Web)',
      'screenResolution': _getScreenResolution(),
      'timeZone': DateTime.now().timeZoneName,
      'language': Platform.localeName,
      
      // Debug bilgileri
      'vendor': webInfo.vendor,
    };
  }
  
  /// Desktop platform bilgileri (Windows, macOS, Linux)
  static Map<String, dynamic> _getDesktopInfo() {
    String platform = 'desktop';
    if (Platform.isWindows) platform = 'windows';
    if (Platform.isMacOS) platform = 'macos';
    if (Platform.isLinux) platform = 'linux';
    
    return {
      // 🔴 ZORUNLU ALANLAR
      'platform': platform,
      'model': Platform.operatingSystem,
      'version': Platform.operatingSystemVersion,
      
      // 🟡 İSTEĞE BAĞLI ALANLAR
      'userAgent': 'ToplulukApp/1.0.0 ($platform)',
      'screenResolution': _getScreenResolution(),
      'timeZone': DateTime.now().timeZoneName,
      'language': Platform.localeName,
    };
  }
  
  /// Fallback bilgileri (hata durumunda)
  static Map<String, dynamic> _getFallbackInfo() {
    return {
      'platform': 'unknown',
      'model': 'unknown',
      'version': 'unknown',
      'userAgent': 'ToplulukApp/1.0.0 (Unknown)',
      'timeZone': DateTime.now().timeZoneName,
      'language': 'tr-TR',
    };
  }
  
  /// Screen resolution bilgisi (şimdilik placeholder)
  static String _getScreenResolution() {
    // TODO: MediaQuery kullanarak gerçek screen resolution al
    return 'unknown';
  }
  
  /// Device fingerprint oluştur (backend ile aynı logic)
  static String generateFingerprint(Map<String, dynamic> deviceInfo) {
    final platform = deviceInfo['platform'] ?? 'unknown';
    final model = deviceInfo['model'] ?? 'unknown';
    final version = deviceInfo['version'] ?? 'unknown';
    
    return '${platform}_${model}_$version'.toLowerCase().replaceAll(' ', '_');
  }
  
  /// Debug için device info yazdır
  static void printDeviceInfo(Map<String, dynamic> deviceInfo) {
    print('📱 Device Info:');
    deviceInfo.forEach((key, value) {
      print('  $key: $value');
    });
    print('🔑 Fingerprint: ${generateFingerprint(deviceInfo)}');
  }
} 