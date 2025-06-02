const authService = require('../services/auth.service');
const tokenService = require('../../../../shared/services/token.service');
const { logger } = require('../../../../shared/utils/logger');
const errorMessages = require('../../../../shared/config/errorMessages');
const ValidationError = require('../../../../shared/utils/errors/ValidationError');

class AuthController {
    constructor() {
        this.authService = authService;
        this.tokenService = tokenService;
    }

    async register(req, res, next) {
        try {
            logger.info('Register request received', { 
                user: { 
                    email: req.body.email,
                    phone: req.body.phone,
                    name: req.body.name,
                    surname: req.body.surname
                },
                requestId: req.requestId
            });
            
            const { name, surname, email, phone, password } = req.body;

            if (!name || !surname || !email || !phone || !password) {
                throw new ValidationError(errorMessages.INVALID.EMPTY_DATA);
            }
            
            const message = await this.authService.registerUser({ name, surname, email, phone, password });
            
            logger.info('User registered successfully', { 
                userId: message.userId || 'unknown',
                email: email,
                requestId: req.requestId 
            });
            
            return res.status(201).json(message);
        } catch (error) {
            // Hatayı error middleware'e iletiyoruz
            next(error);
        }
    }

    /**
     * 🔥 FIXED: Login orchestration
     */
    async login(req, res, next) {
        try {
            const { email, phone, password, deviceInfo } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';
            
            logger.info('Login request received', {
                identifier: email || phone,
                deviceInfo: deviceInfo ? {
                    platform: deviceInfo.platform,
                    model: deviceInfo.model,
                    version: deviceInfo.version
                } : 'missing',
                ipAddress,
                requestId: req.requestId
            });

            // Validate required fields
            if (!email && !phone) {
                throw new ValidationError('Email or phone is required');
            }

            if (!password) {
                throw new ValidationError('Password is required');
            }

            if (!deviceInfo) {
                throw new ValidationError('Device information is required');
            }

            // Validate device info structure
            if (!deviceInfo.platform || !deviceInfo.model || !deviceInfo.version) {
                throw new ValidationError('Device platform, model, and version are required');
            }

            const loginResult = await this.authService.loginUser(
                { email, phone, password },
                deviceInfo,
                ipAddress
            );

            logger.info('User logged in successfully', {
                message: 'Login successful',
                requestId: req.requestId
            });

            return res.status(200).json(loginResult);

        } catch (error) {
            logger.error('Login error', {
                error: error.message,
                identifier: req.body.email || req.body.phone,
                requestId: req.requestId
            });
            next(error);
        }
    }

