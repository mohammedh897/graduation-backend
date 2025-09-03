const fs = require("fs");
const { google } = require("googleapis");
const { Readable } = require("stream");
const path = require("path");

// Load credentials and token
const CREDENTIALS_PATH = path.join(__dirname, "../credentials.json");
const TOKEN_PATH = path.join(__dirname, "../token.json");

const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH));
const token = JSON.parse(fs.readFileSync(TOKEN_PATH));

const { client_id, client_secret, redirect_uris } = credentials.installed;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
oAuth2Client.setCredentials(token);

const drive = google.drive({ version: "v3", auth: oAuth2Client });

/**
 * Upload a file to Google Drive
 * @param {Buffer} fileBuffer
 * @param {string} fileName
 * @param {string} folderId
 * @returns {Object} drive file metadata
 */
async function uploadFile(fileBuffer, fileName, folderId) {
    const media = {
        mimeType: "application/octet-stream",
        body: Readable.from(fileBuffer),
    };

    const response = await drive.files.create({
        requestBody: {
            name: fileName,
            parents: folderId ? [folderId] : [],
        },
        media,
    });

    return response.data;
}
/**
 * Stream a file from Google Drive to HTTP response with proper headers
 * @param {string} fileId - Google Drive file ID
 * @param {Object} res - Express response object
 */
async function downloadFile(fileId, res) {
    // Get file metadata (name, mimeType, size)
    const { data: metadata } = await drive.files.get({
        fileId,
        fields: "name, mimeType, size",
    });

    // Set headers so the browser/Postman treats it as a download
    res.setHeader("Content-Disposition", `attachment; filename="${metadata.name}"`);
    res.setHeader("Content-Type", metadata.mimeType);
    res.setHeader("Content-Length", metadata.size);

    // Optional: you can add a status code explicitly
    res.status(200);

    // Stream the file content
    const { data: fileStream } = await drive.files.get(
        { fileId, alt: "media" },
        { responseType: "stream" }
    );

    fileStream.pipe(res);
}


/**
 * Delete a file from Google Drive
 * @param {string} fileId
 */
async function deleteFileFromDrive(fileId) {
    await drive.files.delete({ fileId });
}

module.exports = {
    uploadFile,
    downloadFile,
    deleteFileFromDrive,
};
