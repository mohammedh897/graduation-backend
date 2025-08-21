const Task = require('../models/Task');
const Project = require('../models/Project');
const response = require("../utils/response");

// Create a task
exports.createTask = async (req, res) => {
    try {
        const { title, description, assignedTo, dueDate, reminderDate } = req.body;
        const userId = req.user.id;

        // 1️⃣ Find the project of the logged-in user
        const project = await Project.findOne({
            $or: [{ leader: userId }, { members: userId }]
        });

        if (!project) {
            return response.error(res, "You are not part of any project", 403);
        }

        // 2️⃣ Default assignedTo = yourself
        let targetUser = assignedTo || userId;

        // 3️⃣ Validate assignedTo is part of the same project
        if (!project.members.includes(targetUser) && project.leader.toString() !== targetUser.toString()) {
            return response.error(res, "Cannot assign tasks outside your project", 403);
        }

        // 4️⃣ Create task
        const newTask = new Task({
            title,
            description,
            projectId: project._id,
            assignedBy: userId,
            assignedTo: targetUser,
            dueDate,
            reminderDate
        });

        const saved = await newTask.save();

        return response.success(res, "Task created successfully", saved, 201);
    } catch (error) {
        return response.error(res, error.message, 500);
    }
};

// Get all tasks for project
exports.getProjectTasks = async (req, res) => {
    try {
        const userId = req.user.id;

        const project = await Project.findOne({
            $or: [{ leader: userId }, { members: userId }]
        });

        if (!project) {
            return response.error(res, "You are not part of any project", 403);
        }

        const tasks = await Task.find({ projectId: project._id })
            .populate('assignedBy', 'username email')
            .populate('assignedTo', 'username email');

        return response.success(res, "Project tasks retrieved", tasks);
    } catch (error) {
        return response.error(res, error.message, 500);
    }
};

// Update task
exports.updateTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        const task = await Task.findById(taskId);
        if (!task) return response.error(res, "Task not found", 404);

        const project = await Project.findById(task.projectId);
        if (!project.members.includes(userId) && project.leader.toString() !== userId.toString()) {
            return response.error(res, "You cannot update tasks outside your project", 403);
        }

        Object.assign(task, req.body, { updatedAt: Date.now() });
        const updated = await task.save();

        return response.success(res, "Task updated", updated);
    } catch (error) {
        return response.error(res, error.message, 500);
    }
};

// Delete task
exports.deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const userId = req.user.id;

        const task = await Task.findById(taskId);
        if (!task) return response.error(res, "Task not found", 404);

        const project = await Project.findById(task.projectId);
        if (!project.members.includes(userId) && project.leader.toString() !== userId.toString()) {
            return response.error(res, "You cannot delete tasks outside your project", 403);
        }

        await Task.findByIdAndDelete(taskId);

        return response.success(res, "Task deleted successfully");
    } catch (error) {
        return response.error(res, error.message, 500);
    }
};

exports.getMyTaskSummary = async (userId) => {
    const tasks = await Task.find({
        $or: [
            { assignedBy: userId },
            { assignedTo: userId }
        ]
    });

    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = tasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = tasks.filter(t => t.status === 'Pending').length;
    const completionPercentage = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);


    return {
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionPercentage
    };
};
