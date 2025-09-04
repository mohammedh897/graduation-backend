const ProjectFile = require("../models/ProjectFile");
const mongoose = require("mongoose");
const Project = require("../models/Project");
const response = require("../utils/response");
const { uploadFile, downloadFile, deleteFileFromDrive } = require("../services/drive.service");

// ✅ Helper: retry once if Google token expired
async function withRetry(fn, ...args) {
    try {
        return await fn(...args);
    } catch (err) {
        if (err.code === 401 || err.message.includes("Invalid Credentials")) {
            console.warn("⚠️ Token expired, retrying...");
            return await fn(...args); // retry once (after refresh by drive.service)
        }
        throw err;
    }
}

// ✅ Upload a file
exports.uploadFile = async (req, res) => {
    try {
        const { projectId } = req.params;
        const userId = req.user.id;
        const file = req.file;

        if (!file) return response.error(res, "No file uploaded", 400);

        const project = await Project.findById(projectId);
        if (!project) return response.error(res, "Project not found", 404);

        // Upload file to Google Drive (with retry if token expired)
        const driveFile = await withRetry(uploadFile, file.buffer, file.originalname, process.env.GDRIVE_ROOT_FOLDER_ID);

        // Save metadata in DB
        const newFile = await ProjectFile.create({
            projectId,
            uploadedBy: userId,
            fileName: driveFile.name,
            mimeType: file.mimetype,
            size: file.size,
            driveFileId: driveFile.id,
        });

        return res.json({
            success: true,
            message: "File uploaded to Google Drive",
            file: newFile,
        });
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// ✅ List project files
exports.getProjectFiles = async (req, res) => {
    try {
        const { projectId } = req.params;

        const files = await ProjectFile.find({ projectId })
            .populate("uploadedBy", "username email");

        return response.success(res, "Project files retrieved", files);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// ✅ Download a file
exports.downloadFile = async (req, res) => {
    try {
        const { projectId, id: fileId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return response.error(res, "Invalid file ID", 400);
        }

        const file = await ProjectFile.findOne({ _id: fileId, projectId });
        if (!file) return response.error(res, "File not found in DB", 404);

        await withRetry(downloadFile, file.driveFileId, res);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// ✅ Delete a file
exports.deleteFile = async (req, res) => {
    try {
        const { projectId, id: fileId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(fileId)) {
            return response.error(res, "Invalid file ID", 400);
        }

        const file = await ProjectFile.findOne({ _id: fileId, projectId });
        if (!file) return response.error(res, "File not found", 404);

        await withRetry(deleteFileFromDrive, file.driveFileId);
        await ProjectFile.deleteOne({ _id: fileId });

        return res.json({ success: true, message: "File deleted successfully" });
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};
