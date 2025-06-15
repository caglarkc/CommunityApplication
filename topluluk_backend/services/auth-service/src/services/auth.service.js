const User = require('../models/user.model');
const Community = require('../models/community.model');
const nodemailer = require('nodemailer');
const { logger } = require('../../../../shared/utils/logger');
const { validateRegister , validateLeaderRegister } = require('../utils/validationUtils');
const { generateCode , hashCode , verifyHashedCode , hashPassword , verifyPassword } = require('../../../../shared/utils/helpers');
const { NOW, FORMAT_EXPIRES_AT } = require('../../../../shared/utils/constants/time');
const errorMessages = require('../../../../shared/config/errorMessages');
const ConflictError = require('../../../../shared/utils/errors/ConflictError');
const ForbiddenError = require('../../../../shared/utils/errors/ForbiddenError');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const NotFoundError = require('../../../../shared/utils/errors/NotFoundError');
const successMessages = require('../../../../shared/config/successMessages');
const { getRedisClient } = require('../utils/database');
const eventSubscriber = require('../../../../shared/services/event/eventSubscriber');
const eventPublisher = require('../../../../shared/services/event/eventPublisher');

// 🔥 FIXED: Only import services for orchestration
const sessionService = require('../../../../shared/services/session.service');
const deviceService = require('../../../../shared/services/device.service');
const tokenUtils = require('../../../../shared/utils/tokenUtils');
const { v4: uuidv4 } = require('uuid'); // Login için gerekli

const dotenv = require('dotenv');
dotenv.config();



// Kullanıcı bilgilerini filtreleme yardımcı metodu
const _formatUserResponse = (user) => {
    return {
        id: user._id,
        name: user.name,
        surname: user.surname,
        email: user.email,
        phone: user.phone,
        status: user.status,
        communities: user.communities,
        leaderCommunityId: user.leaderCommunityId
    };
};

