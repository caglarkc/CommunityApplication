const mongoose = require('mongoose');

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
        required: true
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
        ref: 'User',
        default: []
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
            category: {
                type: String,
                enum: ['member_management', 'content_management', 'community_settings', 'event_management', 'file_management', 'communication_management', 'role_management', 'survey_management', 'point_system',"other"],
                required: true
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
                category: "community_settings",
                isDefault: true
            }],
            ["only_read", {
                description: "Sadece okuma yetkisi",
                category: "content_management",
                isDefault: true
            }]
        ])
    },
    // 📤 Dosya URL'leri
    presidentDocumentUrl: {
        type: String,
        default: null
    },
    logoUrl: {
        type: String,
        default: null
    },
    coverPhotoUrl: {
        type: String,
        default: null
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
    
    
}, { timestamps: true });


module.exports = mongoose.model('Community', communitySchema);