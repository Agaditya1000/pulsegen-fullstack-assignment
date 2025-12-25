const mongoose = require('mongoose');

const VideoSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String },
    filename: { type: String, required: true },
    path: { type: String, required: true },
    uploader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    allowedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // For RBAC
    isPublic: { type: Boolean, default: false }, // For general access
    status: { type: String, enum: ['processing', 'safe', 'flagged'], default: 'processing' },
    riskScore: { type: Number, default: 0 },
    reasons: [{ type: String }],
    adminNotes: { type: String },
    size: { type: Number },
    duration: { type: Number },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Video', VideoSchema);
