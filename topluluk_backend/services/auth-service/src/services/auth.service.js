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
const successMessages = require('../../../../shared/config/successMessages');
const { getRedisClient } = require('../utils/database');
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




}

module.exports = new AuthService();
