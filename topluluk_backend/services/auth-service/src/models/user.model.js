const mongoose = require('mongoose');


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    phone: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    isLoggedIn: {
        type: Boolean,
        default: false
    },
    isActive: {
        type: Boolean,
        default: false
    },
    lastActiveAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['active', 'notVerified', 'blocked' , 'deleted'],
        default: 'notVerified'
    }
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);