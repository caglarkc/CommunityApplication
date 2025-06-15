const sharp = require('sharp');
const crypto = require('crypto');
const { logger } = require('../../../../shared/utils/logger');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const { admin, bucket } = require('../../config/firebase');
const eventSubscriber = require('../../../../shared/services/event/eventSubscriber');

class UploadService {
  constructor() {
    this.bucket = bucket;
  }

  /**
   * 🔥 Ana Firebase upload metodu
   * @param {string} uploaderId - Dosyayı yükleyen kullanıcının ID'si
   * @param {string} communityId - Topluluk ID'si
   * @param {Array} files - Yüklenecek dosyalar
   * @param {string} category - Dosya kategorisi
   * @returns {Array} Yüklenen dosyaların bilgileri
   */
  async uploadToFirebase(uploaderId, communityId, files, category) {
    try {
      const uploadPromises = files.map(file => this.uploadSingleFile(uploaderId, communityId, file, category));
      const results = await Promise.all(uploadPromises);
      
      logger.info('All files uploaded to Firebase successfully', {
        uploaderId,
        communityId,
        category,
        fileCount: results.length
      });
      
      return results;
    } catch (error) {
      logger.error('Firebase upload error', {
        error: error.message,
        uploaderId,
        communityId,
        category
      });
      throw error;
    }
  }

  /**
   * 📁 Tek dosya yükleme
   */
  async uploadSingleFile(uploaderId, communityId, file, category) {
    try {
      logger.info('🚀 Upload process started', {
        uploaderId,
        communityId,
        category,
        originalName: file?.originalname,
        mimeType: file?.mimetype,
        size: file?.size,
        hasBuffer: !!file?.buffer,
        bufferType: file?.buffer ? (Array.isArray(file.buffer.data) ? 'array' : 'direct') : 'none'
      });

      // 🔧 EventBus'dan gelen dosya objesini düzelt
      if (file.buffer && Array.isArray(file.buffer.data)) {
        logger.info('🔧 Converting buffer from array to Buffer object');
        // Buffer array formatından Buffer objesine çevir
        file.buffer = Buffer.from(file.buffer.data);
        // Dosya boyutunu güncelle
        file.size = file.buffer.length;
        logger.info('✅ Buffer converted successfully', { newSize: file.size });
      }
      
      // Dosya validasyonu
      logger.info('🔍 Starting file validation');
      this.validateFile(file);
      logger.info('✅ File validation passed');

      // 14 haneli unique ID oluştur
      const fileId = this.generateFileId(communityId, uploaderId);
      logger.info('🆔 Generated file ID', { fileId });
      
      // Dosya uzantısını al
      const fileExtension = this.getFileExtension(file.originalname);
      logger.info('📎 File extension detected', { fileExtension });
      
      // Firebase Storage path: communityId/category/fileId.ext
      const fileName = `${communityId}/${category}/${fileId}.${fileExtension}`;
      logger.info('📁 Firebase file path created', { fileName });
      
      let processedBuffer = file.buffer;
      
      // Eğer resim ise, Sharp ile optimize et
      if (file.mimetype.startsWith('image/')) {
        logger.info('🖼️ Starting image optimization');
        processedBuffer = await this.optimizeImage(file.buffer, file.mimetype);
        logger.info('✅ Image optimization completed', { 
          originalSize: file.buffer.length, 
          optimizedSize: processedBuffer.length 
        });
      } else {
        logger.info('📄 No optimization needed for non-image file');
      }

      // Firebase'e yükle
      logger.info('🔥 Starting Firebase upload', { fileName, bufferSize: processedBuffer.length });
      const firebaseFile = this.bucket.file(fileName);
      
      await firebaseFile.save(processedBuffer, {
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.originalname,
            uploaderId: uploaderId,
            communityId: communityId,
            category: category,
            uploadedAt: new Date().toISOString()
          }
        }
      });
      logger.info('✅ Firebase upload completed successfully');

      // Public URL al
      logger.info('🔗 Generating signed URL');
      const [url] = await firebaseFile.getSignedUrl({
        action: 'read',
        expires: '03-09-2491' // Uzun vadeli URL
      });
      logger.info('✅ Signed URL generated', { url: url.substring(0, 100) + '...' });

      const result = {
        fileName: fileName,
        originalName: file.originalname,
        url: url,
        size: processedBuffer.length,
        mimeType: file.mimetype,
        uploaderId: uploaderId,
        communityId: communityId,
        category: category,
        uploadedAt: new Date().toISOString()
      };

