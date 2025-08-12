require('dotenv').config();
const mongoose = require('mongoose');

const runReminders = require('./jobs/reminderJob');

// app.use('/supervisors', require('./routes/supervisorRoutes'));

const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => {
        console.log('✅ Connected to MongoDB');
        runReminders();
    })
    .catch((err) => console.error('❌ MongoDB connection failed:', err));

// Import routes
const taskRoutes = require('./routes/taskRoutes');
app.use('/', taskRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

const projectRoutes = require('./routes/projectRoutes');
app.use('/projects', projectRoutes);

// const supervisorRoutes = require('./routes/supervisorRoutes');
// app.use('/', supervisorRoutes);
app.use('/supervisors', require('./routes/supervisorRoutes'));

// const initializeTypes = require('./seed/initializeTypes');

// initializeTypes(); // Now this should work

// Home route
app.get('/', (req, res) => {
    res.send('🎉 Hello from your backend!');
});
app.get('/back', (req, res) => {
    res.send('🎉 Hello from your backend!_new');
});
// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);

});
