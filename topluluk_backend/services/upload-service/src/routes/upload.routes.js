const express = require('express');
const multer = require('multer');
const router = express.Router();
const uploadController = require('../controllers/upload.controller');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 10 // Max 10 files at once
  },
  fileFilter: (req, file, cb) => {
    // Allow images and PDFs
    const allowedMimeTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'application/pdf'
    ];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Desteklenmeyen dosya türü. Sadece JPEG, PNG, WebP ve PDF desteklenir'), false);
    }
  }
});

/**
 * @swagger
 * tags:
 *   name: Upload Service
 *   description: Simple file upload service for images and PDFs
 */

/**
 * @swagger
 * /api/v1/upload/images:
 *   post:
 *     summary: Upload image files (PNG, JPG, JPEG, WebP)
 *     tags: [Upload Service]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               uploaderId:
 *                 type: string
 *                 description: ID of user uploading files
 *               communityId:
 *                 type: string
 *                 description: Community ID
 *               category:
 *                 type: string
 *                 description: File category (event-photos, banners, logos, etc.)
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files to upload
 *     responses:
 *       200:
 *         description: Images uploaded successfully
 *       400:
 *         description: Invalid input or file type
 */
router.post('/images',
  upload.array('files', 10),
  asyncHandler(uploadController.uploadImages.bind(uploadController))
);

/**
 * @swagger
 * /api/v1/upload/pdf:
 *   post:
 *     summary: Upload PDF documents
 *     tags: [Upload Service]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               uploaderId:
 *                 type: string
 *                 description: ID of user uploading files
 *               communityId:
 *                 type: string
 *                 description: Community ID
 *               category:
 *                 type: string
 *                 description: File category (documents, certificates, etc.)
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: PDF files to upload
 *     responses:
 *       200:
 *         description: PDFs uploaded successfully
 *       400:
 *         description: Invalid input or file type
 */
router.post('/pdf',
  upload.array('files', 10),
  asyncHandler(uploadController.uploadPdf.bind(uploadController))
);

/**
 * @swagger
 * /api/v1/upload/get-files:
 *   post:
 *     summary: Get files by community and category
 *     tags: [Upload Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               communityId:
 *                 type: string
 *                 description: Community ID
 *               category:
 *                 type: string
 *                 description: File category to retrieve
 *     responses:
 *       200:
 *         description: Files retrieved successfully
 *       400:
 *         description: Invalid parameters
 */
router.post('/get-files',
  asyncHandler(uploadController.getFiles.bind(uploadController))
);

/**
 * @swagger
 * /api/v1/upload/delete-file:
 *   delete:
 *     summary: Delete a file
 *     tags: [Upload Service]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               uploaderId:
 *                 type: string
 *                 description: ID of user deleting file
 *               communityId:
 *                 type: string
 *                 description: Community ID
 *               fileName:
 *                 type: string
 *                 description: Name of file to delete
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: Invalid parameters
 */
router.delete('/delete-file',
  asyncHandler(uploadController.deleteFile.bind(uploadController))
);

module.exports = router; 