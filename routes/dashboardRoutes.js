const express = require('express');
const router = express.Router();
const { getDashboard } = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/verifyToken'); // middleware to decode JWT

router.get('/', authMiddleware, getDashboard);

module.exports = router;
