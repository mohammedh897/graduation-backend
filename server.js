require('dotenv').config();
const mongoose = require('mongoose');
const runReminders = require('./jobs/reminderJob');

const express = require('express');
const cors = require('cors');
const http = require('http'); // Needed for socket.io
const { socketAuth } = require('./utils/socketAuth'); // Your auth middleware
const initSocket = require('./services/socket');

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('✅ Connected to MongoDB');
        runReminders();
    })
    .catch((err) => console.error('❌ MongoDB connection failed:', err));

// Routes
app.use('/', require('./routes/taskRoutes'));
app.use('/', require('./routes/userRoutes'));
app.use('/projects', require('./routes/projectRoutes'));
app.use('/supervisors', require('./routes/supervisorRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/api', require('./routes/projectFilesRoutes'));
app.use('/discussions', require('./routes/discussionRoutes'));

// Home route
app.get('/', (req, res) => res.send('🎉 Hello from your backend!'));
app.get('/back', (req, res) => res.send('🎉 Hello from your backend!_new'));

// Start server
const server = http.createServer(app);

// ✅ Create io instance here
const { Server } = require('socket.io');
const io = new Server(server, { cors: { origin: '*' } });

// ✅ Apply socket JWT auth middleware
socketAuth(io);

// ✅ Initialize socket events
initSocket(io);

// Listen
server.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
