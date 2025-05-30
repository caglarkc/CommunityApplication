const textUtils = require('../../../../shared/utils/textUtils');

const validateRegister = (data) => {
    textUtils.validateName(data.name);
    textUtils.validateSurname(data.surname);
    textUtils.validateEmail(data.email);
    textUtils.validatePhone(data.phone);
    textUtils.validatePassword(data.password);
}

module.exports = {
    validateRegister
}
