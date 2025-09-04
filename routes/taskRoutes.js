const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const adminMiddleware = require('../middleware/adminMiddleware');

const Task = require('../models/Task');
const {
    createTask,
    getProjectTasks,
    updateTask,
    deleteTask
} = require('../controllers/taskController');

const router = express.Router();

//  Create a task (self or assign to teammate in your project)
router.post('/task', verifyToken, createTask);

//  Get all tasks for your project
router.get('/tasks', verifyToken, getProjectTasks);

//  Update a task
router.put('/task/:id', verifyToken, updateTask);

//  Delete a task
router.delete('/task/:id', verifyToken, deleteTask);

//  Get project progress summary
// router.get('/projects/:projectId/progress', verifyToken, getProjectProgressSummary);
// router.get('/tasks/progress', verifyToken, getProgressSummary);

// Admin: get all tasks across projects
router.get('/admin/tasks', verifyToken, adminMiddleware, async (req, res) => {
    const tasks = await Task.find()
        .populate('assignedBy', 'username email')
        .populate('assignedTo', 'username email')
        .populate('projectId', 'projectName');
    res.json(tasks);
});

module.exports = router;
