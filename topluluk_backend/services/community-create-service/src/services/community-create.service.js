const Community = require('../models/community.model');
const { logger } = require('../../../../shared/utils/logger');
const { validateCommunityData } = require('../utils/validationUtils');
const eventSubscriber = require('../../../../shared/services/event/eventSubscriber');
const eventPublisher = require('../../../../shared/services/event/eventPublisher');
const { handleError, handleErrorWithType, handleSuccess } = require('../../../../shared/utils/eventErrorHelper');


class CommunityService {

    
    async createCommunity(communityData, files) {
        try {
            validateCommunityData(communityData);

            // 📋 Dosya validasyonları
            if (!files || !files.presidentDocument || !files.communityLogo) {
                throw new Error('Başkan belgesi ve topluluk logosu zorunludur');
            }

            logger.info('Creating community with files', { 
                communityData,
                fileCount: {
                    presidentDocument: files.presidentDocument ? 1 : 0,
                    communityLogo: files.communityLogo ? 1 : 0,
                    coverPhoto: files.coverPhoto ? 1 : 0
                }
            });

            logger.info('Getting leader details from auth-service', { leaderId: communityData.leaderId });

            const requestData = {
                userId: communityData.leaderId.toString(),
                timestamp: new Date().toISOString()
            };

            const response = await eventPublisher.request('user.auth.getMe', requestData, {
                timeout: 10000
            });

            if (!response.success) {
                return handleErrorWithType(response, communityData.leaderId, "Kullanıcı detayları alınamadı");
            } 

            // Topluluk oluştur
            const community = await Community.create(communityData);
            const communityId = community._id.toString();

            // 📤 Dosyaları upload service'e gönder
            const uploadPromises = [];

            // Başkan belgesi yükle (zorunlu)
            if (files.presidentDocument) {
                logger.info('Sending president document to upload service', {
                    fileName: files.presidentDocument[0].originalname,
                    fileSize: files.presidentDocument[0].size,
                    mimeType: files.presidentDocument[0].mimetype,
                    bufferLength: files.presidentDocument[0].buffer?.length
                });
                
                const presidentDocUpload = eventPublisher.request('upload.uploadSingleFile', {
                    uploaderId: communityData.leaderId.toString(),
                    communityId: communityId,
                    file: files.presidentDocument[0], // Multer array olarak gelir
                    category: 'president-documents'
                }, { timeout: 30000 });
                uploadPromises.push(presidentDocUpload);
            }

            // Topluluk logosu yükle (zorunlu)
            if (files.communityLogo) {
                logger.info('Sending community logo to upload service', {
                    fileName: files.communityLogo[0].originalname,
                    fileSize: files.communityLogo[0].size,
                    mimeType: files.communityLogo[0].mimetype,
                    bufferLength: files.communityLogo[0].buffer?.length
                });
                
                const logoUpload = eventPublisher.request('upload.uploadSingleFile', {
                    uploaderId: communityData.leaderId.toString(),
                    communityId: communityId,
                    file: files.communityLogo[0],
                    category: 'community-logos'
                }, { timeout: 30000 });
                uploadPromises.push(logoUpload);
            }

            // Kapak fotoğrafı yükle (isteğe bağlı)
            if (files.coverPhoto) {
                const coverPhotoUpload = eventPublisher.request('upload.uploadSingleFile', {
                    uploaderId: communityData.leaderId.toString(),
                    communityId: communityId,
                    file: files.coverPhoto[0],
                    category: 'cover-photos'
                }, { timeout: 30000 });
                uploadPromises.push(coverPhotoUpload);
            }

            // Tüm dosya yüklemelerini paralel olarak bekle
            logger.info('⏳ Waiting for all file uploads to complete', { uploadCount: uploadPromises.length });
            const uploadResults = await Promise.allSettled(uploadPromises);
            logger.info('✅ All upload requests completed', { 
                resultCount: uploadResults.length,
                results: uploadResults.map(r => ({
                    status: r.status,
                    success: r.status === 'fulfilled' ? r.value?.success : false,
                    hasData: r.status === 'fulfilled' ? !!r.value?.data : false,
                    hasUrl: r.status === 'fulfilled' ? !!r.value?.data?.url : false,
                    error: r.status === 'rejected' ? r.reason.message : (r.value?.error || null)
                }))
            });

            // Yüklenen dosya URL'lerini topluluk verisine ekle
            const uploadedFiles = {
                presidentDocument: uploadResults[0]?.status === 'fulfilled' ? uploadResults[0].value?.data : null,
                communityLogo: uploadResults[1]?.status === 'fulfilled' ? uploadResults[1].value?.data : null,
                coverPhoto: files.coverPhoto ? (uploadResults[2]?.status === 'fulfilled' ? uploadResults[2].value?.data : null) : null
            };

            logger.info('📋 Processed upload results', {
                presidentDocumentUrl: uploadedFiles.presidentDocument?.url || 'NOT_UPLOADED',
                logoUrl: uploadedFiles.communityLogo?.url || 'NOT_UPLOADED',
                coverPhotoUrl: uploadedFiles.coverPhoto?.url || 'NOT_UPLOADED',
                uploadedFiles: uploadedFiles
            });

            // Check for upload failures
            const failedUploads = [];
            if (!uploadedFiles.presidentDocument?.url) failedUploads.push('presidentDocument');
            if (!uploadedFiles.communityLogo?.url) failedUploads.push('communityLogo');

            if (failedUploads.length > 0) {
                logger.warn('⚠️ Some files failed to upload', { failedUploads });
            }

            // Topluluk verisini dosya URL'leri ile güncelle
            logger.info('💾 Updating community with file URLs', {
                communityId,
                presidentDocumentUrl: uploadedFiles.presidentDocument?.url,
                logoUrl: uploadedFiles.communityLogo?.url,
                coverPhotoUrl: uploadedFiles.coverPhoto?.url
            });

            const updateResult = await Community.findByIdAndUpdate(communityId, {
                presidentDocumentUrl: uploadedFiles.presidentDocument?.url,
                logoUrl: uploadedFiles.communityLogo?.url,
                coverPhotoUrl: uploadedFiles.coverPhoto?.url
            });

            logger.info('✅ Community updated successfully', { 
                updated: !!updateResult,
                communityId: updateResult?._id 
            });

            const requestData2 = {
                communityId: communityId,
                userId: communityData.leaderId.toString(),
                timestamp: new Date().toISOString()
            };

            const response2 = await eventPublisher.request('user.auth.addCommunityToLeader', requestData2, {
                timeout: 10000
            });

            if (!response2.success) {
                return handleErrorWithType(response2, communityData.leaderId, "Topluluk liderine bilgileri ekleme işlemi başarısız");
            }

            // Güncellenmiş topluluk verisini al
            const updatedCommunity = await Community.findById(communityId);
            
            logger.info('Community created successfully with files', { 
                communityId: community._id,
                name: community.name,
                uploadedFiles: {
                    presidentDocument: !!uploadedFiles.presidentDocument,
                    communityLogo: !!uploadedFiles.communityLogo,
                    coverPhoto: !!uploadedFiles.coverPhoto
                }
            });
            
            // Success message'ı upload durumuna göre ayarla
            let successMessage = "Topluluk başarıyla oluşturuldu";
            if (failedUploads.length === 0) {
                successMessage = "Topluluk ve tüm dosyalar başarıyla oluşturuldu";
            } else if (failedUploads.length < 3) {
                successMessage = `Topluluk oluşturuldu, ancak bazı dosyalar yüklenemedi: ${failedUploads.join(', ')}`;
            } else {
                successMessage = "Topluluk oluşturuldu, ancak dosyalar yüklenemedi";
            }

            return handleSuccess(updatedCommunity, successMessage);
        } catch (error) {
            logger.error('Error creating community', { 
                error: error.message, 
                communityData: communityData?.name || 'unknown' 
            });
            throw error; // Service layer'da throw kullan, next değil
        }
    }

