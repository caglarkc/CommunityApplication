const mongoose = require('mongoose');

// Permission sub-schema
const permissionSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: false,
        default: null
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { _id: false });

// Role sub-schema
const roleSchema = new mongoose.Schema({
    permissions: [{
        type: String,
        required: true
    }],
    canDelete: {
        type: Boolean,
        default: true
    },
    isDefault: {
        type: Boolean,
        default: false
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    }
}, { _id: false });

const communitySchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true,
        default: null
    },
    universityName: {
        type: String,
        required: true,
        default: null
    },
    universityDepartment: {
        type: String,
        required: true,
        default: null
    },
    leaderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    membersIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    roles: {
        type: Map,
        of: roleSchema,
        default: () => new Map([
            ["leader", {
                permissions: ["all_access"],
                canDelete: false,
                isDefault: true
            }],
            ["member", {
                permissions: ["only_read"],
                canDelete: false,
                isDefault: true
            }]
        ])
    },
    rolePermissions: {
        type: Map,
        of: {
            description: {
                type: String,
                required: false,
                default: null
            },
            isDefault: {
                type: Boolean,
                default: false
            },
            createdBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                default: null
            }
        },
        default: () => new Map([
            ["all_access", {
                description: "Toplulukta tüm yetkiler (Sadece Leader)",
                isDefault: true
            }],
            ["only_read", {
                description: "Sadece okuma yetkisi",
                isDefault: true
            }]
        ])
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    
    
}, { timestamps: true });


module.exports = mongoose.model('Community', communitySchema);