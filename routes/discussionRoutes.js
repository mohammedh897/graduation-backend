const express = require('express');
const router = express.Router();
const discussionController = require('../controllers/discussionController');
const auth = require('../middleware/verifyToken'); // JWT middleware

// ✅ Get all messages for a project
// GET /discussions/:projectId
router.get('/:projectId', auth, discussionController.getProjectMessages);

module.exports = router;
