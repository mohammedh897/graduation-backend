require('dotenv').config();
const mongoose = require('mongoose');

const runReminders = require('./jobs/reminderJob');


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

// Import and mount routes directly
app.use('/', require('./routes/taskRoutes'));
app.use('/', require('./routes/userRoutes'));
app.use('/projects', require('./routes/projectRoutes'));
app.use('/supervisors', require('./routes/supervisorRoutes'));
app.use('/dashboard', require('./routes/dashboardRoutes'));
app.use('/api', require('./routes/projectFilesRoutes'));


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
