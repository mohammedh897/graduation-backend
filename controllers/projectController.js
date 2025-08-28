const Project = require('../models/Project');
const User = require('../models/User');
const Task = require('../models/Task');
const generateTeamCode = require('../utils/generateCode');
const response = require('../utils/response'); // Your success/error wrapper

exports.createProject = async (req, res) => {
    try {
        const { projectName, description, supervisorId, emails } = req.body;
        const leaderId = req.user.id; // Comes from auth middleware

        const existingProject = await Project.findOne({
            $or: [
                { leader: leaderId },
                { members: leaderId }
            ]
        });

        if (existingProject) {
            return response.error(res, "You are already in a project", 400);
        }


        // 1. Validate inputs
        if (!projectName || !supervisorId) {
            console.log("📥 Incoming body:", req.body);
            return response.error(res, "Project name and supervisor are required", 400);
        }


        // 2. Check supervisor exists & is available
        const supervisor = await User.findById(supervisorId);
        if (!supervisor || supervisor.userType !== 'Supervisor') {
            return response.error(res, "Invalid supervisor", 400);
        }
        if (supervisor.status !== 'available') {
            return response.error(res, "Supervisor not available", 400);
        }

        // 3. Generate unique team code
        let teamCode;
        let exists;
        do {
            teamCode = generateTeamCode();
            exists = await Project.findOne({ teamCode });
        } while (exists);

        // 4. Create project
        const project = new Project({
            projectName,
            description,
            supervisor: supervisorId,
            leader: leaderId,
            members: [leaderId],
            teamCode
        });

        await project.save();



        supervisor.currentProjects += 1;
        if (supervisor.currentProjects >= supervisor.maxProjects) {
            supervisor.status = 'full';
        }
        await supervisor.save();

        // 5. Send invitation emails (pseudo-code, we can integrate Nodemailer later)
        const { sendProjectInviteEmail } = require('../utils/mailer');

        if (Array.isArray(emails) && emails.length > 0) {
            console.log(`📧 Sending invites to: ${emails.join(', ')} with code: ${teamCode}`);
            for (let email of emails) {
                await sendProjectInviteEmail(email, projectName, teamCode);
            }
        }


        return response.success(res, "Project created successfully", {
            projectId: project._id,
            teamCode
        }, 201);

    } catch (err) {
        console.error(err);
        return response.error(res, err.message, 500);
    }
};

