const textUtils = require('../../../../shared/utils/textUtils');

const validateRegister = (data) => {
    textUtils.validateName(data.name);
    textUtils.validateSurname(data.surname);
    textUtils.validateEmail(data.email);
    textUtils.validatePhone(data.phone);
    textUtils.validatePassword(data.password);
    textUtils.validateStatus(data.status);

    if(data.status === 'leader_of_community') {
        textUtils.validateUniversityName(data.universityName);
        textUtils.validateUniversityDepartment(data.universityDepartment);
        textUtils.validateClass(data.classYear);
    }
    
}

const validateCommunityData = (data) => {
    textUtils.validateName(data.name);
    textUtils.validateDescription(data.description);
    textUtils.validateUniversityName(data.universityName);
    textUtils.validateUniversityDepartment(data.universityDepartment);
}


module.exports = {
    validateRegister,
    validateCommunityData
}
