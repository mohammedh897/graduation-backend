const { Server } = require("socket.io");
const { socketAuth } = require("../utils/socketAuth");
const Discussion = require("../models/Discussion");
const Project = require("../models/Project");

function initSocket(serverOrIo) {
    // Accept either an io instance or HTTP server
    const io = serverOrIo.of ? serverOrIo : new Server(serverOrIo, { cors: { origin: "*" } });

    // Apply JWT auth
    socketAuth(io);

    io.on("connection", (socket) => {
        console.log(`🔌 New client connected: ${socket.user?.id}`);

        // Join a project room
        socket.on("joinProject", async ({ projectId, roomType }) => {
            try {
                if (!projectId || !roomType) return socket.emit("error", "Missing projectId or roomType");

                const project = await Project.findById(projectId).select("supervisor leader members");
                if (!project) return socket.emit("error", "Project not found");

                const userId = socket.user.id;
                const isSupervisor = project.supervisor?.toString() === userId;
                const isLeader = project.leader?.toString() === userId;
                const isMember = (project.members || []).some(m => m?.toString() === userId);

                if (roomType === "team" && !isLeader && !isMember)
                    return socket.emit("error", "Not authorized for team chat");

                if (roomType === "supervisor" && !isSupervisor && !isLeader && !isMember)
                    return socket.emit("error", "Not authorized for supervisor chat");

                const roomName = `project:${projectId}:${roomType}`;
                // Leave all previous project rooms for this user
                Array.from(socket.rooms)
                    .filter(r => r.startsWith("project:") && r !== socket.id)
                    .forEach(r => socket.leave(r));

                socket.join(roomName);

                // Fetch or create discussion
                let discussion = await Discussion.findOne({ projectId, roomType }).populate("messages.sender", "username");
                if (!discussion) {
                    discussion = new Discussion({ projectId, roomType, messages: [] });
                    await discussion.save();
                }

                // Send history to this socket
                socket.emit("messageHistory", discussion.messages.map(m => ({
                    ...m.toObject(),
                    roomType
                })));

                socket.emit("joinedProject", { projectId, roomType });

                console.log(`✅ User ${userId} joined ${roomType} chat of project ${projectId}`);
            } catch (err) {
                console.error("❌ joinProject error:", err.message);
                socket.emit("error", "Server error while joining project");
            }
        });

        // Send message
        socket.on("sendMessage", async ({ projectId, roomType, content }) => {
            try {
                if (!content) return;

                const userId = socket.user.id;

                const project = await Project.findById(projectId).select("supervisor leader members");
                if (!project) return socket.emit("error", "Project not found");

                const isSupervisor = project.supervisor?.toString() === userId;
                const isLeader = project.leader?.toString() === userId;
                const isMember = (project.members || []).some(m => m?.toString() === userId);

                if (!isSupervisor && !isLeader && !isMember)
                    return socket.emit("error", "Not authorized for this project");

                if (roomType === "team" && isSupervisor)
                    return socket.emit("error", "Supervisors cannot post in team room");

                let discussion = await Discussion.findOne({ projectId, roomType });
                if (!discussion) discussion = new Discussion({ projectId, roomType, messages: [] });

                const newMessage = { sender: userId, content, createdAt: new Date() };
                discussion.messages.push(newMessage);
                await discussion.save();

                await discussion.populate("messages.sender", "username");
                const populatedMessage = { ...discussion.messages[discussion.messages.length - 1].toObject(), roomType };

                const roomName = `project:${projectId}:${roomType}`;
                io.to(roomName).emit("receiveMessage", populatedMessage);

                console.log(`💬 ${userId} sent message in ${roomType} chat of project ${projectId}`);
            } catch (err) {
                console.error("❌ sendMessage error:", err.message);
                socket.emit("error", "Server error while sending message");
            }
        });

        // Disconnect
        socket.on("disconnect", () => {
            console.log(`❌ Client disconnected: ${socket.user?.id}`);
        });
    });

    return io;
}

module.exports = initSocket;