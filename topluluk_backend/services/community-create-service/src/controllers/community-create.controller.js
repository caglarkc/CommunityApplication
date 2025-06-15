const communityCreateService = require('../services/community-create.service');
const { logger } = require('../../../../shared/utils/logger');
const multer = require('multer');

// Multer konfigürasyonu - memory storage kullan
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
        // Dosya türü kontrolü
        const allowedTypes = {
            'presidentDocument': ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'],
            'communityLogo': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
            'coverPhoto': ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
        };

        const fieldAllowedTypes = allowedTypes[file.fieldname];
        if (fieldAllowedTypes && fieldAllowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`${file.fieldname} for unsupported file type: ${file.mimetype}`), false);
        }
    }
});

class CommunityCreateController {
    constructor() {
        // 🔥 FIX: Ensure service is properly imported and assigned
        if (!communityCreateService) {
            throw new Error('Community Create Service not properly imported');
        }
        this.communityCreateService = communityCreateService;
    }

    // Multer middleware'ini döndüren metod
    getUploadMiddleware() {
        return upload.fields([
            { name: 'presidentDocument', maxCount: 1 },
            { name: 'communityLogo', maxCount: 1 },
            { name: 'coverPhoto', maxCount: 1 }
        ]);
    }

    async createCommunity(req, res, next) {
        try {
            logger.info('Create community request received', { 
                body: { 
                    name: req.body.name,
                    description: req.body.description,
                    universityName: req.body.universityName,
                    universityDepartment: req.body.universityDepartment,
                    leaderId: req.body.leaderId
                },
                files: {
                    presidentDocument: req.files?.presidentDocument ? 1 : 0,
                    communityLogo: req.files?.communityLogo ? 1 : 0,
                    coverPhoto: req.files?.coverPhoto ? 1 : 0
                },
                requestId: req.requestId
            });

            const { name, description, universityName, universityDepartment, leaderId} = req.body;

            // Temel alan kontrolü
            if (!name || !leaderId || !universityName || !universityDepartment || !description ) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Eksik gerekli alanlar (name, leaderId, universityName, universityDepartment, description)' 
                });
            }

            // Dosya kontrolü
            if (!req.files || !req.files.presidentDocument || !req.files.communityLogo) {
                return res.status(400).json({ 
                    success: false,
                    message: 'Başkan belgesi ve topluluk logosu zorunludur' 
                });
            }

            // Service'e body ve files'ı gönder
            const result = await this.communityCreateService.createCommunity(req.body, req.files);

            // Service'den gelen result handleSuccess ile wrap edilmiş format
            logger.info('Community created successfully with files', { 
                communityId: result.data._id || 'unknown',
                name: result.data.name,
                description: result.data.description,
                universityName: result.data.universityName,
                universityDepartment: result.data.universityDepartment,
                leaderId: result.data.leaderId,
                filesUploaded: {
                    presidentDocument: !!result.data.presidentDocumentUrl,
                    communityLogo: !!result.data.logoUrl,
                    coverPhoto: !!result.data.coverPhotoUrl
                },
                requestId: req.requestId 
            });

            return res.status(201).json(result);
        } catch (error) {
            next(error);
        }
    }

    
}

module.exports = new CommunityCreateController();