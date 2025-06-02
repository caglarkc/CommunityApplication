const crypto = require('crypto');
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

class DeviceService {
    constructor() {
        this.DEVICE_PREFIX = 'device:';
        this.USER_DEVICES_PREFIX = 'user_devices:';
        this.TRUSTED_DEVICE_DURATION = 30 * 24 * 60 * 60; // 30 gün
    }

    /**
     * Device fingerprint oluştur
     */
    generateDeviceFingerprint(deviceInfo) {
        try {
            // Core device bilgileri
            const coreInfo = {
                platform: deviceInfo.platform || 'unknown',
                model: deviceInfo.model || 'unknown',
                version: deviceInfo.version || 'unknown',
                // IP değil, device-specific bilgiler kullan
            };

            // Fingerprint oluştur
            const fingerprintData = JSON.stringify(coreInfo);
            const fingerprint = crypto
                .createHash('sha256')
                .update(fingerprintData)
                .digest('hex')
                .substring(0, 16); // İlk 16 karakter

            logger.debug('Device fingerprint generated', {
                fingerprint,
                platform: coreInfo.platform,
                model: coreInfo.model
            });

            return fingerprint;

        } catch (error) {
            logger.error('Error generating device fingerprint', {
                error: error.message,
                deviceInfo
            });
            // Fallback fingerprint
            return crypto.randomBytes(8).toString('hex');
        }
    }

    /**
     * Enhanced device fingerprint (daha detaylı)
     */
    generateEnhancedFingerprint(deviceInfo, requestInfo = {}) {
        try {
            const enhancedInfo = {
                // Device bilgileri
                platform: deviceInfo.platform || 'unknown',
                model: deviceInfo.model || 'unknown', 
                version: deviceInfo.version || 'unknown',
                
                // Browser/App bilgileri
                userAgent: requestInfo.userAgent || deviceInfo.userAgent || '',
                
                // Screen/Display bilgileri (mobile app'ten gelecek)
                screenResolution: deviceInfo.screenResolution || '',
                timeZone: deviceInfo.timeZone || '',
                language: deviceInfo.language || requestInfo.language || '',
            };

            const fingerprintData = JSON.stringify(enhancedInfo);
            const fingerprint = crypto
                .createHash('sha256')
                .update(fingerprintData)
                .digest('hex')
                .substring(0, 20); // 20 karakter

            return {
                fingerprint,
                components: enhancedInfo
            };

        } catch (error) {
            logger.error('Error generating enhanced fingerprint', {
                error: error.message,
                deviceInfo
            });
            return {
                fingerprint: crypto.randomBytes(10).toString('hex'),
                components: {}
            };
        }
    }

    /**
     * Device fingerprint doğrula
     */
    validateDeviceFingerprint(sessionDeviceFingerprint, currentDeviceInfo) {
        try {
            const currentFingerprint = this.generateDeviceFingerprint(currentDeviceInfo);
            
            const isValid = sessionDeviceFingerprint === currentFingerprint;
            
            logger.debug('Device fingerprint validation', {
                sessionFingerprint: sessionDeviceFingerprint,
                currentFingerprint,
                isValid
            });

            return {
                isValid,
                currentFingerprint,
                sessionFingerprint: sessionDeviceFingerprint
            };

        } catch (error) {
            logger.error('Error validating device fingerprint', {
                error: error.message,
                sessionDeviceFingerprint
            });
            return {
                isValid: false,
                currentFingerprint: null,
                sessionFingerprint: sessionDeviceFingerprint
            };
        }
    }

