require('dotenv').config();
const mongoose = require('mongoose');

const express = require('express');
const app = express();
const PORT = 5000;

// Middleware
app.use(express.json());

mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
    .then(() => console.log('✅ Connected to MongoDB'))
    .catch((err) => console.error('❌ MongoDB connection failed:', err));

// Import routes
const taskRoutes = require('./routes/taskRoutes');
app.use('/', taskRoutes);

const userRoutes = require('./routes/userRoutes');
app.use('/', userRoutes);

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
