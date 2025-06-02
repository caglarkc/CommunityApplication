import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'token_service.dart';

class ApiService {
  static const String baseUrl = 'http://localhost:16040/api/v1';
  
  // HTTP Headers
  static Map<String, String> get _headers => {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Authorization header'lı headers
  static Future<Map<String, String>> get _headersWithAuth async {
    final token = await TokenService.getAccessToken();
    final headers = Map<String, String>.from(_headers);
    
    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }
    
    return headers;
  }

  // POST Request with optional auth
  static Future<ApiResponse> post(String endpoint, Map<String, dynamic> data, {bool requireAuth = false}) async {
    try {
      final url = Uri.parse('$baseUrl$endpoint');
      print('🚀 API Request: POST $url');
      print('📤 Request Data: ${jsonEncode(data)}');

      // Auth gerekli endpoint'ler için token ekle
      final headers = requireAuth || endpoint.contains('/auth/check') 
          ? await _headersWithAuth 
          : _headers;

      final response = await http.post(
        url,
        headers: headers,
        body: jsonEncode(data),
      );

      print('📥 Response Status: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');

      return ApiResponse(
        statusCode: response.statusCode,
        data: response.body.isNotEmpty ? jsonDecode(response.body) : null,
        success: response.statusCode >= 200 && response.statusCode < 300,
      );
    } on SocketException {
      return ApiResponse(
        statusCode: 0,
        data: {'message': 'İnternet bağlantısı yok'},
        success: false,
      );
    } on FormatException {
      return ApiResponse(
        statusCode: 0,
        data: {'message': 'Geçersiz veri formatı'},
        success: false,
      );
    } catch (e) {
      print('❌ API Error: $e');
      return ApiResponse(
        statusCode: 0,
        data: {'message': 'Beklenmeyen hata: $e'},
        success: false,
      );
    }
  }

  // GET Request with optional auth
  static Future<ApiResponse> get(String endpoint, {bool requireAuth = false}) async {
    try {
      final url = Uri.parse('$baseUrl$endpoint');
      print('🚀 API Request: GET $url');

      // Auth gerekli endpoint'ler için token ekle
      final headers = requireAuth ? await _headersWithAuth : _headers;

      final response = await http.get(url, headers: headers);

      print('📥 Response Status: ${response.statusCode}');
      print('📥 Response Body: ${response.body}');

      return ApiResponse(
        statusCode: response.statusCode,
        data: response.body.isNotEmpty ? jsonDecode(response.body) : null,
        success: response.statusCode >= 200 && response.statusCode < 300,
      );
    } catch (e) {
      print('❌ API Error: $e');
      return ApiResponse(
        statusCode: 0,
        data: {'message': 'Beklenmeyen hata: $e'},
        success: false,
      );
    }
  }
}

class ApiResponse {
  final int statusCode;
  final dynamic data;
  final bool success;

  ApiResponse({
    required this.statusCode,
    required this.data,
    required this.success,
  });

  String get message {
    if (data != null && data is Map && data.containsKey('message')) {
      return data['message'];
    }
    return success ? 'İşlem başarılı' : 'İşlem başarısız';
  }
} 