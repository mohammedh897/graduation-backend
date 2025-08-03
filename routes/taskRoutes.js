const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const authMiddleware = require('../middleware/verifyToken');
const adminMiddleware = require('../middleware/adminMiddleware');


const Task = require('../models/Task');

const router = express.Router();
const { createTask, getAllTasks, updateTask, deleteTask, getProgressSummary } = require('../controllers/taskController');

// POST /task
router.post('/task', verifyToken, createTask);

// GET /tasks
router.get('/tasks', verifyToken, getAllTasks); // ← Make sure this is here

router.put('/task/:id', verifyToken, updateTask);

router.delete('/task/:id', verifyToken, deleteTask);

router.get('/tasks/progress', verifyToken, getProgressSummary);
router.get('/admin/tasks', authMiddleware, adminMiddleware, async (req, res) => {
    const tasks = await Task.find().populate('userId', 'username email');
    res.json(tasks);
});




module.exports = router;
