const express = require('express');
const router = express.Router();
const { updateSupervisorStatus, getAvailableSupervisors, getMyProjects, getMyStudents, getTeamDetails, getTeamTasks, setMaxProjects } = require('../controllers/supervisorController');
const verifyToken = require('../middleware/verifyToken'); // middleware to decode JWT
const supervisorMiddleware = require('../middleware/supervisorMiddleware');

// Update supervisor's availability
router.put('/status', verifyToken, supervisorMiddleware, updateSupervisorStatus);

// Get available supervisors
router.get('/available', verifyToken, supervisorMiddleware, getAvailableSupervisors);

// Get projects for the logged-in supervisor
router.get('/projects', verifyToken, supervisorMiddleware, getMyProjects);

// Get students for the logged-in supervisor
router.get('/students', verifyToken, supervisorMiddleware, getMyStudents);

router.get('/team/:projectId', verifyToken, supervisorMiddleware, getTeamDetails);

router.get('/tasks/:projectId', verifyToken, supervisorMiddleware, getTeamTasks);

router.put('/max-projects', verifyToken, supervisorMiddleware, setMaxProjects);


module.exports = router;
