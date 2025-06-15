const errorMessages = require('../config/errorMessages');
const ValidationError = require('../utils/errors/ValidationError');
const ConflictError = require('../utils/errors/ConflictError');
const validator = require('validator');
const dotenv = require('dotenv');
dotenv.config();


const validateName = (name) => {
    if (!name) {
        throw new ValidationError(errorMessages.INVALID.INVALID_NAME);
    }
    if (name.length < 3 || name.length > 50) {
        throw new ValidationError(errorMessages.INVALID.INVALID_NAME_LENGTH);
    }
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(name)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_NAME_FORMAT);
    }
};

const validateSurname = (surname) => {
    if (!surname) {
        throw new ValidationError(errorMessages.INVALID.INVALID_SURNAME);
    }
    if (surname.length < 3 || surname.length > 50) {
        throw new ValidationError(errorMessages.INVALID.INVALID_SURNAME_LENGTH);
    }
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(surname)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_SURNAME_FORMAT);
    }
};

const validatePhone = (phone) => {
    if (!phone) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PHONE);
    }
    if (phone.length !== 10) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PHONE_LENGTH);
    }
    if (!/^[0-9]+$/.test(phone)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PHONE_NUMBER);
    }
    if (phone === process.env.CREATER_PHONE) {
        throw new ConflictError(errorMessages.CONFLICT.PHONE_ALREADY_EXISTS);
    }
};

const validateEmail = (email) => {
    if (!email) {
        throw new ValidationError(errorMessages.INVALID.INVALID_EMAIL);
    }
    if (!validator.isEmail(email)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_EMAIL_FORMAT);
    }
    if (email === process.env.CREATER_EMAIL) {
        throw new ConflictError(errorMessages.CONFLICT.EMAIL_ALREADY_EXISTS);
    }
};

const validatePassword = (password) => {
    if (!password) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD);
    }
    if (password.length < 8 || password.length > 20) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD_LENGTH);
    }
    if (!/[A-Z]/.test(password)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD_UPPERCASE);
    }
    
    if (!/[a-z]/.test(password)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD_LOWERCASE);
    }
    
    if (!/[0-9]/.test(password)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_PASSWORD_NUMBER);
    }
};

const validateUniversityName = (universityName) => {
    if (!universityName) {
        throw new ValidationError(errorMessages.INVALID.INVALID_UNIVERSITY_NAME);
    }
    if (universityName.length < 3 || universityName.length > 80) {
        throw new ValidationError(errorMessages.INVALID.INVALID_UNIVERSITY_NAME_LENGTH);
    }
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(universityName)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_UNIVERSITY_NAME_FORMAT);
    }
}

const validateUniversityDepartment = (universityDepartment) => {
    if (!universityDepartment) {
        throw new ValidationError(errorMessages.INVALID.INVALID_UNIVERSITY_DEPARTMENT);
    }
    if (universityDepartment.length < 3 || universityDepartment.length > 50) {
        throw new ValidationError(errorMessages.INVALID.INVALID_UNIVERSITY_DEPARTMENT_LENGTH);
    }
    if (!/^[a-zA-ZçÇğĞıİöÖşŞüÜ\s]+$/.test(universityDepartment)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_UNIVERSITY_DEPARTMENT_FORMAT);
    }
}

const validateClass = (classYear) => {
    if (!classYear) {
        throw new ValidationError(errorMessages.INVALID.INVALID_CLASS);
    }
    if (!['1', '2', '3', '4', '5', '6', 'Hazırlık', 'Yüksek Lisans', 'Doktora'].includes(classYear)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_CLASS_TYPE);
    }
}

const validateStatus = (status) => {
    if (!status) {
        throw new ValidationError(errorMessages.INVALID.INVALID_STATUS);
    }
    if (!['user', 'leader_of_community', 'member_of_community', 'admin'].includes(status)) {
        throw new ValidationError(errorMessages.INVALID.INVALID_STATUS_VALUE);
    }
}

const validateDescription = (description) => {
    if (!description) {
        throw new ValidationError(errorMessages.INVALID.INVALID_DESCRIPTION);
    }
    if (description.length < 3 || description.length > 500) {
        throw new ValidationError(errorMessages.INVALID.INVALID_DESCRIPTION_LENGTH);
    }
}

module.exports = {
    validateName,
    validatePassword,
    validateEmail,
    validatePhone,
    validateSurname,
    validateUniversityName,
    validateUniversityDepartment,
    validateClass,
    validateStatus,
    validateDescription
};