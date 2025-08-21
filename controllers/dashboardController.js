const Project = require('../models/Project');
const User = require('../models/User');
const response = require('../utils/response');

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
                const { getProjectProgressSummary } = require('../controllers/projectController');
                const { getMyTaskSummary } = require('../controllers/taskController');
                const progressSummary = await getProjectProgressSummary(project._id);
                const myTaskSummary = await getMyTaskSummary(userId);
                data = { ...project.toObject(), progressSummary, myTaskSummary };
            }
        }


        if (user.userType === 'Supervisor') {
            const projects = await Project.find({ supervisor: userId })
                .populate('leader', 'username email')
                .populate('members', 'username email')

            data = projects;
        }

        if (user.isAdmin) {
            const projects = await Project.find()
                .populate('supervisor', 'username email')
                .populate('leader', 'username email')
                .populate('members', 'username email')

            data = projects;
        }


        return response.success(res, "Dashboard data", data);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};