    /**
     * Yeni cihaz mı kontrol et
     */
    async isNewDevice(userId, deviceFingerprint) {
        try {
            const redisClient = getRedisClient();
            const userDevicesKey = `${this.USER_DEVICES_PREFIX}${userId}`;
            
            const knownDevices = await redisClient.sMembers(userDevicesKey);
            const isNew = !knownDevices.includes(deviceFingerprint);

            logger.debug('New device check', {
                userId,
                deviceFingerprint,
                isNew,
                knownDevicesCount: knownDevices.length
            });

            return {
                isNew,
                knownDevicesCount: knownDevices.length,
                knownDevices
            };

        } catch (error) {
            logger.error('Error checking if device is new', {
                error: error.message,
                userId,
                deviceFingerprint
            });
            // Güvenlik için true döndür (yeni cihaz gibi davran)
            return {
                isNew: true,
                knownDevicesCount: 0,
                knownDevices: []
            };
        }
    }

    /**
     * Device'ı kaydet ve güvenilir olarak işaretle
     */
    async registerDevice(userId, deviceInfo, ipAddress) {
        try {
            const redisClient = getRedisClient();
            const fingerprint = this.generateDeviceFingerprint(deviceInfo);
            
            // Device detaylarını kaydet
            const deviceKey = `${this.DEVICE_PREFIX}${fingerprint}`;
            const deviceData = {
                fingerprint,
                userId,
                platform: deviceInfo.platform,
                model: deviceInfo.model,
                version: deviceInfo.version,
                registeredAt: new Date().toISOString(),
                lastSeenAt: new Date().toISOString(),
                registrationIP: ipAddress,
                lastSeenIP: ipAddress,
                isTrusted: true,
                trustLevel: 'high',
                userAgent: deviceInfo.userAgent || null
            };

            // 🔥 FIX: Redis için tüm değerleri string'e çevir
            const redisDeviceData = {};
            for (const [key, value] of Object.entries(deviceData)) {
                redisDeviceData[key] = value === null ? '' : String(value);
            }

            await redisClient.hSet(deviceKey, redisDeviceData);
            await redisClient.expire(deviceKey, this.TRUSTED_DEVICE_DURATION);

            // User'ın device listesine ekle
            const userDevicesKey = `${this.USER_DEVICES_PREFIX}${userId}`;
            await redisClient.sAdd(userDevicesKey, fingerprint);
            await redisClient.expire(userDevicesKey, this.TRUSTED_DEVICE_DURATION);

            logger.info('Device registered successfully', {
                userId,
                fingerprint,
                platform: deviceInfo.platform,
                model: deviceInfo.model
            });

            return {
                fingerprint,
                registered: true,
                trustLevel: 'high'
            };

        } catch (error) {
            logger.error('Error registering device', {
                error: error.message,
                userId,
                deviceInfo
            });
            throw error;
        }
    }

    /**
     * Device son görülme zamanını güncelle
     */
    async updateDeviceLastSeen(deviceFingerprint, ipAddress) {
        try {
            const redisClient = getRedisClient();
            const deviceKey = `${this.DEVICE_PREFIX}${deviceFingerprint}`;
            
            const updateData = {
                lastSeenAt: new Date().toISOString(),
                lastSeenIP: ipAddress
            };

            // 🔥 FIX: Redis için string'e çevir
            const redisUpdateData = {};
            for (const [key, value] of Object.entries(updateData)) {
                redisUpdateData[key] = value === null ? '' : String(value);
            }

            await redisClient.hSet(deviceKey, redisUpdateData);
            await redisClient.expire(deviceKey, this.TRUSTED_DEVICE_DURATION);

            logger.debug('Device last seen updated', {
                deviceFingerprint,
                ipAddress
            });

            return true;

        } catch (error) {
            logger.error('Error updating device last seen', {
                error: error.message,
                deviceFingerprint
            });
            return false;
        }
    }

    /**
     * User'ın tüm kayıtlı cihazlarını getir
     */
    async getUserDevices(userId) {
        try {
            const redisClient = getRedisClient();
            const userDevicesKey = `${this.USER_DEVICES_PREFIX}${userId}`;
            
            const deviceFingerprints = await redisClient.sMembers(userDevicesKey);
            const devices = [];

            for (const fingerprint of deviceFingerprints) {
                const deviceKey = `${this.DEVICE_PREFIX}${fingerprint}`;
                const deviceData = await redisClient.hGetAll(deviceKey);
                
                if (Object.keys(deviceData).length > 0) {
                    devices.push({
                        ...deviceData,
                        isTrusted: deviceData.isTrusted === 'true'
                    });
                }
            }

            return devices;

        } catch (error) {
            logger.error('Error getting user devices', {
                error: error.message,
                userId
            });
            return [];
        }
    }

