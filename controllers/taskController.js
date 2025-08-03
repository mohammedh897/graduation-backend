const Task = require('../models/Task');

// POST handler
exports.createTask = async (req, res) => {
    try {
        const newTask = new Task({
            title: req.body.task,
            userId: req.user.userId,// pulled from the decoded token
            dueDate: req.body.dueDate,
            reminderDate: req.body.reminderDate
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
        const userId = req.user.userId;
        const { status, dueToday, overdue, reminderToday } = req.query;

        const query = { userId };

        // ✅ Filter by status
        if (status) {
            query.status = status;
        }

        // ✅ Filter for due today
        if (dueToday === 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            query.dueDate = { $gte: today, $lt: tomorrow };
        }

        // ✅ Filter for overdue
        if (overdue === 'true') {
            const now = new Date();
            query.dueDate = { $lt: now };
            query.status = { $ne: 'Completed' }; // optional: don't include completed
        }

        // ✅ Filter for reminders today
        if (reminderToday === 'true') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);

            const tomorrow = new Date(today);
            tomorrow.setDate(today.getDate() + 1);

            query.reminderDate = { $gte: today, $lt: tomorrow };
        }

        const tasks = await Task.find(query);
        res.json(tasks);

    } catch (error) {
        res.status(500).json({ error: '❌ Failed to fetch tasks', details: error.message });
    }
};

exports.updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const updates = {
            title: req.body.task,
            status: req.body.status,
            progress: req.body.progress,
            dueDate: req.body.dueDate,
            reminderDate: req.body.reminderDate,
            updatedAt: Date.now()
        }
        const updated = await Task.findOneAndUpdate(
            { _id: taskId, userId: req.user.userId }, // only allow owner
            updates,
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
exports.getProgressSummary = async (req, res) => {
    try {
        const userId = req.user.userId;

        const allTasks = await Task.find({ userId });

        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
        const inProgressTasks = allTasks.filter(t => t.status === 'In Progress').length;
        const PendingTasks = allTasks.filter(t => t.status === 'Pending').length;

        const completionPercentage = totalTasks === 0
            ? 0
            : Math.round((completedTasks / totalTasks) * 100);

        res.json({
            totalTasks,
            completedTasks,
            inProgressTasks,
            PendingTasks,
            completionPercentage
        });

    } catch (error) {
        res.status(500).json({ error: '❌ Failed to get progress summary', details: error.message });
    }
};
