const { logger } = require('./logger');
const ValidationError = require('./errors/ValidationError');
const NotFoundError = require('./errors/NotFoundError');
const ConflictError = require('./errors/ConflictError');

/**
     * Hata durumlarını yönetmek için yardımcı metod
     * @param {Error} error - Yakalanan hata
     * @param {String} errorMessage - Kullanıcıya gösterilecek hata mesajı
     */
const handleError = (error, errorMessage) => {
        
    // Hatayı logla
    logger.error(errorMessage, { 
        error: error.message, 
        stack: error.stack
    });

    // Hata mesajında anahtar kelimeler var mı diye kontrol et
    const errorMsg = error.message && error.message.toLowerCase();
    
    if (errorMsg && errorMsg.includes('bulunamadı')) {
        throw new NotFoundError(errorMessage);
    } else if (errorMsg && (errorMsg.includes('zaten var') || errorMsg.includes('already exists'))) {
        throw new ConflictError(errorMessage);
    } else if (errorMsg && (errorMsg.includes('geçersiz') || errorMsg.includes('invalid'))) {
        throw new ValidationError(errorMessage);
    } else if (error instanceof ValidationError || error instanceof NotFoundError || error instanceof ConflictError) {
        // Zaten tiplendirilmiş hata ise aynen fırlat
        throw error;
    } else {
        // Tiplendirilmemiş hatalar için, mesaja göre hata tipi oluştur
        if (errorMessage.toLowerCase().includes('bulunamadı')) {
            throw new NotFoundError(errorMessage);
        } else {
            throw new Error(errorMessage);
        }
    }
}

const handleErrorWithType = (response, adminId, errorMessage) => {

    logger.error(errorMessage, { 
        adminId,
        error: response.message 
    });

    // Hata nesnesine ek veri ekliyoruz
    const errorData = {
        id: response.id || adminId,
        receivedData: response.receivedData,
        timestamp: response.timestamp || new Date().toISOString()
    };

    if (response.error === 'ValidationError') {
        const error = new ValidationError(errorMessage);
        error.data = errorData;
        throw error;
    } else if (response.error === 'NotFoundError') {
        const error = new NotFoundError(errorMessage);
        error.data = errorData;
        throw error;
    } else if (response.error === 'ConflictError') {
        const error = new ConflictError(errorMessage);
        error.data = errorData;
        throw error;
    } else {
        const error = new Error(errorMessage);
        error.data = errorData;
        throw error;
    }        
    
}

const handleSuccess = (data, successMessage, logMessage = null) => {

    logger.info(logMessage || successMessage, { 
        data,
        success: true
    });

    return {
        success: true,
        message: successMessage,
        data: data
    };
}

module.exports = {
    handleError,
    handleErrorWithType,
    handleSuccess
}