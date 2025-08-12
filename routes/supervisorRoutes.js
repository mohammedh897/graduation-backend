const express = require('express');
const router = express.Router();
const { updateSupervisorStatus, getAvailableSupervisors } = require('../controllers/supervisorController');
const verifyToken = require('../middleware/verifyToken'); // middleware to decode JWT

// Update supervisor's availability
router.put('/status', verifyToken, updateSupervisorStatus);

// Get available supervisors
router.get('/available', getAvailableSupervisors);

module.exports = router;
