const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { logger } = require('./logger');

class TokenUtils {
    constructor() {
        this.ACCESS_TOKEN_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret-key';
        this.REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key';
        this.ACCESS_TOKEN_EXPIRY = '30m'; // 30 dakika
        this.REFRESH_TOKEN_EXPIRY = '7d'; // 7 gün
    }

    /**
     * Session bilgilerinden dinamik access token oluştur
     */
    generateSessionBasedAccessToken(sessionData) {
        try {
            const tokenPayload = {
                sub: sessionData.userId, // subject
                sid: sessionData.sessionId, // session id
                dfp: sessionData.deviceFingerprint, // device fingerprint
                iat: Math.floor(Date.now() / 1000), // issued at
                type: 'access'
            };

            const token = jwt.sign(
                tokenPayload,
                this.ACCESS_TOKEN_SECRET,
                { 
                    expiresIn: this.ACCESS_TOKEN_EXPIRY,
                    issuer: 'topluluk-app',
                    audience: 'topluluk-users'
                }
            );

            logger.debug('Session-based access token generated', {
                userId: sessionData.userId,
                sessionId: sessionData.sessionId,
                expiresIn: this.ACCESS_TOKEN_EXPIRY
            });

            return {
                token,
                expiresIn: this.ACCESS_TOKEN_EXPIRY,
                tokenType: 'Bearer'
            };

        } catch (error) {
            logger.error('Error generating session-based access token', {
                error: error.message,
                userId: sessionData.userId
            });
            throw new Error('Token generation failed');
        }
    }

    /**
     * Refresh token oluştur (session bilgisine dayalı)
     */
    generateRefreshToken(sessionData) {
        try {
            const tokenPayload = {
                sub: sessionData.userId,
                sid: sessionData.sessionId,
                dfp: sessionData.deviceFingerprint,
                iat: Math.floor(Date.now() / 1000),
                type: 'refresh'
            };

            const token = jwt.sign(
                tokenPayload,
                this.REFRESH_TOKEN_SECRET,
                { 
                    expiresIn: this.REFRESH_TOKEN_EXPIRY,
                    issuer: 'topluluk-app',
                    audience: 'topluluk-users'
                }
            );

            logger.debug('Refresh token generated', {
                userId: sessionData.userId,
                sessionId: sessionData.sessionId
            });

            return {
                token,
                expiresIn: this.REFRESH_TOKEN_EXPIRY
            };

        } catch (error) {
            logger.error('Error generating refresh token', {
                error: error.message,
                userId: sessionData.userId
            });
            throw new Error('Refresh token generation failed');
        }
    }

    /**
     * Access token'ı doğrula ve session bilgilerini çıkar
     */
    validateAccessToken(token) {
        try {
            const decoded = jwt.verify(token, this.ACCESS_TOKEN_SECRET, {
                issuer: 'topluluk-app',
                audience: 'topluluk-users'
            });

            // Token tipini kontrol et
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }

            logger.debug('Access token validated successfully', {
                userId: decoded.sub,
                sessionId: decoded.sid
            });

            return {
                isValid: true,
                userId: decoded.sub,
                sessionId: decoded.sid,
                deviceFingerprint: decoded.dfp,
                issuedAt: decoded.iat,
                expiresAt: decoded.exp
            };

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                logger.debug('Access token expired', { token: token.substring(0, 20) + '...' });
                return {
                    isValid: false,
                    reason: 'token_expired',
                    expired: true
                };
            } else if (error.name === 'JsonWebTokenError') {
                logger.warn('Invalid access token format', { 
                    error: error.message,
                    token: token.substring(0, 20) + '...'
                });
                return {
                    isValid: false,
                    reason: 'invalid_token',
                    expired: false
                };
            }

            logger.error('Error validating access token', {
                error: error.message,
                tokenPreview: token.substring(0, 20) + '...'
            });

