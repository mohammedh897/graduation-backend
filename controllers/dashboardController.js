const Project = require('../models/Project');
const User = require('../models/User');
const response = require('../utils/response');
const { getProjectProgressSummary } = require('../controllers/projectController');

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id; // from JWT
        const user = await User.findById(userId);

        if (!user) return response.error(res, "User not found", 404);

        let data = {};

        if (user.userType === 'Student') {
            const project = await Project.findOne({
                $or: [{ leader: userId }, { members: userId }]
            })
                .populate('supervisor', 'username email status')
                .populate('leader', 'username email')
                .populate('members', 'username email')

            if (project) {
                // Call the progress summary function and attach its value
                const { getMyTaskSummary } = require('../controllers/taskController');
                const progressSummary = await getProjectProgressSummary(project._id);
                const myTaskSummary = await getMyTaskSummary(userId);
                // const projectTasks = await getProjectTasks(userId)
                //     .select('id title dueDate status assignedTo'); // only needed fields
                // , finalPresentation: project.finalPresentation || null 
                data = { role: "Student", ...project.toObject(), progressSummary, myTaskSummary };
            }
        }


        if (user.userType === 'Supervisor') {
            const { getSupervisedProjects, getUpcomingDiscussions, getProjectProgressSummary, getProjectStatus, getRecentProjects } = require('./projectController');
            const supervisedProjects = await getSupervisedProjects(userId);
            const upcomingDiscussions = await getUpcomingDiscussions(userId);
            const supervisedTeams = await Promise.all(
                supervisedProjects.map(async (p) => ({
                    id: p._id,
                    projectName: p.projectName,
                    // leader: p.leader.username,
                    // members: p.members.map(m => m.username),
                    status: p.status,
                    completionPercentage: (await getProjectProgressSummary(p._id)).completionPercentage,
                    finalPresentation: p.finalPresentation || null,
                    ProjectStatus: await getProjectStatus(p._id)


                }))
            );
            const recentActivity = await getRecentProjects(userId, 3);
            // const ProjectStatus = await getProjectStatus(Project._id);
            data = {
                role: "Supervisor",
                status: user.status,
                totalTeams: supervisedTeams.length,
                maxProjects: user.maxProjects,
                upcomingDiscussions,
                recentActivity,
                // ProjectStatus,
                supervisedTeams
            };
        }

        // const projects = await Project.find({ supervisor: userId })
        //     .populate('leader', 'username email')
        //     .populate('members', 'username email')

        // const projectsWithSummary = await Promise.all(
        //     projects.map(async (p) => {
        //         const progressSummary = await getProjectProgressSummary(p._id);
        //         return { ...p.toObject(), progressSummary };
        //     })
        // );
        // const upcomingDiscussions = await Project.countDocuments({
        //     supervisor: supervisorId,
        //     discussionDate: { $gte: new Date() }
        // });


        //     data = {
        //         role: "Supervisor",
        //         status: user.status,
        //         totalTeams: projects.length,
        //         // upcomingDiscussions: upcomingDiscussions,
        //         upcomingDiscussions: projects.filter(p => p.finalPresentation && p.finalPresentation >= new Date()).length,
        //         supervisedTeams: projects.map(p => ({
        //             id: p._id,
        //             finalPresentation: p.finalPresentation,
        //             projectName: p.projectName,
        //             leader: p.leader.username,
        //             members: p.members.map(m => m.username),
        //             status: p.status || "On Track"
        //         }))
        //         // projects: projectsWithSummary
        //     };
        // }

        //     data = projects;
        // }

        if (user.isAdmin) {
            const projects = await Project.find()
                .populate('supervisor', 'username email')
                .populate('leader', 'username email')
                .populate('members', 'username email')

            const projectsWithSummary = await Promise.all(
                projects.map(async (p) => {
                    const progressSummary = await getProjectProgressSummary(p._id);
                    return { ...p.toObject(), progressSummary };
                })
            );

            data = {
                role: "Admin",
                totalProjects: projects.length,
                projects: projectsWithSummary
            };
        }

        return response.success(res, "Dashboard data", data);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

