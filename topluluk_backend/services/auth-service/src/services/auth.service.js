const User = require('../models/user.model');
const nodemailer = require('nodemailer');
const { logger } = require('../../../../shared/utils/logger');
const { validateRegister } = require('../utils/validationUtils');
const { generateCode , hashCode , verifyHashedCode , hashPassword , verifyPassword } = require('../../../../shared/utils/helpers');
const { NOW, FORMAT_EXPIRES_AT } = require('../../../../shared/utils/constants/time');
const errorMessages = require('../../../../shared/config/errorMessages');
const ConflictError = require('../../../../shared/utils/errors/ConflictError');
const ForbiddenError = require('../../../../shared/utils/errors/ForbiddenError');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');
const NotFoundError = require('../../../../shared/utils/errors/NotFoundError');
const successMessages = require('../../../../shared/config/successMessages');
const { getRedisClient } = require('../utils/database');

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
        phone: user.phone
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
            
            const { name, surname, email, phone, password } = userData;
            const hashedPassword = await hashPassword(password);
            
            logger.info('Password hashed successfully');
            
            const user = new User({ 
                name, 
                surname, 
                email, 
                phone, 
                password: hashedPassword 
            });

            logger.info('User model created, saving to database...');
            await user.save();
            logger.info('User saved to database successfully');
            
            return user;
        } catch (error) {
            throw error;
        }
    }

    /**
     * 🔥 FIXED: Login orchestration only
     */
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

    /**
     * 🔥 FIXED: Logout orchestration only
     */
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

    /**
     * 🔥 FIXED: Get user session info orchestration
     */
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
                isActive: session.isActive
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

            // 3. Redis'ten session bilgisini al
            const session = await sessionService.getUserSession(tokenInfo.userId);
            
            if (!session) {
                return {
                    isValid: false,
                    reason: 'session_not_found',
                    clearToken: true
                };
            }

            if (!session.isActive) {
                return {
                    isValid: false,
                    reason: 'session_inactive', 
                    clearToken: true
                };
            }

            // 4. Device fingerprint oluştur ve karşılaştır
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

            // 5. 30 dakika aktivite kontrolü
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

            // 6. Her şey OK - session activity güncelle
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
                ipAddress
            });
            
            return {
                isValid: false,
                reason: 'check_error',
                clearToken: true
            };
        }
    }
}

module.exports = new AuthService();