    async getCommunity(communityId) {
        const community = await Community.findById(communityId);
        return community;
    }

    

    /**
     * 🔥 FIX: Event listener'ları başlat
     */
    async initializeEventListeners() {
        try {
            logger.info('Community Create Service: Event listeners initialized');
            // TODO: Event listeners buraya eklenecek

            const queueNamePrefix = 'community-create-service.queue';

            await eventSubscriber.respondTo('community.create.getCommunity', async (payload, metadata) => {
                logger.info('Received getCommunity request from community-create-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const community = await Community.findById(payload.communityId);
                if(!community) {
                    return {
                        success: false,
                        message: "Topluluk bulunamadı",
                        error: "NotFoundError",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }

                logger.info('Community found successfully', { 
                    communityId: community._id,
                    name: community.name 
                });

                return {
                    success: true,
                    message: "Topluluk başarıyla alındı",
                    receivedData: payload,
                    timestamp: new Date().toISOString(),
                    community: community
                };
            });

        } catch (error) {
            logger.error('Community Create Service: Failed to initialize event listeners', {
                error: error.message
            });
            throw error;
        }
    }
    

    /*
    async getMe(adminId) {
        try {
            logger.info('Getting admin details from admin-auth service', { adminId });

            // Admin-auth servisine istek gönder
            const requestData = {
                adminId: adminId.toString(),
                timestamp: new Date().toISOString()
            };

            // Admin-auth servisine istek gönder
            const response = await eventPublisher.request('admin.auth.getMe', requestData, {
                timeout: 10000
            });
            
            if (!response.success) {
                this._handleErrorWithType(response, adminId, "Admin detayları alınamadı");
            } 

            return this._handleSuccess('Received admin details from admin-auth service',successMessages.SEARCH.ADMIN_FOUND, response.admin);
        } catch (error) {
            this._handleError(error, "Admin detayları alınamadı");
        }
    }
    */
}

module.exports = new CommunityService(); 