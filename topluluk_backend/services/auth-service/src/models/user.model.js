const mongoose = require('mongoose');

// Community membership sub-schema
const communityMembershipSchema = new mongoose.Schema({
    communityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    role: {
        type: String,
        enum: ['member', 'leader', 'admin'],
        default: 'member'
    },
    joinedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'banned'],
        default: 'pending'
    }
}, { _id: false }); // _id: false to avoid nested _id

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    universityName: {
        type: String,
        required: false,
        default: null
    },
    universityDepartment: {
        type: String,
        required: false,
        default: null
    },
    classYear: {
        type: String,
        required: false,
        default: null
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
    isVerified: {
        type: String,
        enum: ['notVerified', 'verified', 'blocked', 'deleted'],
        default: 'notVerified'
    },
    lastLoginAt: {
        type: Date,
        default: null
    },
    status: {
        type: String,
        enum: ['user', 'leader_of_community', 'member_of_community', 'admin'],
        default: 'user'
    },
    // 🔥 NEW: Multiple community memberships
    communities: {
        type: [communityMembershipSchema],
        default: []
    },

    leaderCommunityId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    }
    
    
}, { timestamps: true });


module.exports = mongoose.model('User', userSchema);