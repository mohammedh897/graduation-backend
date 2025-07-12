const Task = require('../models/Task');

// POST handler
exports.createTask = async (req, res) => {
    try {
        const newTask = new Task({
            title: req.body.task,
            userId: req.user.userId, // pulled from the decoded token
        });

        const saved = await newTask.save();

        res.json({ message: '✅ Task saved to database!', task: saved });
    } catch (error) {
        res.status(500).json({
            error: '❌ Failed to save task',
            details: error.message,
        });
    }
};

// GET handler
exports.getAllTasks = async (req, res) => {
    try {
        const tasks = await Task.find({ userId: req.user.userId });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            error: '❌ Failed to fetch tasks',
            details: error.message,
        });
    }
};
exports.updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const updated = await Task.findOneAndUpdate(
            { _id: taskId, userId: req.user.userId }, // only allow owner
            { title: req.body.task },
            { new: true }
        );

        if (!updated) return res.status(404).json({ error: 'Task not found or not yours' });

        res.json({ message: '✅ Task updated!', task: updated });
    } catch (error) {
        res.status(500).json({ error: '❌ Failed to update task', details: error.message });
    }
};

// DELETE /task/:id - Delete a task
exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const deleted = await Task.findOneAndDelete({
            _id: taskId,
            userId: req.user.userId
        });

        if (!deleted) return res.status(404).json({ error: 'Task not found or not yours' });

        res.json({ message: '🗑️ Task deleted successfully!' });
    } catch (error) {
        res.status(500).json({ error: '❌ Failed to delete task', details: error.message });
    }
};