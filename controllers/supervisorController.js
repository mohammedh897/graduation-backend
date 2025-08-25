// controllers/supervisorController.js
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const response = require('../utils/response');

/**
 * Update supervisor availability status
 * Body: { status: "available" | "full" }
 */
const updateSupervisorStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const supervisorId = req.user.id; // From JWT payload

        // Validate input
        if (!status || !["available", "full"].includes(status)) {
            return response.error(res, "Invalid status value", 400);
        }

        const supervisor = await User.findById(supervisorId);
        // if (!supervisor || supervisor.userType !== 'Supervisor') {
        //     return response.error(res, "Not a supervisor", 403);
        // }

        supervisor.status = status;
        await supervisor.save();

        return response.success(res, "Status updated successfully", {
            id: supervisor._id,
            username: supervisor.username,
            status: supervisor.status
        });
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

/**
 * Get all available supervisors
 */
const getAvailableSupervisors = async (req, res) => {
    try {
        const supervisors = await User.find({
            userType: 'Supervisor',
            status: 'available'
        }).select('_id username email status');

        return response.success(res, "Available supervisors retrieved successfully", supervisors);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// Get all projects supervised by this supervisor
const getMyProjects = async (req, res) => {
    try {
        const projects = await Project.find({ supervisor: req.user.id })
            .populate('leader', 'username email')
            .populate('members', 'username email');

        return response.success(res, "Projects retrieved", projects);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// Get all students supervised by this supervisor
const getMyStudents = async (req, res) => {
    try {
        const projects = await Project.find({ supervisor: req.user.id })
            .populate('leader', 'username email')
            .populate('members', 'username email');

        // flatten unique students
        let students = [];
        projects.forEach(p => {
            students.push(p.leader, ...p.members);
        });

        // remove duplicates
        const unique = {};
        students.forEach(s => { if (s) unique[s._id] = s; });

        return response.success(res, "Students retrieved", Object.values(unique));
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};
const { getProjectProgressSummary, getProjectStatus } = require('./projectController');

const getTeamDetails = async (req, res) => {
    try {
        const supervisorId = req.user.id;
        const projectId = req.params.projectId;

        // Verify project belongs to this supervisor
        const project = await Project.findOne({ _id: projectId, supervisor: supervisorId })
            .populate('leader', 'username email')
            .populate('members', 'username email')
            .populate('supervisor', 'username email');

        if (!project) {
            return response.error(res, "Project not found or not supervised by you", 404);
        }

        // Get only summary (not tasks)
        const progressSummary = await getProjectProgressSummary(projectId);
        const projectStatus = await getProjectStatus(projectId);

        return response.success(res, "Team details retrieved", {
            project,
            progressSummary,
            projectStatus,
            finalPresentation: project.finalPresentation || {},

        });
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};


const getTeamTasks = async (req, res) => {
    try {
        const supervisorId = req.user.id;
        const projectId = req.params.projectId;

        // Verify supervisor owns the project
        const project = await Project.findOne({ _id: projectId, supervisor: supervisorId });
        if (!project) {
            return response.error(res, "Project not found or not supervised by you", 404);
        }

        const tasks = await Task.find({ projectId })
            .populate('assignedTo', 'username ')
            .sort({ createdAt: -1 });
        // Format tasks to include only necessary fields
        const formattedTasks = tasks.map(t => ({
            id: t._id,
            title: t.title,
            status: t.status,
            assignedTo: t.assignedTo ? { id: t.assignedTo._id, username: t.assignedTo.username } : null,
            // assignedTo: task.assignedTo?.username || "Unassigned"
            dueDate: t.dueDate,
        }));
        return response.success(res, "Project tasks retrieved", formattedTasks);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

const setMaxProjects = async (req, res) => {
    try {
        const supervisorId = req.user.id;

        // ensure only supervisors can call this
        const supervisor = await User.findById(supervisorId);
        // if (!supervisor || supervisor.userType !== "Supervisor") {
        //     return response.error(res, "Only supervisors can set max projects", 403);
        // }

        const { maxProjects } = req.body;
        if (!maxProjects || maxProjects < 1) {
            return response.error(res, "Max projects must be at least 1", 400);
        }

        supervisor.maxProjects = maxProjects;

        // check if already supervising too many
        const currentCount = await Project.countDocuments({ supervisor: supervisorId });
        if (supervisor.status !== "full") {
            supervisor.status = currentCount >= maxProjects ? "full" : "available";
        }

        await supervisor.save();

        return response.success(res, "Max projects updated", {
            maxProjects: supervisor.maxProjects,
            status: supervisor.status,
        });
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// Export  functions
module.exports = {
    updateSupervisorStatus,
    getAvailableSupervisors,
    getMyProjects,
    getMyStudents,
    getTeamDetails,
    getTeamTasks,
    setMaxProjects
};