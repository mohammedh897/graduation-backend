const express = require('express');
const router = express.Router();
const { createProject, getProjectMembers } = require('../controllers/projectController');
const { joinProject } = require('../controllers/projectController');
const { getMyProject } = require('../controllers/projectController');
// const authMiddleware = require('../middleware/authMiddleware');
const auth = require('../middleware/verifyToken');

router.post('/create', auth, createProject);

router.post('/join', auth, joinProject);

router.get('/my-project', auth, getMyProject);

router.get('/members', auth, getProjectMembers);

module.exports = router;