exports.joinProject = async (req, res) => {
    try {
        const { teamCode } = req.body;
        const userId = req.user.id; // from JWT
        const existingProject = await Project.findOne({
            $or: [
                { leader: userId },
                { members: userId }
            ]
        });

        if (existingProject) {
            return response.error(res, "You are already in a project", 400);
        }

        // 1. Find the project
        const project = await Project.findOne({ teamCode });
        if (!project) {
            return response.error(res, "Invalid team code", 404);
        }

        // 2. Check if already a member
        // if (project.members.includes(userId) || project.leader.toString() === userId) {
        //     return response.error(res, "You are already part of this project", 400);
        // }

        if (project.members.length >= 4) {
            return response.error(res, "This project already has 4 members", 400);
        }

        // Add user
        project.members.push(userId);

        // If team is now full, update status
        if (project.members.length >= 4) {
            project.status = "full";
        }

        await project.save();

        // 3. Add the member
        // project.members.push(userId);
        // await project.save();

        return response.success(res, "Joined project successfully", project);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};


exports.getMyProject = async (req, res) => {
    try {
        const userId = req.user.id; // comes from JWT middleware

        const project = await Project.findOne({
            $or: [
                { leader: userId },
                { members: userId }
            ]
        })
            .populate('supervisor', 'username email')
            .populate('leader', 'username email')
            .populate('members', 'username email');

        if (!project) {
            return response.success(res, "No project found", null);
        }

        return response.success(res, "Project retrieved", project);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};
exports.getProjectProgressSummary = async (projectId) => {
    // Make sure project exists
    const project = await Project.findById(projectId);
    if (!project) {
        throw new Error("Project not found");
    }

    // Get all tasks in this project
    const allTasks = await Task.find({ projectId });

    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Completed').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'In Progress').length;
    const pendingTasks = allTasks.filter(t => t.status === 'Pending').length;

    const completionPercentage = totalTasks === 0
        ? 0
        : Math.round((completedTasks / totalTasks) * 100);

    return {
        projectId,
        totalTasks,
        completedTasks,
        inProgressTasks,
        pendingTasks,
        completionPercentage
    };

};

exports.getProjectMembers = async (req, res) => {
    try {
        const userId = req.user.id; // from JWT

        // Find project where this user is a leader or member
        const project = await Project.findOne({
            $or: [{ leader: userId }, { members: userId }]
        }).populate('members', 'username email');


        if (!project) {
            return response.error(res, "Project not found or you are not part of any project", 404);
        }

        // Merge leader + members into one array


        return response.success(res, "Project members retrieved", project.members);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// Supervisor sets final presentation schedule
exports.setFinalPresentation = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { date } = req.body;
        // let date = new Date(req.body.date);
        // date.setUTCHours(0, 0, 0, 0);  // force midnight UTC

        const project = await Project.findById(projectId);
        if (!project) return response.error(res, "Project not found", 404);

        // // ✅ Only supervisor of this project can set schedule
        // if (project.supervisor.toString() !== req.user.id) {
        //     return response.error(res, "Not authorized", 403);
        // }

        project.finalPresentation = { date };
        await project.save();

        return response.success(res, "Final presentation scheduled", project.finalPresentation);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// Anyone in the project (students/supervisor) can view it
exports.getFinalPresentation = async (req, res) => {
    try {
        const { projectId } = req.params;

        const project = await Project.findById(projectId)
            .populate('supervisor', 'username email');

        if (!project) return response.error(res, "Project not found", 404);

        return response.success(res, "Final presentation details", project.finalPresentation);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

exports.getSupervisedProjects = async (supervisorId) => {
    return await Project.find({ supervisor: supervisorId })
        .populate('leader', 'username email')
        .populate('members', 'username email');
};
exports.getUpcomingDiscussions = async (supervisorId, days = 7) => {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + days);

    // Count all upcoming discussions (any future date)
    const allUpcoming = await Project.countDocuments({
        supervisor: supervisorId,
        "finalPresentation.date": { $gte: today }
    });

    // Check if any are within the next X days
    const withinNextWeek = await Project.countDocuments({
        supervisor: supervisorId,
        "finalPresentation.date": { $gte: today, $lte: nextWeek }
    });

    // Return both count + a hover message
    return {
        count: allUpcoming,
        message: withinNextWeek > 0
            ? `There is an upcoming discussion within ${days} days`
            : `No discussions within the next ${days} days`
    };
};

// exports.getUpcomingDiscussions = async (supervisorId) => {
//     const projects = await Project.find({
//         supervisor: supervisorId,
//         "finalPresentation.date": { $gte: new Date() }
//     }).select('finalPresentation.date');

//     if (!projects.length) return { count: 0, nextDate: null };

//     const nextDate = projects
//         .map(p => p.finalPresentation.date)
//         .sort((a, b) => a - b)[0];

//     return { count: projects.length, nextDate };
// };

// ✅ Get recent projects for a supervisor
exports.getRecentProjects = async (supervisorId, limit = 3) => {
    const recentProjects = await Project.find({ supervisor: supervisorId })
        .sort({ updatedAt: -1 })
        .limit(limit)
        .select('projectName updatedAt');

    return recentProjects;
};

// ✅ Get project status (On Track / Needs Attention)
exports.getProjectStatus = async (projectId) => {
    const totalTasks = await Task.countDocuments({ projectId });

    if (totalTasks === 0) {
        return "On Track"; // nothing overdue yet
    }

    const overdueTasks = await Task.countDocuments({
        projectId,
        dueDate: { $lt: new Date() },
        status: { $ne: 'Completed' }
    });

    // "Needs Attention" only if > 50% of tasks are overdue
    if (overdueTasks / totalTasks > 0.5) {
        return "Needs Attention";
    }

    return "On Track";
};
