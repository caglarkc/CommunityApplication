const express = require('express');
const router = express.Router();
const communityCreateController = require('../controllers/community-create.controller');
const asyncHandler = require('../../../../shared/middlewares/errorHandler/asyncHandler');

// 🔥 FIX: Bind methods to preserve 'this' context + asyncHandler for error handling
// 📤 Dosya yükleme ile topluluk oluşturma - multer middleware eklendi
router.post('/create', 
    communityCreateController.getUploadMiddleware(),
    asyncHandler(communityCreateController.createCommunity.bind(communityCreateController))
);

module.exports = router;