const { 
    createAccessToken, 
    createRefreshToken, 
    verifyToken,
    shouldRefreshToken
} = require('../utils/tokenUtils');
const UnauthorizedError = require('../utils/errors/UnauthorizedError');
const errorMessages = require('../config/errorMessages');
const tokenUtils = require('../utils/tokenUtils');
const sessionService = require('./session.service');
const deviceService = require('./device.service');
const { logger } = require('../utils/logger');

class TokenService {
    async verifyAndDecodeToken(token, isRefreshToken = false) {
        try {
            // Token'ı doğrula
            const decoded = verifyToken(token, isRefreshToken);

            // Otomatik yenileme kontrolü
            if (!isRefreshToken && shouldRefreshToken(token)) {
                const newAccessToken = createAccessToken(decoded.userId, decoded.role);
                return {
                    decoded,
                    newAccessToken
                };
            }

            return { decoded };
        } catch (error) {
            if (error.isExpired) {
                throw new UnauthorizedError(errorMessages.TOKEN.TOKEN_EXPIRED);
            }
            throw error;
        }
    }

    createTokenPair(userId, role) {
        return {
            accessToken: createAccessToken(userId, role),
            refreshToken: createRefreshToken(userId)
        };
    }

    /**
     * 🔥 MIKROSERVIS: Refresh token işlemi
     */
    async refreshAccessToken(userId, deviceInfo, ipAddress) {
        try {
            // 1. Get refresh token from session
            const sessionRefreshToken = await sessionService.getSessionRefreshToken(userId);
            
            if (!sessionRefreshToken) {
                return {
                    success: false,
                    reason: 'refresh_token_not_found'
                };
            }

            // 2. Validate refresh token using tokenUtils
            const tokenValidation = tokenUtils.validateRefreshToken(sessionRefreshToken);
            
            if (!tokenValidation.isValid) {
                return {
                    success: false,
                    reason: tokenValidation.reason,
                    expired: tokenValidation.expired
                };
            }

            // 3. Validate session using sessionService
            const sessionValidation = await sessionService.validateSession(
                userId,
                deviceInfo
            );

            if (!sessionValidation.isValid) {
                return {
                    success: false,
                    reason: sessionValidation.reason
                };
            }

            // 4. Generate new access token using tokenUtils
            const sessionData = sessionValidation.session;
            const newAccessToken = tokenUtils.generateSessionBasedAccessToken(sessionData);

            // 5. Update session activity
            await sessionService.updateSessionActivity(userId, ipAddress);

            // 6. Update device last seen
            await deviceService.updateDeviceLastSeen(deviceInfo.fingerprint, ipAddress);

            logger.info('Token refreshed successfully', {
                userId: tokenValidation.userId,
                sessionId: tokenValidation.sessionId
            });

            // 🔥 SECURITY: Sadece access token döndür
            return {
                success: true,
                accessToken: newAccessToken.token,
                tokenType: newAccessToken.tokenType,
                expiresIn: newAccessToken.expiresIn
            };

        } catch (error) {
            logger.error('Token refresh error', {
                error: error.message,
                userId
            });
            return {
                success: false,
                reason: 'refresh_error'
            };
        }
    }

    /**
     * 🔥 MIKROSERVIS: Token validation (middleware dışında kullanım için)
     */
    async validateTokenWithSession(token, deviceInfo, ipAddress) {
        try {
            // 1. Validate token format using tokenUtils
            const tokenValidation = tokenUtils.validateAccessToken(token);
            
            if (!tokenValidation.isValid) {
                return {
                    isValid: false,
                    reason: tokenValidation.reason,
                    expired: tokenValidation.expired
                };
            }

            // 2. Validate session using sessionService
            const sessionValidation = await sessionService.validateSession(
                tokenValidation.userId,
                deviceInfo
            );

            if (!sessionValidation.isValid) {
                return {
                    isValid: false,
                    reason: sessionValidation.reason
                };
            }

            // 3. Update activities
            await sessionService.updateSessionActivity(tokenValidation.userId, ipAddress);
            await deviceService.updateDeviceLastSeen(deviceInfo.fingerprint, ipAddress);

            return {
                isValid: true,
                userId: tokenValidation.userId,
                sessionId: tokenValidation.sessionId,
                session: sessionValidation.session
            };

        } catch (error) {
            logger.error('Token validation error', {
                error: error.message,
                tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
            });
            return {
                isValid: false,
                reason: 'validation_error'
            };
        }
    }

    /**
     * 🔥 MIKROSERVIS: Token info extraction (sadece read-only)
     */
    extractTokenInfo(token) {
        return tokenUtils.extractTokenInfo(token);
    }

    /**
     * 🔥 MIKROSERVIS: Check if token needs renewal
     */
    shouldRenewToken(token) {
        const tokenInfo = this.extractTokenInfo(token);
        return tokenUtils.shouldRenewToken(tokenInfo);
    }

    /**
     * 🔥 MIKROSERVIS: Check if token is near expiry
     */
    isTokenNearExpiry(token, thresholdMinutes = 5) {
        const tokenInfo = this.extractTokenInfo(token);
        return tokenUtils.isTokenNearExpiry(tokenInfo, thresholdMinutes);
    }
}

module.exports = new TokenService(); 