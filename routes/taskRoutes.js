const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();
const { createTask, getAllTasks, updateTask, deleteTask } = require('../controllers/taskController');

// POST /task
router.post('/task', verifyToken, createTask);

// GET /tasks
router.get('/tasks', verifyToken, getAllTasks); // ← Make sure this is here

router.put('/task/:id', verifyToken, updateTask);

router.delete('/task/:id', verifyToken, deleteTask);

module.exports = router;
