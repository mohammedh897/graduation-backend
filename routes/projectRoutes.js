const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const supervisorMiddleware = require('../middleware/supervisorMiddleware');

// const authMiddleware = require('../middleware/authMiddleware');
const auth = require('../middleware/verifyToken');

router.post('/create', auth, projectController.createProject);

router.post('/join', auth, projectController.joinProject);

router.get('/my-project', auth, projectController.getMyProject);

router.get('/members', auth, projectController.getProjectMembers);

router.put('/:projectId/final-presentation', auth, supervisorMiddleware, projectController.setFinalPresentation);

router.get('/:projectId/final-presentation', auth, projectController.getFinalPresentation);

module.exports = router;
