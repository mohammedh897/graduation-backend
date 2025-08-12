const Project = require('../models/Project');
const User = require('../models/User');
const generateTeamCode = require('../utils/generateCode');
const response = require('../utils/response'); // Your success/error wrapper

exports.createProject = async (req, res) => {
    try {
        const { projectName, description, supervisorId, emails } = req.body;
        const leaderId = req.user.id; // Comes from auth middleware

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
        if (Array.isArray(emails) && emails.length > 0) {
            console.log(`📧 Sending invites to: ${emails.join(', ')} with code: ${teamCode}`);
            // TODO: Use Nodemailer to send real emails
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
