// controllers/discussionController.js
const Discussion = require("../models/Discussion");
const Project = require("../models/Project");

exports.getProjectMessages = async (req, res) => {
    try {
        const { projectId } = req.params;
        const { roomType } = req.query; // pass ?roomType=team or supervisor
        const userId = req.user.id;

        const project = await Project.findById(projectId).select("supervisor leader members");
        if (!project) return res.status(404).json({ success: false, message: "Project not found" });

        const isSupervisor = project.supervisor?.toString() === userId;
        const isLeader = project.leader?.toString() === userId;
        const isMember = (project.members || []).some(m => m?.toString() === userId);

        if (roomType === "team" && !isLeader && !isMember) {
            return res.status(403).json({ success: false, message: "Not authorized for team chat" });
        }

        if (roomType === "supervisor" && !isSupervisor && !isLeader && !isMember) {
            return res.status(403).json({ success: false, message: "Not authorized for supervisor chat" });
        }

        let discussion = await Discussion.findOne({ projectId, roomType })
            .populate("messages.sender", "username");

        if (!discussion) {
            discussion = new Discussion({ projectId, roomType, messages: [] });
            await discussion.save();
        }

        res.json({ success: true, messages: discussion.messages });
    } catch (err) {
        console.error("❌ getProjectMessages error:", err);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
