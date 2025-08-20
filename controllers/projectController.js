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