    /**
     * 🔥 FIXED: Validate token - delegate to token service
     */
    async validateToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const { deviceInfo } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new ValidationError('Authorization header is required');
            }

            const token = authHeader.substring(7);

            if (!deviceInfo) {
                throw new ValidationError('Device information is required');
            }

            const validationResult = await this.tokenService.validateTokenWithSession(
                token,
                deviceInfo,
                ipAddress
            );

            if (!validationResult.isValid) {
                return res.status(401).json({
                    success: false,
                    message: 'Token validation failed',
                    reason: validationResult.reason,
                    expired: validationResult.expired
                });
            }

            return res.status(200).json({
                success: true,
                userId: validationResult.userId,
                sessionId: validationResult.sessionId,
                message: 'Token is valid'
            });

        } catch (error) {
            logger.error('Token validation error', {
                error: error.message,
                requestId: req.requestId
            });
            next(error);
        }
    }

    /**
     * 🔥 FIXED: Refresh token - delegate to token service
     */
    async refreshToken(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const { deviceInfo } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new ValidationError('Authorization header is required');
            }

            const token = authHeader.substring(7);

            if (!deviceInfo) {
                throw new ValidationError('Device information is required');
            }

            // Extract user ID from access token
            const tokenInfo = this.tokenService.extractTokenInfo(token);
            
            if (!tokenInfo || !tokenInfo.userId) {
                throw new ValidationError('Invalid token');
            }

            const refreshResult = await this.tokenService.refreshAccessToken(
                tokenInfo.userId, // 🔥 SECURITY: User ID token'dan alınır
                deviceInfo,
                ipAddress
            );

            if (!refreshResult.success) {
                return res.status(401).json({
                    success: false,
                    message: 'Token refresh failed',
                    reason: refreshResult.reason,
                    expired: refreshResult.expired
                });
            }

            logger.info('Token refreshed successfully', {
                userId: tokenInfo.userId,
                requestId: req.requestId
            });

            return res.status(200).json(refreshResult);

        } catch (error) {
            logger.error('Token refresh error', {
                error: error.message,
                requestId: req.requestId
            });
            next(error);
        }
    }

    /**
     * 🔥 FIXED: Logout - auth service orchestration
     */
    async logout(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new ValidationError('Authorization header is required');
            }

            const token = authHeader.substring(7);
            
            // Extract user ID from token using token service
            const tokenInfo = this.tokenService.extractTokenInfo(token);
            
            if (!tokenInfo || !tokenInfo.userId) {
                throw new ValidationError('Invalid token');
            }

            const logoutResult = await this.authService.logoutUser(tokenInfo.userId);

            logger.info('User logged out', {
                userId: tokenInfo.userId,
                requestId: req.requestId
            });

            return res.status(200).json(logoutResult);

        } catch (error) {
            logger.error('Logout error', {
                error: error.message,
                requestId: req.requestId
            });
            next(error);
        }
    }

    /**
     * 🔥 FIXED: Get session info - auth service orchestration
     */
    async getSessionInfo(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                throw new ValidationError('Authorization header is required');
            }

            const token = authHeader.substring(7);
            
            // Extract user ID from token using token service
            const tokenInfo = this.tokenService.extractTokenInfo(token);
            
            if (!tokenInfo || !tokenInfo.userId) {
                throw new ValidationError('Invalid token');
            }

            const sessionInfo = await this.authService.getUserSessionInfo(tokenInfo.userId);

            if (!sessionInfo) {
                return res.status(404).json({
                    success: false,
                    message: 'Session not found'
                });
            }

            return res.status(200).json({
                success: true,
                session: sessionInfo
            });

        } catch (error) {
            logger.error('Get session info error', {
                error: error.message,
                requestId: req.requestId
            });
            next(error);
        }
    }

    /**
     * 🔥 SECURITY: App startup auth check
     */
    async checkAuth(req, res, next) {
        try {
            const authHeader = req.headers.authorization;
            const { deviceInfo } = req.body;
            const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

            // Authorization header kontrolü
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return res.status(200).json({
                    isValid: false,
                    reason: 'missing_token',
                    clearToken: true,
                    message: 'Please login again'
                });
            }

            const accessToken = authHeader.substring(7);

            // Device info kontrolü
            if (!deviceInfo || !deviceInfo.platform || !deviceInfo.model || !deviceInfo.version) {
                return res.status(200).json({
                    isValid: false,
                    reason: 'invalid_device_info',
                    clearToken: true,
                    message: 'Device information required'
                });
            }

            logger.info('Auth check request received', {
                deviceInfo: {
                    platform: deviceInfo.platform,
                    model: deviceInfo.model,
                    version: deviceInfo.version
                },
                ipAddress,
                requestId: req.requestId
            });

            // Auth service ile kontrol et
            const checkResult = await this.authService.checkAuthStatus(
                accessToken,
                deviceInfo,
                ipAddress
            );

            if (!checkResult.isValid) {
                logger.warn('Auth check failed', {
                    reason: checkResult.reason,
                    sessionRevoked: checkResult.sessionRevoked,
                    requestId: req.requestId
                });

                return res.status(200).json({
                    isValid: false,
                    reason: checkResult.reason,
                    clearToken: checkResult.clearToken,
                    sessionRevoked: checkResult.sessionRevoked,
                    message: this.getAuthCheckMessage(checkResult.reason)
                });
            }

            logger.info('Auth check successful', {
                userId: checkResult.userId,
                sessionId: checkResult.sessionId,
                requestId: req.requestId
            });

            return res.status(200).json({
                isValid: true,
                userId: checkResult.userId,
                sessionId: checkResult.sessionId,
                message: 'Authentication valid'
            });

        } catch (error) {
            logger.error('Auth check controller error', {
                error: error.message,
                requestId: req.requestId
            });

            // Hata durumunda da frontend token'ı silsin
            return res.status(200).json({
                isValid: false,
                reason: 'system_error',
                clearToken: true,
                message: 'System error, please login again'
            });
        }
    }

    /**
     * Helper: Auth check mesajları
     */
    getAuthCheckMessage(reason) {
        const messages = {
            'invalid_token': 'Invalid token, please login again',
            'token_expired': 'Session expired, please login again', 
            'session_not_found': 'Session not found, please login again',
            'session_inactive': 'Session inactive, please login again',
            'device_mismatch': 'Different device detected, please login again',
            'activity_timeout': 'Session timeout, please login again',
            'check_error': 'Authentication error, please login again'
        };
        
        return messages[reason] || 'Please login again';
    }
}

module.exports = new AuthController();
