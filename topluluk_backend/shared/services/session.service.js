const { v4: uuidv4 } = require('uuid');
const { logger } = require('../utils/logger');

// 🔥 FIX: Auth service context'inde çalışırken auth service'in Redis client'ını kullan
let getRedisClient;

// Runtime'da doğru Redis client'ı belirle
if (process.env.SERVICE_NAME === 'auth-service' || process.cwd().includes('auth-service')) {
    // Auth service context'i
    getRedisClient = require('../../services/auth-service/src/utils/database').getRedisClient;
} else {
    // Shared context (fallback)
    getRedisClient = require('../database').getRedisClient;
}

class SessionService {
    constructor() {
        this.SESSION_PREFIX = 'session:user:';
        this.SESSION_DURATION = 24 * 60 * 60; // 24 saat (saniye)
        this.ACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 dakika (ms)
    }

    /**
     * User için session oluştur/güncelle (tek session per user)
     */
    async createOrUpdateSession(userId, deviceInfo, ipAddress, refreshToken = null) {
        try {
            const redisClient = getRedisClient();
            const sessionKey = `${this.SESSION_PREFIX}${userId}`;
            const now = new Date().toISOString();

            // Mevcut session'ı kontrol et
            const existingSession = await this.getUserSession(userId);
            
            if (existingSession) {
                // Eğer farklı cihazdan giriş yapıyorsa, eski session'ı logla
                if (existingSession.deviceFingerprint !== deviceInfo.fingerprint) {
                    logger.warn('New device login detected, replacing existing session', {
                        userId,
                        oldDevice: existingSession.deviceFingerprint,
                        newDevice: deviceInfo.fingerprint,
                        oldIP: existingSession.ipAddress,
                        newIP: ipAddress
                    });
                }
            }

            const sessionData = {
                sessionId: existingSession?.sessionId || uuidv4(),
                userId,
                deviceFingerprint: deviceInfo.fingerprint,
                deviceModel: deviceInfo.model,
                devicePlatform: deviceInfo.platform,
                deviceVersion: deviceInfo.version,
                ipAddress,
                createdAt: existingSession?.createdAt || now,
                lastActivity: now,
                isActive: true,
                userAgent: deviceInfo.userAgent || null,
                location: deviceInfo.location || null,
                loginCount: (existingSession?.loginCount || 0) + 1,
                // 🔥 SECURITY: Refresh token'ı backend'de sakla
                refreshToken: refreshToken || existingSession?.refreshToken || null
            };

            // 🔥 FIX: Redis için tüm değerleri string'e çevir
            const redisSessionData = {};
            for (const [key, value] of Object.entries(sessionData)) {
                redisSessionData[key] = value === null ? '' : String(value);
            }

            // Session'ı Redis'e kaydet (üzerine yaz)
            await redisClient.hSet(sessionKey, redisSessionData);
            await redisClient.expire(sessionKey, this.SESSION_DURATION);

            logger.info('Session created/updated successfully', {
                sessionId: sessionData.sessionId,
                userId,
                deviceFingerprint: deviceInfo.fingerprint,
                ipAddress,
                isNewSession: !existingSession,
                hasRefreshToken: !!refreshToken
            });

            return {
                sessionId: sessionData.sessionId,
                isNewSession: !existingSession,
                expiresAt: new Date(Date.now() + (this.SESSION_DURATION * 1000)).toISOString()
            };

        } catch (error) {
            logger.error('Error creating/updating session', { 
                error: error.message, 
                userId, 
                deviceInfo 
            });
            throw error;
        }
    }

    /**
     * User'ın session'ını getir
     */
    async getUserSession(userId) {
        try {
            const redisClient = getRedisClient();
            const sessionKey = `${this.SESSION_PREFIX}${userId}`;
            
            const session = await redisClient.hGetAll(sessionKey);
            
            if (Object.keys(session).length === 0) {
                return null;
            }

            // 🔥 FIX: Redis'ten gelen string değerleri doğru tiplere çevir
            return {
                ...session,
                isActive: session.isActive === 'true',
                loginCount: parseInt(session.loginCount) || 0,
                userAgent: session.userAgent || null,
                location: session.location || null,
                refreshToken: session.refreshToken || null
            };

        } catch (error) {
            logger.error('Error getting user session', { 
                error: error.message, 
                userId 
            });
            return null;
        }
    }

