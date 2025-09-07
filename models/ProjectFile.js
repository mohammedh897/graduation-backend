const mongoose = require('mongoose');

const projectFileSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

    fileName: { type: String, required: true },
    mimeType: { type: String },
    size: { type: Number },

    driveFileId: { type: String, required: true },

    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ProjectFile', projectFileSchema);
