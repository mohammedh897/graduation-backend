// controllers/supervisorController.js
const User = require('../models/User');
const Project = require('../models/Project');
const Task = require('../models/Task');
const response = require('../utils/response');
const { getProjectProgressSummary, getProjectStatus } = require('./projectController');

/**
 * Update supervisor availability status
 * Body: { status: "available" | "full" }
 */
//     try {
//         const { status } = req.body;
//         const supervisorId = req.user.id; // From JWT payload

//         // Validate input
//         if (!status || !["available", "full"].includes(status)) {
//             return response.error(res, "Invalid status value", 400);
//         }

//         const supervisor = await User.findById(supervisorId);
//         // if (!supervisor || supervisor.userType !== 'Supervisor') {
//         //     return response.error(res, "Not a supervisor", 403);
//         // }

//         supervisor.status = status;
//         await supervisor.save();

//         return response.success(res, "Status updated successfully", {
//             id: supervisor._id,
//             username: supervisor.username,
//             status: supervisor.status
//         });
//     } catch (err) {
//         return response.error(res, err.message, 500);
//     }
// };
// if (maxProjects !== undefined) {
//     const numMaxProjects = parseInt(maxProjects, 10);
//     if (isNaN(numMaxProjects) || numMaxProjects < 1) {
//         return response.error(res, "Max projects must be a number greater than 0", 400);
//     }
//     supervisor.maxProjects = numMaxProjects;
// }

// const { maxProjects } = req.body;
const updateSupervisorStatus = async (req, res) => {
    try {
        const { status, maxProjects } = req.body;
        const supervisorId = req.user.id; // From JWT payload

        const supervisor = await User.findById(supervisorId);
        // if (!supervisor) {
        //     return response.error(res, "Supervisor not found", 404);
        // }

        if (status) {
            if (!["available", "full"].includes(status)) {
                return response.error(res, "Invalid status value", 400);
            }
            supervisor.status = status;
        }

        if (!maxProjects || maxProjects < 1) {
            return response.error(res, "Max projects must be at least 1", 400);
        }

        supervisor.maxProjects = maxProjects;

        // check if already supervising too many
        const currentCount = await Project.countDocuments({ supervisor: supervisorId });
        if (supervisor.status !== "full") {
            // supervisor.status = currentCount >= maxProjects ? "full" : "available";
            if (currentCount >= maxProjects) {
                supervisor.status = "full";
                return response.error(res, ` Supervisor already has ${currentCount} projects, cannot assign more`, 400);
            } else {
                supervisor.status = "available";
            }
        }

        await supervisor.save();

        return response.success(res, "Settings updated successfully", {
            id: supervisor._id,
            username: supervisor.username,
            status: supervisor.status,
            maxProjects: supervisor.maxProjects
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
const mongoose = require("mongoose");
const Discussion = require("../models/Discussion");

const getMyProjects = async (req, res) => {
    try {
        // 1) fetch projects for this supervisor
        const projects = await Project.find({ supervisor: req.user.id }).lean();
        const projectIds = projects.map((p) => p._id);

        // 2) aggregate to get the single last message per project (across all Discussion docs)
        const lastMessagesAgg = await Discussion.aggregate([
            { $match: { projectId: { $in: projectIds } } },     // only discussions for these projects
            { $unwind: "$messages" },                           // one document per message
            { $sort: { "messages.createdAt": -1 } },            // newest messages first
            {
                $group: {
                    _id: "$projectId",                              // group by project
                    lastMessage: { $first: "$messages" }           // pick the newest message
                }
            },
            {
                $project: {
                    projectId: "$_id",
                    lastMessage: {
                        content: "$lastMessage.content",
                        createdAt: "$lastMessage.createdAt"
                    },
                    _id: 0
                }
            }
        ]);

        // 3) map aggregated results for quick lookup
        const lastMessageMap = new Map();
        for (const item of lastMessagesAgg) {
            lastMessageMap.set(String(item.projectId), item.lastMessage);
        }

        // 4) build projects array with status/progress and lastMessage (do in parallel)
        const projectsWithStatus = await Promise.all(
            projects.map(async (p) => {
                const status = await getProjectStatus(p._id);
                const { completionPercentage } = await getProjectProgressSummary(p._id);

                const lm = lastMessageMap.get(String(p._id)) || null;
                const lastMessage = lm
                    ? { content: lm.content, time: lm.createdAt }
                    : null;

                return {
                    id: p._id,
                    projectName: p.projectName,
                    projectStatus: status,
                    completionPercentage,
                    lastMessage,
                    // optional: include project update time to tiebreak sorting
                    projectUpdatedAt: p.updatedAt || p.createdAt || null
                };
            })
        );

        // 5) sort descending by last message time; fallback to projectUpdatedAt, then latest created
        projectsWithStatus.sort((a, b) => {
            const aTime = a.lastMessage ? new Date(a.lastMessage.time).getTime()
                : a.projectUpdatedAt ? new Date(a.projectUpdatedAt).getTime() : 0;
            const bTime = b.lastMessage ? new Date(b.lastMessage.time).getTime()
                : b.projectUpdatedAt ? new Date(b.projectUpdatedAt).getTime() : 0;
            return bTime - aTime;
        });

        return response.success(res, "Projects retrieved", {
            totalTeams: projectsWithStatus.length,
            projects: projectsWithStatus
        });
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
            finalPresentation: project.finalPresentation || null,

        });
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

const getTeamTasks = async (req, res) => {
    try {
        const supervisorId = req.user.id;
        const { projectId } = req.params;

        // Verify supervisor owns the project
        const project = await Project.findOne({ _id: projectId, supervisor: supervisorId });
        if (!project) {
            return response.error(res, "Project not found or not supervised by you", 404);
        }

        const tasks = await Task.find({ projectId })
            .populate('assignedTo', 'username')
            .sort({ createdAt: -1 });

        const now = new Date();

        const formattedTasks = tasks.map(t => {
            const isOverdue = t.dueDate && t.dueDate < now && t.status !== 'Completed';
            const status = isOverdue ? 'Overdue' : t.status;

            return {
                id: t._id,
                title: t.title,
                status,
                isOverdue, // helpful for frontend badges
                assignedTo: t.assignedTo ? { id: t.assignedTo._id, username: t.assignedTo.username } : null,
                dueDate: t.dueDate,
            };
        });

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