const uploadService = require('../services/upload.service');
const { logger } = require('../../../../shared/utils/logger');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');

class UploadController {
  
  /**
   * 🖼️ Upload images (PNG, JPG, JPEG, WebP)
   */
  async uploadImages(req, res, next) {
    try {
      const { uploaderId, communityId, category } = req.body;
      const files = req.files;

      // Validation
      if (!uploaderId) {
        throw new ValidationError('Uploader ID gerekli');
      }
      if (!communityId) {
        throw new ValidationError('Community ID gerekli');
      }
      if (!category) {
        throw new ValidationError('Category gerekli');
      }
      if (!files || files.length === 0) {
        throw new ValidationError('Resim dosyası seçilmedi');
      }

      // Validate file types - only images
      for (const file of files) {
        if (!file.mimetype.startsWith('image/')) {
          throw new ValidationError(`Sadece resim dosyaları kabul edilir: ${file.originalname}`);
        }
      }

      logger.info('Image upload started', {
        uploaderId,
        communityId,
        category,
        fileCount: files.length,
        requestId: req.requestId
      });

      // Upload to Firebase
      const results = await uploadService.uploadToFirebase(uploaderId, communityId, files, category);

      logger.info('Images uploaded successfully', {
        uploaderId,
        communityId,
        category,
        imageCount: results.length,
        requestId: req.requestId
      });

      return res.status(200).json({
        success: true,
        message: `${results.length} resim başarıyla yüklendi`,
        data: {
          uploaderId,
          communityId,
          category,
          files: results,
          count: results.length
        }
      });

    } catch (error) {
      logger.error('Image upload error', {
        error: error.message,
        uploaderId: req.body?.uploaderId,
        communityId: req.body?.communityId,
        requestId: req.requestId
      });
      next(error);
    }
  }

  /**
   * 📄 Upload PDF documents
   */
  async uploadPdf(req, res, next) {
    try {
      const { uploaderId, communityId, category } = req.body;
      const files = req.files;

      // Validation
      if (!uploaderId) {
        throw new ValidationError('Uploader ID gerekli');
      }
      if (!communityId) {
        throw new ValidationError('Community ID gerekli');
      }
      if (!category) {
        throw new ValidationError('Category gerekli');
      }
      if (!files || files.length === 0) {
        throw new ValidationError('PDF dosyası seçilmedi');
      }

      // Validate file types - only PDFs
      for (const file of files) {
        if (file.mimetype !== 'application/pdf') {
          throw new ValidationError(`Sadece PDF dosyaları kabul edilir: ${file.originalname}`);
        }
      }

      logger.info('PDF upload started', {
        uploaderId,
        communityId,
        category,
        fileCount: files.length,
        requestId: req.requestId
      });

      // Upload to Firebase
      const results = await uploadService.uploadToFirebase(uploaderId, communityId, files, category);

      logger.info('PDFs uploaded successfully', {
        uploaderId,
        communityId,
        category,
        fileCount: results.length,
        requestId: req.requestId
      });

      return res.status(200).json({
        success: true,
        message: `${results.length} PDF başarıyla yüklendi`,
        data: {
          uploaderId,
          communityId,
          category,
          files: results,
          count: results.length
        }
      });

    } catch (error) {
      logger.error('PDF upload error', {
        error: error.message,
        uploaderId: req.body?.uploaderId,
        communityId: req.body?.communityId,
        requestId: req.requestId
      });
      next(error);
    }
  }

  /**
   * 📂 Get files by community and category
   */
  async getFiles(req, res, next) {
    try {
      const { communityId, category } = req.body;

      // Validation
      if (!communityId) {
        throw new ValidationError('Community ID gerekli');
      }
      if (!category) {
        throw new ValidationError('Category gerekli');
      }

      logger.info('Get files started', {
        communityId,
        category,
        requestId: req.requestId
      });

      // Get files from Firebase
      const files = await uploadService.getFilesByCategory(communityId, category);

      return res.status(200).json({
        success: true,
        message: 'Dosyalar başarıyla getirildi',
        data: {
          communityId,
          category,
          files: files || [],
          count: files ? files.length : 0
        }
      });

    } catch (error) {
      logger.error('Get files error', {
        error: error.message,
        communityId: req.body?.communityId,
        category: req.body?.category,
        requestId: req.requestId
      });
      next(error);
    }
  }

  /**
   * 🗑️ Delete file
   */
  async deleteFile(req, res, next) {
    try {
      const { uploaderId, communityId, fileName } = req.body;

      // Validation
      if (!uploaderId) {
        throw new ValidationError('Uploader ID gerekli');
      }
      if (!communityId) {
        throw new ValidationError('Community ID gerekli');
      }
      if (!fileName) {
        throw new ValidationError('Dosya adı gerekli');
      }

      logger.info('File deletion started', {
        uploaderId,
        communityId,
        fileName,
        requestId: req.requestId
      });

      // Delete from Firebase
      const deleted = await uploadService.deleteFile(communityId, fileName);

      if (deleted) {
        logger.info('File deleted successfully', {
          uploaderId,
          communityId,
          fileName,
          requestId: req.requestId
        });

        return res.status(200).json({
          success: true,
          message: 'Dosya başarıyla silindi',
          data: {
            uploaderId,
            communityId,
            fileName
          }
        });
      } else {
        throw new Error('Dosya silinemedi');
      }

    } catch (error) {
      logger.error('File deletion error', {
        error: error.message,
        uploaderId: req.body?.uploaderId,
        communityId: req.body?.communityId,
        fileName: req.body?.fileName,
        requestId: req.requestId
      });
      next(error);
    }
  }
}

module.exports = new UploadController(); 