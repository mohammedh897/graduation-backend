// services/socket.js
const Discussion = require("../models/Discussion");
const Project = require("../models/Project");

function initSocket(io) {
    io.on("connection", (socket) => {
        console.log(`🔌 New client connected: ${socket.user?.id}`);

        // ✅ Join Project Room
        socket.on("joinProject", async ({ projectId, roomType }) => {
            try {
                if (!projectId || !roomType) {
                    return socket.emit("error", "Missing projectId or roomType");
                }

                // Check user role
                const project = await Project.findById(projectId).select("supervisor leader members");
                if (!project) return socket.emit("error", "Project not found");

                const userId = socket.user.id;
                const isSupervisor = project.supervisor?.toString() === userId;
                const isLeader = project.leader?.toString() === userId;
                const isMember = (project.members || []).some(m => m?.toString() === userId);

                if (roomType === "team" && !isLeader && !isMember) {
                    return socket.emit("error", "Not authorized for team chat");
                }
                if (roomType === "supervisor" && !isSupervisor && !isLeader && !isMember) {
                    return socket.emit("error", "Not authorized for supervisor chat");
                }

                const roomName = `project:${projectId}:${roomType}`;
                socket.join(roomName);

                // Fetch or create discussion
                let discussion = await Discussion.findOne({ projectId, roomType })
                    .populate("messages.sender", "username");
                if (!discussion) {
                    discussion = new Discussion({ projectId, roomType, messages: [] });
                    await discussion.save();
                }

                // ✅ Tell user they joined first
                socket.emit("joinedProject", {
                    projectId,
                    roomType,
                    message: `✅ You joined ${roomType} chat of project ${projectId}`
                });

                // ✅ Then send old messages
                socket.emit("messageHistory", discussion.messages);

                console.log(`✅ User ${userId} joined ${roomType} chat of project ${projectId}`);
            } catch (err) {
                console.error("❌ joinProject error:", err.message);
                socket.emit("error", "Server error while joining project");
            }
        });

        // ✅ Send Message
        socket.on("sendMessage", async ({ projectId, roomType, content }) => {
            try {
                if (!content) return;

                let discussion = await Discussion.findOne({ projectId, roomType });
                if (!discussion) {
                    discussion = new Discussion({ projectId, roomType, messages: [] });
                }

                const newMessage = { sender: socket.user.id, content, createdAt: new Date() };
                discussion.messages.push(newMessage);
                await discussion.save();

                await discussion.populate("messages.sender", "username");
                const populatedMessage = discussion.messages[discussion.messages.length - 1];

                // ✅ Broadcast to everyone in the same room + include roomType
                const roomName = `project:${projectId}:${roomType}`;
                io.to(roomName).emit("receiveMessage", {
                    ...populatedMessage.toObject(),
                    roomType,
                });

                console.log(`💬 ${socket.user.id} sent message in ${roomType} chat of project ${projectId}`);
            } catch (err) {
                console.error("❌ sendMessage error:", err.message);
                socket.emit("error", "Server error while sending message");
            }
        });

        // ✅ Disconnect
        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.user?.id}`);
        });
    });
}

module.exports = initSocket;
