const tokenUtils = require('../utils/tokenUtils');
const sessionService = require('../services/session.service');
const deviceService = require('../services/device.service');
const { logger } = require('../utils/logger');
const ValidationError = require('../utils/errors/ValidationError');

/**
 * 🔥 MIKROSERVIS: Token validation middleware with auto-renewal
 */
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const { deviceInfo } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress || 'unknown';

        // Check authorization header
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Authorization header is required'
            });
        }

        const token = authHeader.substring(7);

        // Check device info (required for all protected routes)
        if (!deviceInfo) {
            return res.status(400).json({
                success: false,
                message: 'Device information is required'
            });
        }

        // 1. Validate token format using tokenUtils
        const tokenValidation = tokenUtils.validateAccessToken(token);
        
        if (!tokenValidation.isValid) {
            return res.status(401).json({
                success: false,
                message: 'Token validation failed',
                reason: tokenValidation.reason,
                expired: tokenValidation.expired
            });
        }

        // 2. Validate session using sessionService
        const sessionValidation = await sessionService.validateSession(
            tokenValidation.userId,
            deviceInfo
        );

        if (!sessionValidation.isValid) {
            return res.status(401).json({
                success: false,
                message: 'Session validation failed',
                reason: sessionValidation.reason,
                sessionRevoked: sessionValidation.sessionRevoked || false
            });
        }

        // 3. Update session activity
        await sessionService.updateSessionActivity(tokenValidation.userId, ipAddress);

        // 4. Update device last seen
        await deviceService.updateDeviceLastSeen(deviceInfo.fingerprint, ipAddress);

        // 🔥 FIX: Senaryo 3 - Otomatik token renewal kontrolü
        let newAccessToken = null;
        if (tokenUtils.shouldRenewToken(tokenValidation)) {
            try {
                const sessionData = sessionValidation.session;
                const renewalResult = tokenUtils.generateSessionBasedAccessToken(sessionData);
                newAccessToken = renewalResult.token;
                
                logger.info('Token auto-renewed', {
                    userId: tokenValidation.userId,
                    sessionId: tokenValidation.sessionId,
                    oldTokenAge: Math.floor(Date.now() / 1000) - tokenValidation.issuedAt
                });
            } catch (renewalError) {
                logger.error('Token auto-renewal failed', {
                    error: renewalError.message,
                    userId: tokenValidation.userId
                });
                // Continue without renewal, user can manually refresh later
            }
        }

        // Add user info to request
        req.user = {
            userId: tokenValidation.userId,
            sessionId: tokenValidation.sessionId,
            session: sessionValidation.session
        };

        // 🔥 FIX: Yeni token varsa header'da gönder
        if (newAccessToken) {
            res.setHeader('X-New-Access-Token', newAccessToken);
            res.setHeader('X-Token-Renewed', 'true');
        }

        next();

    } catch (error) {
        logger.error('Auth middleware error', {
            error: error.message,
            url: req.url,
            method: req.method
        });
        
        return res.status(500).json({
            success: false,
            message: 'Authentication error'
        });
    }
};

/**
 * 🔥 MIKROSERVIS: Optional auth (for public endpoints that can work with/without auth)
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // No token provided, continue without authentication
            req.user = null;
            return next();
        }

        // Token provided, try to authenticate
        await authenticateToken(req, res, next);

    } catch (error) {
        // Authentication failed, but continue without auth
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    optionalAuth
}; 