class AuthService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            secure: false,
            port: 587,
            tls: {
                rejectUnauthorized: true
            }
        });

        
    }

    async registerUser(userData) {
        try {
            validateRegister(userData);

            const existingEmail = await User.findOne({ email: userData.email });
            const existingPhone = await User.findOne({ phone: userData.phone });

            if (existingEmail) {
                logger.warn('Email already exists', { email: userData.email });
                throw new ConflictError(errorMessages.CONFLICT.EMAIL_ALREADY_EXISTS);
            }
    
            if (existingPhone) {
                logger.warn('Phone already exists', { phone: userData.phone });
                throw new ConflictError(errorMessages.CONFLICT.PHONE_ALREADY_EXISTS);
            }

            const user = await this.createUser(userData);

            logger.info('User created successfully', { userId: user._id });

            return {
                message: successMessages.AUTH.USER_CREATED,
                user: _formatUserResponse(user)
            };

        } catch (error) {
            throw error;
        }
    }

    async createUser(userData) {
        try {
            
            const { name, surname, email, phone, password, universityName, universityDepartment, classYear, status } = userData;
            const hashedPassword = await hashPassword(password);
            
            logger.info('Password hashed successfully');
            
            const user = new User({ 
                name, 
                surname, 
                email, 
                phone, 
                password: hashedPassword,
                universityName,
                universityDepartment,
                classYear,
                status
            });

            logger.info('User model created, saving to database...');
            await user.save();
            logger.info('User saved to database successfully');
            
            return user;
        } catch (error) {
            throw error;
        }
    }

    async loginUser(userData, deviceInfo, ipAddress) {
        try {
            const { email, phone, password } = userData;
            
            // Basic validation
            if (!email && !phone) {
                throw new ValidationError(errorMessages.INVALID.EMPTY_DATA);
            }

            if (!deviceInfo) {
                throw new ValidationError('Device information is required');
            }

            // Find user
            const user = await User.findOne({
                $or: [{ email }, { phone }]
            });

            if (!user) {
                throw new NotFoundError(errorMessages.NOT_FOUND.USER_NOT_FOUND);
            }

            // Verify password
            const isPasswordValid = await verifyPassword(password, user.password);
            if (!isPasswordValid) {
                throw new ValidationError(errorMessages.INVALID.INVALID_CREDENTIALS);
            }

            // 🔥 USER STATUS VALIDATION: Only verified users can login
            if (user.isVerified === 'blocked') {
                logger.warn('Login attempt by blocked user', { userId: user._id, email: userData.email });
                throw new ForbiddenError('Hesabınız bloke edilmiş, lütfen destek ile iletişime geçin');
            }

            if (user.isVerified === 'deleted') {
                logger.warn('Login attempt by deleted user', { userId: user._id, email: userData.email });
                throw new ForbiddenError('Hesabınız silinmiş, lütfen destek ile iletişime geçin');
            }

            if (user.isVerified === 'notVerified') {
                logger.warn('Login attempt by unverified user', { userId: user._id, email: userData.email });
                throw new ForbiddenError('Hesabınızı doğrulamanız gerekiyor, lütfen e-posta adresinizi kontrol edin');
            }

            if (user.isVerified !== 'verified') {
                logger.warn('Login attempt by invalid status user', { 
                    userId: user._id, 
                    email: userData.email, 
                    status: user.isVerified 
                });
                throw new ForbiddenError('Hesap durumunuz geçersiz, lütfen destek ile iletişime geçin');
            }

            if(user.status === 'leader_of_community') {
                if(!user.leaderCommunityId) {
                    logger.warn('Login attempt by leader of community, community not found', { userId: user._id, email: userData.email });
                    
                    const error = new ForbiddenError('Topluluk kayıt işlemi tamamlanmadı, lütfen tamamlayınız');
                    error.details = {
                        userId: user._id,
                        email: userData.email,
                        status: user.status,
                        issue: 'missing_community_id',
                        requiredAction: 'Topluluk oluşturma işlemini tamamlayınız',
                        nextSteps: [
                            'Topluluk oluşturma sayfasına gidin',
                            'Gerekli bilgileri doldurun',
                            'Topluluk oluşturma işlemini tamamlayın'
                        ],
                        timestamp: new Date().toISOString()
                    };
                    throw error;
                }
                
                const requestData = {
                    communityId: user.leaderCommunityId,
                    userId: user._id.toString(),
                    timestamp: new Date().toISOString()
                };
                const response = await eventPublisher.request('community.create.getCommunity', requestData, {
                    timeout: 10000
                });
                if (!response.success) {
                    logger.warn('Login attempt by leader of community, community not found', { userId: user._id, email: userData.email, leaderCommunityId: user.leaderCommunityId });
                    
                    const error = new ForbiddenError('Hesabınızın liderliği olduğu topluluk bulunamadı, lütfen destek ile iletişime geçin');
                    error.details = {
                        userId: user._id,
                        email: userData.email,
                        status: user.status,
                        leaderCommunityId: user.leaderCommunityId,
                        issue: 'community_not_found',
                        requiredAction: 'Destek ekibi ile iletişime geçin',
                        nextSteps: [
                            'Destek sayfasına gidin',
                            'Bu hata koduyla birlikte başvuru oluşturun',
                            'Hesap durumunuzun incelenmesini bekleyin'
                        ],
                        supportCode: `COMM_NOT_FOUND_${user._id}_${Date.now()}`,
                        timestamp: new Date().toISOString()
                    };
                    throw error;
                }
                
            }

            // Generate device fingerprint
            const deviceFingerprint = deviceService.generateDeviceFingerprint(deviceInfo);
            
            // Check if it's a new device
            const deviceCheck = await deviceService.isNewDevice(user._id.toString(), deviceFingerprint);
            
            // Device risk analysis
            const riskAnalysis = deviceService.analyzeDeviceRisk(deviceInfo);
            
            logger.info('Device analysis completed', {
                userId: user._id,
                deviceFingerprint,
                isNewDevice: deviceCheck.isNew,
                riskLevel: riskAnalysis.riskLevel,
                riskScore: riskAnalysis.riskScore
            });

            // Enhanced device info for session
            const enhancedDeviceInfo = {
                fingerprint: deviceFingerprint,
                platform: deviceInfo.platform,
                model: deviceInfo.model,
                version: deviceInfo.version,
                userAgent: deviceInfo.userAgent
            };

            // Generate tokens using tokenUtils
            const tempSessionData = {
                userId: user._id.toString(),
                sessionId: uuidv4(), // Temporary for token generation
                deviceFingerprint
            };
            
            const accessTokenResult = tokenUtils.generateSessionBasedAccessToken(tempSessionData);
            const refreshTokenResult = tokenUtils.generateRefreshToken(tempSessionData);

            // Create or update session with refresh token
            const sessionResult = await sessionService.createOrUpdateSession(
                user._id.toString(),
                enhancedDeviceInfo,
                ipAddress,
                refreshTokenResult.token // 🔥 SECURITY: Refresh token backend'de saklanır
            );

            // Register device if it's new and trusted
            if (deviceCheck.isNew && riskAnalysis.riskLevel !== 'high') {
                await deviceService.registerDevice(user._id.toString(), deviceInfo, ipAddress);
            }

            user.lastLoginAt = NOW();
            user.isLoggedIn = true;
            await user.save();

            logger.info('User logged in successfully', {
                userId: user._id,
                sessionId: sessionResult.sessionId,
                isNewSession: sessionResult.isNewSession,
                isNewDevice: deviceCheck.isNew,
                riskLevel: riskAnalysis.riskLevel
            });

            // 🔥 SECURITY: Sadece access token döndür
            return {
                message: successMessages.AUTH.USER_LOGGED_IN,
                accessToken: accessTokenResult.token,
                tokenType: accessTokenResult.tokenType,
                expiresIn: accessTokenResult.expiresIn
            };

        } catch (error) {
            logger.error('Login error', {
                error: error.message,
                email: userData.email,
                phone: userData.phone
            });
            throw error;
        }
    }

    async logoutUser(userId, reason = 'manual_logout') {
        try {
            // Revoke user session
            const revoked = await sessionService.revokeUserSession(userId, reason);

            if (revoked) {
                logger.info('User logged out successfully', { userId, reason });
                return {
                    message: 'Logged out successfully',
                    success: true
                };
            }

            const user = await User.findById(userId);
            user.isLoggedIn = false;
            await user.save();

            return {
                message: 'Logout failed',
                success: false
            };

        } catch (error) {
            logger.error('Logout error', {
                error: error.message,
                userId
            });
            throw error;
        }
    }

    async getUserSessionInfo(userId) {
        try {
            const session = await sessionService.getUserSession(userId);
            
            if (!session) {
                return null;
            }

            return {
                sessionId: session.sessionId,
                createdAt: session.createdAt,
                lastActivity: session.lastActivity,
                deviceInfo: {
                    platform: session.devicePlatform,
                    model: session.deviceModel,
                    fingerprint: session.deviceFingerprint
                },
                loginCount: session.loginCount,
                isVerified: session.isVerified
            };

        } catch (error) {
            logger.error('Error getting user session info', {
                error: error.message,
                userId
            });
            return null;
        }
    }

    /**
     * 🔥 SECURITY: App startup auth check
     */
    async checkAuthStatus(accessToken, deviceInfo, ipAddress) {
        try {
            // 1. Access token'dan user ID'yi çıkar
            const tokenInfo = tokenUtils.extractTokenInfo(accessToken);
            
            if (!tokenInfo || !tokenInfo.userId) {
                return {
                    isValid: false,
                    reason: 'invalid_token',
                    clearToken: true
                };
            }

            // 2. Token'ın geçerliliğini kontrol et (expire check)
            const tokenValidation = tokenUtils.validateAccessToken(accessToken);
            
            if (!tokenValidation.isValid) {
                return {
                    isValid: false,
                    reason: tokenValidation.reason,
                    expired: tokenValidation.expired,
                    clearToken: true
                };
            }

            // 3. User'ı veritabanından kontrol et
            const user = await User.findById(tokenInfo.userId);

            if (!user) {
                logger.warn('Auth check: User not found', { userId: tokenInfo.userId });
                return {
                    isValid: false,
                    reason: 'user_not_found',
                    clearToken: true
                };
            }
            
            if (user.status === 'leader_of_community') {
                if(!user.leaderCommunityId) {
                    logger.warn('Auth check: User is leader of community, community not found', { userId: tokenInfo.userId });
                    // 🔥 SECURITY: Community not found
                    return {
                        isValid: false,
                        reason: 'community_not_registered',
                        clearToken: true
                    };
                }
                const requestData = {
                    communityId: user.leaderCommunityId,
                    userId: tokenInfo.userId,
                    timestamp: new Date().toISOString()
                };
                const response = await eventPublisher.request('community.create.getCommunity', requestData, {
                    timeout: 10000
                });
                if(!response.success) {
                    logger.warn('Auth check: Community not found', { userId: tokenInfo.userId });
                    return {
                        isValid: false,
                        reason: 'community_not_found',
                        clearToken: true
                    };
                }
            }


            // 🔥 FIX: User status kontrolleri - DOĞRU FIELD NAMES
            if (user.isVerified === 'blocked') {
                logger.warn('Auth check: User is blocked', { userId: tokenInfo.userId });
                const revoked = await sessionService.revokeUserSession(tokenInfo.userId, 'user_blocked_auth_check');
                return {
                    isValid: false,
                    reason: 'user_blocked',
                    clearToken: true
                };
            }

            if (user.isVerified === 'deleted') {
                logger.warn('Auth check: User is deleted', { userId: tokenInfo.userId });
                const revoked = await sessionService.revokeUserSession(tokenInfo.userId, 'user_deleted_auth_check');
                return {
                    isValid: false,
                    reason: 'user_deleted',
                    clearToken: true
                };
            }

            // Sadece verified kullanıcılar için session kontrolü yap
            if (user.isVerified !== 'verified') {
                logger.warn('Auth check: User not verified', { 
                    userId: tokenInfo.userId, 
                    userStatus: user.isVerified 
                });
                const revoked = await sessionService.revokeUserSession(tokenInfo.userId, 'user_not_verified_auth_check');
                return {
                    isValid: false,
                    reason: 'user_not_verified',
                    clearToken: true
                };
            }

            // 4. Redis'ten session bilgisini al
            const session = await sessionService.getUserSession(tokenInfo.userId);
            
            if (!session) {
                logger.warn('Auth check: Session not found', { userId: tokenInfo.userId });
                return {
                    isValid: false,
                    reason: 'session_not_found',
                    clearToken: true
                };
            }

            if (!session.isActive) {
                logger.warn('Auth check: Session inactive', { userId: tokenInfo.userId });
                return {
                    isValid: false,
                    reason: 'session_inactive', 
                    clearToken: true
                };
            }

            // 5. Device fingerprint oluştur ve karşılaştır
            const currentDeviceFingerprint = deviceService.generateDeviceFingerprint(deviceInfo);
            
            if (session.deviceFingerprint !== currentDeviceFingerprint) {
                logger.warn('Auth check: Device fingerprint mismatch - clearing session', {
                    userId: tokenInfo.userId,
                    sessionDevice: session.deviceFingerprint,
                    currentDevice: currentDeviceFingerprint,
                    ipAddress
                });
                
                // 🔥 SECURITY: Session'ı sil (farklı cihaz)
                await sessionService.revokeUserSession(tokenInfo.userId, 'device_mismatch_auth_check');
                
                return {
                    isValid: false,
                    reason: 'device_mismatch',
                    sessionRevoked: true,
                    clearToken: true
                };
            }

            // 6. 30 dakika aktivite kontrolü
            if (sessionService.isSessionExpiredByActivity(session.lastActivity)) {
                logger.info('Auth check: Session expired by activity', {
                    userId: tokenInfo.userId,
                    lastActivity: session.lastActivity
                });
                
                await sessionService.revokeUserSession(tokenInfo.userId, 'activity_timeout_auth_check');
                
                return {
                    isValid: false,
                    reason: 'activity_timeout',
                    clearToken: true
                };
            }

            // 7. Her şey OK - session activity güncelle
            await sessionService.updateSessionActivity(tokenInfo.userId, ipAddress);
            await deviceService.updateDeviceLastSeen(currentDeviceFingerprint, ipAddress);

            logger.info('Auth check successful', {
                userId: tokenInfo.userId,
                sessionId: session.sessionId,
                deviceMatch: true
            });

            return {
                isValid: true,
                userId: tokenInfo.userId,
                sessionId: session.sessionId
            };

        } catch (error) {
            logger.error('Auth check error', {
                error: error.message,
                stack: error.stack,
                ipAddress
            });
            
            // Spesifik error türleri için farklı responses
            if (error.name === 'ValidationError') {
                return {
                    isValid: false,
                    reason: 'validation_error',
                    clearToken: true,
                    errorDetail: error.message
                };
            }
            
            if (error.name === 'NotFoundError') {
                return {
                    isValid: false,
                    reason: 'user_not_found',
                    clearToken: true
                };
            }
            
            return {
                isValid: false,
                reason: 'system_error',
                clearToken: true,
                errorDetail: error.message
            };
        }
    }

    async sendVerificationEmail(email) {
        try {
            const user = await User.findOne({ email });

            if (!user) {
                throw new NotFoundError(errorMessages.NOT_FOUND.USER_NOT_FOUND);
            }

            const verifyCode = generateCode();
            const hashedCode = await hashCode(verifyCode);

            await this.transporter.sendMail({
                from: process.env.EMAIL_USER,
                to: email,
                subject: "Verify your email",
                text: `Ali Çağlar Koçer\nYour verification code is: ${verifyCode}`,
                });
    
                // Redis'e geçici olarak yeni veriyi ve doğrulama kodunu sakla
                const redisClient = getRedisClient();
                const redisKey = `user:${user._id}:verify:email`;
                const updateData = {
                    value: verifyCode,
                    code: hashedCode,
                    userId: user._id
                };
                
                // 5 dakika (300 saniye) sonra otomatik silinecek şekilde Redis'e kaydet
                await redisClient.setEx(redisKey, 300, JSON.stringify(updateData));
    
                logger.info('Verification email sent', { email });
                const message = {
                    message: successMessages.AUTH.VERIFICATION_EMAIL_SENT,
                    expiresAt: FORMAT_EXPIRES_AT(NOW().getTime() + (1000 * 60 * 5)) // 5 dakika
                }

                return message;
            
        } catch (error) {
            throw error;
        }
    }

    async verifyEmail(email , code) {
        try {
            const user = await User.findOne({ email });

            if (!user) {
                throw new NotFoundError(errorMessages.NOT_FOUND.USER_NOT_FOUND);
            }

            const redisClient = getRedisClient();
            const redisKey = `user:${user._id}:verify:email`;
            const updateDataStr = await redisClient.get(redisKey);
            
            if (!updateDataStr) {
                logger.warn('Verification token expired', { email });
                throw new ValidationError(errorMessages.INVALID.VERIFICATION_TOKEN_EXPIRED);
            }

            const updateData = JSON.parse(updateDataStr);
            const isVerified = verifyHashedCode(code, updateData.code);

            if (!isVerified) {
                logger.warn('Verification token invalid', { email });
                throw new ValidationError(errorMessages.TOKEN.TOKEN_INVALID);
            }

            // 🔥 FIX: Set user status to 'verified' instead of 'active'
            user.isVerified = 'verified';
            await user.save();
            await redisClient.del(redisKey);

            const message = {
                message: successMessages.AUTH.EMAIL_VERIFIED,
                user: _formatUserResponse(user)
            }

            logger.info('Email verified successfully', { 
                email, 
                userId: user._id,
                newStatus: user.isVerified 
            });

            return message;
        } catch (error) {
            throw error;
        }
    }

    async initializeEventListeners() {
        try {
            const queueNamePrefix = 'user-auth-service.queue';
            
            await eventSubscriber.respondTo('user.auth.getMe', async (payload, metadata) => {
                logger.info('Received getMe request from auth-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const user = await User.findById(payload.userId);
                if(!user) {
                    return {
                        success: false,
                        message: "Kullanıcı bulunamadı",
                        error: "NotFoundError",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }
                return {
                    success: true,
                    message: "Kullanıcı başarıyla alındı",
                    receivedData: payload,
                    timestamp: new Date().toISOString(),
                    user: _formatUserResponse(user)
                };
            });

            await eventSubscriber.respondTo('user.auth.addCommunityToLeader', async (payload, metadata) => {
                logger.info('Received addCommunityToLeader request from auth-service', { 
                    payload,
                    metadata,
                    replyTo: payload.replyTo 
                });

                const user = await User.findById(payload.userId);
                if(!user) {
                    return {
                        success: false,
                        message: "Kullanıcı bulunamadı",
                        error: "NotFoundError",
                        receivedData: payload,
                        timestamp: new Date().toISOString()
                    };
                }
                // 🔥 FIX: Push proper community membership object
                user.communities.push({
                    communityId: payload.communityId,
                    role: 'leader',
                    joinedAt: new Date(),
                    status: 'approved'
                });
                user.leaderCommunityId = payload.communityId;
                user.status = 'leader_of_community';
                await user.save();
                return {
                    success: true,
                    message: "Topluluk liderine bilgileri eklendi",
                    receivedData: payload,
                    timestamp: new Date().toISOString(),
                    user: _formatUserResponse(user)
                };

            });


        } catch (error) {
            throw error;
        }
    }
}

module.exports = new AuthService();
