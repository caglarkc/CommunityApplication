import 'dart:io';
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:http_parser/http_parser.dart';
import 'token_service.dart';

class UploadService {
  static const String baseUrl = 'http://localhost:3003/api/v1/upload';

  // Logo yükleme
  Future<UploadResult> uploadLogo(String communityId, File logoFile) async {
    return await _uploadFile(
      endpoint: '/community/$communityId/logo',
      fieldName: 'logo',
      file: logoFile,
    );
  }

  // Banner/kapak fotoğrafı yükleme
  Future<UploadResult> uploadBanner(String communityId, File bannerFile) async {
    return await _uploadFile(
      endpoint: '/community/$communityId/banner-photo',
      fieldName: 'banner',
      file: bannerFile,
    );
  }

  // Lider belgesi yükleme
  Future<UploadResult> uploadLeaderDocument(
    String communityId, 
    File documentFile,
    String documentType
  ) async {
    return await _uploadFile(
      endpoint: '/community/$communityId/leader-document',
      fieldName: 'document',
      file: documentFile,
      additionalFields: {'documentType': documentType},
    );
  }

  // Genel dosya yükleme metodu
  Future<UploadResult> _uploadFile({
    required String endpoint,
    required String fieldName,
    required File file,
    Map<String, String>? additionalFields,
  }) async {
    try {
      // Token al
      final token = await TokenService.getAccessToken();
      if (token == null) {
        return UploadResult(
          success: false,
          message: 'Authentication token bulunamadı',
        );
      }

      // Dosya boyutu kontrolü (10MB)
      final fileSize = await file.length();
      if (fileSize > 10 * 1024 * 1024) {
        return UploadResult(
          success: false,
          message: 'Dosya boyutu 10MB\'dan büyük olamaz',
        );
      }

      // Request oluştur
      final uri = Uri.parse('$baseUrl$endpoint');
      final request = http.MultipartRequest('POST', uri);

      // Headers ekle
      request.headers['Authorization'] = 'Bearer $token';

      // Dosyayı ekle
      final mimeType = _getMimeType(file.path);
      final multipartFile = await http.MultipartFile.fromPath(
        fieldName,
        file.path,
        contentType: MediaType.parse(mimeType),
      );
      request.files.add(multipartFile);

      // Ek alanları ekle
      if (additionalFields != null) {
        request.fields.addAll(additionalFields);
      }

      print('📤 Dosya yükleniyor: ${file.path}');
      print('📤 Endpoint: $endpoint');
      print('📤 Dosya boyutu: ${(fileSize / 1024 / 1024).toStringAsFixed(2)} MB');

      // Request gönder
      final streamedResponse = await request.send();
      final response = await http.Response.fromStream(streamedResponse);

      print('📤 Upload response status: ${response.statusCode}');
      print('📤 Upload response body: ${response.body}');

      // Response parse et
      final responseData = json.decode(response.body);

      if (response.statusCode == 200) {
        return UploadResult(
          success: true,
          message: responseData['message'] ?? 'Dosya başarıyla yüklendi',
          data: responseData['data'],
        );
      } else {
        return UploadResult(
          success: false,
          message: responseData['message'] ?? 'Dosya yükleme başarısız',
          statusCode: response.statusCode,
        );
      }
    } catch (e) {
      print('❌ Upload hatası: $e');
      return UploadResult(
        success: false,
        message: 'Dosya yükleme sırasında hata oluştu: $e',
      );
    }
  }

  // MIME type belirleme
  String _getMimeType(String filePath) {
    final extension = filePath.toLowerCase().split('.').last;
    switch (extension) {
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      case 'webp':
        return 'image/webp';
      case 'pdf':
        return 'application/pdf';
      default:
        return 'application/octet-stream';
    }
  }

  // Dosya formatı kontrolü
  bool isValidImageFormat(String filePath) {
    final extension = filePath.toLowerCase().split('.').last;
    return ['jpg', 'jpeg', 'png', 'webp'].contains(extension);
  }

  bool isValidDocumentFormat(String filePath) {
    final extension = filePath.toLowerCase().split('.').last;
    return ['pdf', 'jpg', 'jpeg', 'png'].contains(extension);
  }

  // Dosya boyutu formatı
  String formatFileSize(int bytes) {
    if (bytes < 1024) {
      return '$bytes B';
    } else if (bytes < 1024 * 1024) {
      return '${(bytes / 1024).toStringAsFixed(1)} KB';
    } else {
      return '${(bytes / 1024 / 1024).toStringAsFixed(1)} MB';
    }
  }
}

// Upload sonuç modeli
class UploadResult {
  final bool success;
  final String message;
  final Map<String, dynamic>? data;
  final int? statusCode;

  UploadResult({
    required this.success,
    required this.message,
    this.data,
    this.statusCode,
  });

  // URL'yi çıkart
  String? get url => data?['url'];
  String? get fileName => data?['fileName'];
  int? get size => data?['size'];
} 