    /**
     * Device'ı güvenilmez olarak işaretle
     */
    async markDeviceAsUntrusted(deviceFingerprint, reason = 'security_check') {
        try {
            const redisClient = getRedisClient();
            const deviceKey = `${this.DEVICE_PREFIX}${deviceFingerprint}`;
            
            const updateData = {
                isTrusted: false,
                trustLevel: 'low',
                untrustedAt: new Date().toISOString(),
                untrustedReason: reason
            };

            // 🔥 FIX: Redis için string'e çevir
            const redisUpdateData = {};
            for (const [key, value] of Object.entries(updateData)) {
                redisUpdateData[key] = value === null ? '' : String(value);
            }

            await redisClient.hSet(deviceKey, redisUpdateData);

            logger.warn('Device marked as untrusted', {
                deviceFingerprint,
                reason
            });

            return true;

        } catch (error) {
            logger.error('Error marking device as untrusted', {
                error: error.message,
                deviceFingerprint
            });
            return false;
        }
    }

    /**
     * User'ın tüm cihazlarını güvenilmez yap (güvenlik ihlali durumunda)
     */
    async revokeAllUserDeviceTrust(userId, reason = 'security_breach') {
        try {
            const devices = await this.getUserDevices(userId);
            let revokedCount = 0;

            for (const device of devices) {
                await this.markDeviceAsUntrusted(device.fingerprint, reason);
                revokedCount++;
            }

            logger.warn('All user device trust revoked', {
                userId,
                revokedCount,
                reason
            });

            return revokedCount;

        } catch (error) {
            logger.error('Error revoking all user device trust', {
                error: error.message,
                userId
            });
            return 0;
        }
    }

    /**
     * Device risk analizi
     */
    analyzeDeviceRisk(deviceInfo, sessionHistory = []) {
        try {
            let riskScore = 0;
            const riskFactors = [];

            // Platform kontrolü
            if (!deviceInfo.platform || deviceInfo.platform === 'unknown') {
                riskScore += 20;
                riskFactors.push('unknown_platform');
            }

            // Model kontrolü  
            if (!deviceInfo.model || deviceInfo.model === 'unknown') {
                riskScore += 15;
                riskFactors.push('unknown_model');
            }

            // Version kontrolü
            if (!deviceInfo.version || deviceInfo.version === 'unknown') {
                riskScore += 10;
                riskFactors.push('unknown_version');
            }

            // Session history analizi
            if (sessionHistory.length === 0) {
                riskScore += 25;
                riskFactors.push('new_device');
            } else if (sessionHistory.length < 5) {
                riskScore += 10;
                riskFactors.push('limited_history');
            }

            // Risk seviyesi belirleme
            let riskLevel = 'low';
            if (riskScore >= 50) {
                riskLevel = 'high';
            } else if (riskScore >= 25) {
                riskLevel = 'medium';
            }

            return {
                riskScore,
                riskLevel,
                riskFactors,
                recommendation: this._getRiskRecommendation(riskLevel)
            };

        } catch (error) {
            logger.error('Error analyzing device risk', {
                error: error.message,
                deviceInfo
            });
            return {
                riskScore: 100,
                riskLevel: 'high',
                riskFactors: ['analysis_error'],
                recommendation: 'require_additional_verification'
            };
        }
    }

    /**
     * Risk seviyesine göre öneriler
     */
    _getRiskRecommendation(riskLevel) {
        const recommendations = {
            'low': 'allow_normal_access',
            'medium': 'require_email_verification',
            'high': 'require_multi_factor_authentication'
        };

        return recommendations[riskLevel] || 'deny_access';
    }
}

module.exports = new DeviceService(); 