            return {
                isValid: false,
                reason: 'validation_error',
                expired: false
            };
        }
    }

    /**
     * Refresh token'ı doğrula
     */
    validateRefreshToken(token) {
        try {
            const decoded = jwt.verify(token, this.REFRESH_TOKEN_SECRET, {
                issuer: 'topluluk-app',
                audience: 'topluluk-users'
            });

            // Token tipini kontrol et
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }

            logger.debug('Refresh token validated successfully', {
                userId: decoded.sub,
                sessionId: decoded.sid
            });

            return {
                isValid: true,
                userId: decoded.sub,
                sessionId: decoded.sid,
                deviceFingerprint: decoded.dfp,
                issuedAt: decoded.iat,
                expiresAt: decoded.exp
            };

        } catch (error) {
            if (error.name === 'TokenExpiredError') {
                logger.debug('Refresh token expired', { token: token.substring(0, 20) + '...' });
                return {
                    isValid: false,
                    reason: 'token_expired',
                    expired: true
                };
            }

            logger.error('Error validating refresh token', {
                error: error.message,
                tokenPreview: token.substring(0, 20) + '...'
            });

            return {
                isValid: false,
                reason: 'validation_error',
                expired: false
            };
        }
    }

    /**
     * Token'dan session bilgilerini çıkar (doğrulama yapmadan)
     */
    extractTokenInfo(token) {
        try {
            // Token'ı doğrulamadan decode et
            const decoded = jwt.decode(token);
            
            if (!decoded) {
                return null;
            }

            return {
                userId: decoded.sub,
                sessionId: decoded.sid,
                deviceFingerprint: decoded.dfp,
                tokenType: decoded.type,
                issuedAt: decoded.iat,
                expiresAt: decoded.exp
            };

        } catch (error) {
            logger.error('Error extracting token info', {
                error: error.message,
                tokenPreview: token ? token.substring(0, 20) + '...' : 'null'
            });
            return null;
        }
    }

    /**
     * Token süresi kontrol et (30 dakika kuralı)
     */
    isTokenNearExpiry(tokenInfo, thresholdMinutes = 5) {
        try {
            if (!tokenInfo || !tokenInfo.expiresAt) {
                return true; // Güvenli tarafta kal
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const timeToExpiry = tokenInfo.expiresAt - currentTime;
            const thresholdSeconds = thresholdMinutes * 60;

            return timeToExpiry <= thresholdSeconds;

        } catch (error) {
            logger.error('Error checking token expiry', {
                error: error.message,
                tokenInfo
            });
            return true; // Güvenli tarafta kal
        }
    }

    /**
     * Token renewal gerekliliği kontrol et
     */
    shouldRenewToken(tokenInfo) {
        try {
            if (!tokenInfo || !tokenInfo.issuedAt) {
                return true;
            }

            const currentTime = Math.floor(Date.now() / 1000);
            const tokenAge = currentTime - tokenInfo.issuedAt;
            const maxAge = 25 * 60; // 25 dakika

            return tokenAge >= maxAge;

        } catch (error) {
            logger.error('Error checking token renewal need', {
                error: error.message,
                tokenInfo
            });
            return true;
        }
    }

    /**
     * Session verilerinden güvenli payload oluştur
     */
    createSecurePayload(sessionData, includeDevice = true) {
        try {
            const basePayload = {
                userId: sessionData.userId,
                sessionId: sessionData.sessionId,
                isActive: sessionData.isActive,
                lastActivity: sessionData.lastActivity
            };

            if (includeDevice) {
                basePayload.deviceInfo = {
                    fingerprint: sessionData.deviceFingerprint,
                    platform: sessionData.devicePlatform,
                    model: sessionData.deviceModel
                };
            }

            return basePayload;

        } catch (error) {
            logger.error('Error creating secure payload', {
                error: error.message,
                sessionData
            });
            return null;
        }
    }

    /**
     * Token güvenlik hash'i oluştur (CSRF koruması için)
     */
    generateTokenHash(token, sessionId) {
        try {
            const hashInput = `${token}:${sessionId}:${Date.now()}`;
            const hash = crypto
                .createHash('sha256')
                .update(hashInput)
                .digest('hex')
                .substring(0, 16);

            return hash;

        } catch (error) {
            logger.error('Error generating token hash', {
                error: error.message
            });
            return crypto.randomBytes(8).toString('hex');
        }
    }
}

module.exports = new TokenUtils();