    /**
     * Session activity güncelle
     */
    async updateSessionActivity(userId, ipAddress = null) {
        try {
            const redisClient = getRedisClient();
            const sessionKey = `${this.SESSION_PREFIX}${userId}`;

            const updateData = {
                lastActivity: new Date().toISOString()
            };

            if (ipAddress) {
                updateData.ipAddress = ipAddress;
            }

            // 🔥 FIX: Redis için string'e çevir
            const redisUpdateData = {};
            for (const [key, value] of Object.entries(updateData)) {
                redisUpdateData[key] = value === null ? '' : String(value);
            }

            const updated = await redisClient.hSet(sessionKey, redisUpdateData);
            await redisClient.expire(sessionKey, this.SESSION_DURATION);

            if (updated) {
                logger.debug('Session activity updated', { userId, ipAddress });
                return true;
            }

            return false;

        } catch (error) {
            logger.error('Error updating session activity', { 
                error: error.message, 
                userId 
            });
            return false;
        }
    }

    /**
     * User'ın session'ını iptal et - Direkt sil (log zaten Winston'da)
     */
    async revokeUserSession(userId, reason = 'manual_logout') {
        try {
            const redisClient = getRedisClient();
            const sessionKey = `${this.SESSION_PREFIX}${userId}`;
            
            // 🔥 IMPROVED: Session'ı direkt sil - Winston logger zaten tüm bilgileri tutuyor
            const deleted = await redisClient.del(sessionKey);

            if (deleted > 0) {
                logger.info('Session revoked and deleted successfully', {
                    userId,
                    reason,
                    sessionKey,
                    timestamp: new Date().toISOString()
                });
                return true;
            } else {
                logger.warn('Session not found during revoke attempt', {
                    userId,
                    reason,
                    sessionKey
                });
                return false;
            }

        } catch (error) {
            logger.error('Error revoking user session', { 
                error: error.message, 
                userId,
                reason
            });
            throw error;
        }
    }

    /**
     * Session geçerlilik kontrolü
     */
    async validateSession(userId, deviceInfo) {
        try {
            const session = await this.getUserSession(userId);
            
            if (!session) {
                return { 
                    isValid: false, 
                    reason: 'session_not_found' 
                };
            }

            if (!session.isActive) {
                return { 
                    isValid: false, 
                    reason: 'session_inactive' 
                };
            }

            // Device fingerprint kontrolü
            if (session.deviceFingerprint !== deviceInfo.fingerprint) {
                logger.warn('Device fingerprint mismatch - revoking session', {
                    userId,
                    sessionDevice: session.deviceFingerprint,
                    currentDevice: deviceInfo.fingerprint
                });
                
                // 🔥 FIX: Senaryo 2 - Farklı cihaz = session iptal et
                await this.revokeUserSession(userId, 'device_mismatch');
                
                return { 
                    isValid: false, 
                    reason: 'device_mismatch',
                    sessionRevoked: true
                };
            }

            // 30 dakika aktivite kontrolü
            if (this.isSessionExpiredByActivity(session.lastActivity)) {
                await this.revokeUserSession(userId, 'activity_timeout');
                
                return { 
                    isValid: false, 
                    reason: 'activity_timeout' 
                };
            }

            return { 
                isValid: true, 
                session 
            };

        } catch (error) {
            logger.error('Error validating session', { 
                error: error.message, 
                userId 
            });
            return { 
                isValid: false, 
                reason: 'validation_error' 
            };
        }
    }

    /**
     * Session'ın aktivite timeout'una uğrayıp uğramadığını kontrol et
     */
    isSessionExpiredByActivity(lastActivity) {
        try {
            const lastActivityTime = new Date(lastActivity).getTime();
            const currentTime = Date.now();
            const timeDiff = currentTime - lastActivityTime;
            
            return timeDiff > this.ACTIVITY_TIMEOUT;
        } catch (error) {
            // Güvenlik için true döndür
            return true;
        }
    }

