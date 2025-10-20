// server.js
const fs = require("fs");
const http = require("http");
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");

// Load local .env only if not in production
if (process.env.NODE_ENV !== "production") {
    require("dotenv").config();
}

// Import jobs and socket
const runReminders = require("./jobs/reminderJob");
const initSocket = require("./services/socket");
const { socketAuth } = require("./utils/socketAuth");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Load secret files (e.g., Google credentials)
const credentialsPath = "/etc/secrets/credentials.json";
let GOOGLE_CREDENTIALS = null;
if (fs.existsSync(credentialsPath)) {
    GOOGLE_CREDENTIALS = JSON.parse(fs.readFileSync(credentialsPath, "utf-8"));
    console.log("✅ Loaded secret file credentials.json");
}

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log("✅ Connected to MongoDB");
        runReminders(); // Start scheduled jobs
    })
    .catch(err => console.error("❌ MongoDB connection failed:", err));

// Routes
app.use("/", require("./routes/taskRoutes"));
app.use("/", require("./routes/userRoutes"));
app.use("/projects", require("./routes/projectRoutes"));
app.use("/supervisors", require("./routes/supervisorRoutes"));
app.use("/dashboard", require("./routes/dashboardRoutes"));
app.use("/api", require("./routes/projectFilesRoutes"));
app.use("/discussions", require("./routes/discussionRoutes"));

// Home route
app.get("/", (req, res) => res.send("🎉 Hello from your backend!"));
app.get("/back", (req, res) => res.send("🎉 Hello from your backend!_new"));

// Create HTTP server for Socket.IO
const server = http.createServer(app);

// Initialize Socket.IO
const { Server } = require("socket.io");
const io = new Server(server, {
    cors: { origin: "*" },
});

// Apply JWT auth middleware for sockets
socketAuth(io);

// Initialize socket events
initSocket(io);

// Start server
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
