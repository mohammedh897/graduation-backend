const express = require('express');
const router = express.Router();
const fileController = require('../controllers/projectFilesController');
const upload = require('../middleware/upload');
const auth = require('../middleware/verifyToken');

// Upload a file
router.post('/projects/:projectId/files/upload', auth, upload.single('file'), fileController.uploadFile);

// List files
router.get('/projects/:projectId/files/list', auth, fileController.getProjectFiles);

// Download a file
router.get('/projects/:projectId/files/:id/download', auth, fileController.downloadFile);

// Delete a file
router.delete('/projects/:projectId/files/:id/delete', auth, fileController.deleteFile);

module.exports = router;
