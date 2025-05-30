const authService = require('../services/auth.service');
const { logger } = require('../../../../shared/utils/logger');
const errorMessages = require('../../../../shared/config/errorMessages');

class AuthController {
    constructor() {
        this.authService = authService;
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
                throw new ValidationError(errorMessages.EMPTY_DATA);
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
}

module.exports = new AuthController();