    /**
     * Tüm expired session'ları temizle (cron job için)
     */
    async cleanupExpiredSessions() {
        try {
            const redisClient = getRedisClient();
            const sessionKeys = await redisClient.keys(`${this.SESSION_PREFIX}*`);
            let cleanedCount = 0;

            for (const sessionKey of sessionKeys) {
                const session = await redisClient.hGetAll(sessionKey);
                
                if (session.isActive === 'true') {
                    if (this.isSessionExpiredByActivity(session.lastActivity)) {
                        const userId = session.userId;
                        await this.revokeUserSession(userId, 'cleanup_expired');
                        cleanedCount++;
                        
                        logger.info('Expired session cleaned up', { 
                            userId,
                            lastActivity: session.lastActivity
                        });
                    }
                }
            }

            logger.info('Session cleanup completed', { cleanedCount });
            return cleanedCount;

        } catch (error) {
            logger.error('Error cleaning up expired sessions', { 
                error: error.message 
            });
            return 0;
        }
    }

    /**
     * Session istatistikleri
     */
    async getSessionStats() {
        try {
            const redisClient = getRedisClient();
            const sessionKeys = await redisClient.keys(`${this.SESSION_PREFIX}*`);
            
            let activeCount = 0;
            let inactiveCount = 0;
            let expiredCount = 0;

            for (const sessionKey of sessionKeys) {
                const session = await redisClient.hGetAll(sessionKey);
                
                if (session.isActive === 'true') {
                    if (this.isSessionExpiredByActivity(session.lastActivity)) {
                        expiredCount++;
                    } else {
                        activeCount++;
                    }
                } else {
                    inactiveCount++;
                }
            }

            return {
                total: sessionKeys.length,
                active: activeCount,
                inactive: inactiveCount,
                expired: expiredCount
            };

        } catch (error) {
            logger.error('Error getting session stats', { error: error.message });
            return { total: 0, active: 0, inactive: 0, expired: 0 };
        }
    }

    /**
     * Belirli IP'den gelen tüm session'ları bul (güvenlik için)
     */
    async findSessionsByIP(ipAddress) {
        try {
            const redisClient = getRedisClient();
            const sessionKeys = await redisClient.keys(`${this.SESSION_PREFIX}*`);
            const matchingSessions = [];

            for (const sessionKey of sessionKeys) {
                const session = await redisClient.hGetAll(sessionKey);
                
                if (session.ipAddress === ipAddress && session.isActive === 'true') {
                    matchingSessions.push({
                        ...session,
                        isActive: session.isActive === 'true'
                    });
                }
            }

            return matchingSessions;

        } catch (error) {
            logger.error('Error finding sessions by IP', { 
                error: error.message, 
                ipAddress 
            });
            return [];
        }
    }

    /**
     * Device fingerprint ile session bul
     */
    async findSessionByDeviceFingerprint(deviceFingerprint) {
        try {
            const redisClient = getRedisClient();
            const sessionKeys = await redisClient.keys(`${this.SESSION_PREFIX}*`);

            for (const sessionKey of sessionKeys) {
                const session = await redisClient.hGetAll(sessionKey);
                
                if (session.deviceFingerprint === deviceFingerprint && session.isActive === 'true') {
                    return {
                        ...session,
                        isActive: session.isActive === 'true'
                    };
                }
            }

            return null;

        } catch (error) {
            logger.error('Error finding session by device fingerprint', { 
                error: error.message, 
                deviceFingerprint 
            });
            return null;
        }
    }

    /**
     * 🔥 SECURITY: Refresh token'ı session'a kaydet
     */
    async updateSessionRefreshToken(userId, refreshToken) {
        try {
            const redisClient = getRedisClient();
            const sessionKey = `${this.SESSION_PREFIX}${userId}`;

            const updateData = {
                refreshToken,
                lastActivity: new Date().toISOString()
            };

            // 🔥 FIX: Redis için string'e çevir
            const redisUpdateData = {};
            for (const [key, value] of Object.entries(updateData)) {
                redisUpdateData[key] = value === null ? '' : String(value);
            }

            await redisClient.hSet(sessionKey, redisUpdateData);
            await redisClient.expire(sessionKey, this.SESSION_DURATION);

            logger.debug('Session refresh token updated', { userId });
            return true;

        } catch (error) {
            logger.error('Error updating session refresh token', { 
                error: error.message, 
                userId 
            });
            return false;
        }
    }

    /**
     * 🔥 SECURITY: Session'dan refresh token'ı al
     */
    async getSessionRefreshToken(userId) {
        try {
            const session = await this.getUserSession(userId);
            return session?.refreshToken || null;

        } catch (error) {
            logger.error('Error getting session refresh token', { 
                error: error.message, 
                userId 
            });
            return null;
        }
    }
}

module.exports = new SessionService(); 