      logger.info('🎉 Upload completed successfully', {
        fileName: result.fileName,
        originalName: result.originalName,
        size: result.size,
        category: result.category,
        hasUrl: !!result.url
      });

      return result;

    } catch (error) {
      logger.error('❌ Single file upload error', {
        error: error.message,
        stack: error.stack,
        fileName: file?.originalname || 'unknown',
        uploaderId,
        communityId,
        category,
        errorType: error.constructor.name
      });
      throw error;
    }
  }

  /**
   * 📂 Kategoriye göre dosyaları getir
   */
  async getFilesByCategory(communityId, category) {
    try {
      const [files] = await this.bucket.getFiles({
        prefix: `${communityId}/${category}/`
      });

      const fileInfos = await Promise.all(
        files.map(async (file) => {
          try {
            const [metadata] = await file.getMetadata();
            const [url] = await file.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            });

            return {
              fileName: file.name,
              originalName: metadata.metadata?.originalName || 'unknown',
              url: url,
              size: metadata.size,
              mimeType: metadata.contentType,
              uploaderId: metadata.metadata?.uploaderId,
              communityId: metadata.metadata?.communityId,
              category: metadata.metadata?.category,
              uploadedAt: metadata.metadata?.uploadedAt || metadata.timeCreated
            };
          } catch (error) {
            logger.error('Error getting file metadata', {
              fileName: file.name,
              error: error.message
            });
            return null;
          }
        })
      );

      // Null değerleri filtrele
      return fileInfos.filter(file => file !== null);

    } catch (error) {
      logger.error('Get files by category error', {
        error: error.message,
        communityId,
        category
      });
      throw error;
    }
  }

  /**
   * 🗑️ Dosya sil
   */
  async deleteFile(communityId, fileName) {
    try {
      // Güvenlik kontrolü - dosya adı community ID ile başlamalı
      if (!fileName.startsWith(communityId)) {
        throw new ValidationError('Bu dosyayı silme yetkiniz yok');
      }

      const file = this.bucket.file(fileName);
      
      // Dosya var mı kontrol et
      const [exists] = await file.exists();
      if (!exists) {
        throw new ValidationError('Dosya bulunamadı');
      }

      // Dosyayı sil
      await file.delete();
      
      logger.info('File deleted successfully', {
        fileName,
        communityId
      });
      
      return true;
    } catch (error) {
      logger.error('Delete file error', {
        error: error.message,
        fileName,
        communityId
      });
      throw error;
    }
  }

  /**
   * ✅ Dosya validasyonu
   */
  validateFile(file) {
    if (!file) {
      throw new ValidationError('Dosya seçilmedi');
    }

    // 🔧 EventBus'dan gelen dosya objesini düzelt
    if (file.buffer && Array.isArray(file.buffer.data)) {
      file.buffer = Buffer.from(file.buffer.data);
      file.size = file.buffer.length;
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new ValidationError('Dosya boş');
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB
      throw new ValidationError('Dosya boyutu çok büyük (max 10MB)');
    }

    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'application/pdf'
    ];

    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new ValidationError('Desteklenmeyen dosya türü');
    }
  }

  /**
   * 🖼️ Resim optimizasyonu
   */
  async optimizeImage(buffer, mimeType) {
    try {
      logger.info('🖼️ Starting image optimization with Sharp', { 
        bufferSize: buffer?.length,
        mimeType,
        bufferType: buffer?.constructor?.name
      });

      if (!buffer || buffer.length === 0) {
        throw new Error('Buffer is empty or undefined');
      }

      let sharpInstance = sharp(buffer);
      
      // Resim boyutunu kontrol et
      const metadata = await sharpInstance.metadata();
      logger.info('📐 Image metadata retrieved', { 
        width: metadata.width, 
        height: metadata.height,
        format: metadata.format
      });
      
      // Çok büyükse boyutunu küçült
      if (metadata.width > 1920 || metadata.height > 1080) {
        logger.info('📏 Resizing image');
        sharpInstance = sharpInstance.resize(1920, 1080, { 
          fit: 'inside',
          withoutEnlargement: true 
        });
      }
      
      // Format'a göre optimize et
      let optimizedBuffer;
      if (mimeType === 'image/png') {
        logger.info('🖼️ Optimizing as PNG');
        optimizedBuffer = await sharpInstance.png({ quality: 85 }).toBuffer();
      } else if (mimeType === 'image/webp') {
        logger.info('🖼️ Optimizing as WebP');
        optimizedBuffer = await sharpInstance.webp({ quality: 85 }).toBuffer();
      } else {
        logger.info('🖼️ Optimizing as JPEG');
        optimizedBuffer = await sharpInstance.jpeg({ quality: 85 }).toBuffer();
      }

      logger.info('✅ Image optimization completed', {
        originalSize: buffer.length,
        optimizedSize: optimizedBuffer.length,
        compressionRatio: ((buffer.length - optimizedBuffer.length) / buffer.length * 100).toFixed(2) + '%'
      });

      return optimizedBuffer;
    } catch (error) {
      logger.error('❌ Image optimization error', { 
        error: error.message,
        stack: error.stack,
        mimeType,
        bufferSize: buffer?.length,
        bufferType: buffer?.constructor?.name
      });
      // Optimize edilemezse orijinal buffer'ı döndür
      logger.warn('⚠️ Returning original buffer due to optimization failure');
      return buffer;
    }
  }

  /**
   * 🆔 14 haneli file ID oluştur
   * Format: communityId_4 + uploaderId_4 + timestamp_6
   */
  generateFileId(communityId, uploaderId) {
    const communityHash = crypto.createHash('md5').update(communityId).digest('hex').substring(0, 4);
    const uploaderHash = crypto.createHash('md5').update(uploaderId).digest('hex').substring(0, 4);
    const timestamp = Date.now().toString().slice(-6);
    
    return `${communityHash}${uploaderHash}${timestamp}`;
  }

  /**
   * 📝 Dosya uzantısını al
   */
  getFileExtension(fileName) {
    return fileName.split('.').pop().toLowerCase();
  }

  async initializeEventListeners() {
    try {
      const queueNamePrefix = 'upload-service.queue';
      
      // 📤 Tek dosya yükleme
      await eventSubscriber.respondTo('upload.uploadSingleFile', async (payload, metadata) => {
        logger.info('Received uploadSingleFile request', { 
          uploaderId: payload.uploaderId,
          communityId: payload.communityId,
          category: payload.category,
          fileName: payload.file?.originalname,
          fileSize: payload.file?.size,
          bufferType: payload.file?.buffer ? (Array.isArray(payload.file.buffer.data) ? 'array' : 'buffer') : 'none',
          replyTo: payload.replyTo 
        });

        try {
          const file = await this.uploadSingleFile(payload.uploaderId, payload.communityId, payload.file, payload.category);

          logger.info('📤 Upload service response prepared', {
            success: true,
            hasFileData: !!file,
            fileName: file?.fileName,
            hasUrl: !!file?.url
          });

          return {
            success: true,
            message: 'File uploaded successfully',
            data: file
          };
        } catch (error) {
          logger.error('❌ Upload service error in event handler', {
            error: error.message,
            stack: error.stack,
            uploaderId: payload.uploaderId,
            communityId: payload.communityId,
            category: payload.category
          });

          return {
            success: false,
            message: 'File upload failed',
            error: error.message
          };
        }
      });

      // 📤📤 Çoklu dosya yükleme
      await eventSubscriber.respondTo('upload.uploadToFirebase', async (payload, metadata) => {
        logger.info('Received uploadToFirebase request', { 
          uploaderId: payload.uploaderId,
          communityId: payload.communityId,
          category: payload.category,
          fileCount: payload.files?.length || 0,
          replyTo: payload.replyTo 
        });

        const files = await this.uploadToFirebase(payload.uploaderId, payload.communityId, payload.files, payload.category);

        return {
          success: true,
          message: 'Files uploaded successfully',
          data: files
        };
      });

      // 📂 Kategoriye göre dosyaları getir
      await eventSubscriber.respondTo('upload.getFilesByCategory', async (payload, metadata) => {
        logger.info('Received getFilesByCategory request', { 
          payload,
          metadata,
          replyTo: payload.replyTo 
        });

        const files = await this.getFilesByCategory(payload.communityId, payload.category);

        return {
          success: true,
          message: 'Files retrieved successfully',
          data: files
        };
      });

      // 🗑️ Dosya sil
      await eventSubscriber.respondTo('upload.deleteFile', async (payload, metadata) => {
        logger.info('Received deleteFile request', { 
          payload,
          metadata,
          replyTo: payload.replyTo 
        });

        const result = await this.deleteFile(payload.communityId, payload.fileName);

        return {
          success: true,
          message: 'File deleted successfully',
          data: { deleted: result }
        };
      });

      logger.info('Upload service event listeners initialized successfully');
        
    } catch (error) {
      logger.error('Failed to initialize event listeners', { error: error.message, stack: error.stack });
    }
  }
}

module.exports = new UploadService(); 