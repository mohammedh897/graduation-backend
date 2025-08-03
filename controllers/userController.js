const User = require('../models/User');
const bcrypt = require('bcrypt');

exports.registerUser = async (req, res) => {
    try {
        const { username, password, email, isAdmin } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Check if user exists
        const existing = await User.findOne({ username });
        if (existing) return res.status(400).json({ error: 'User already exists' });

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashed, email, isAdmin: isAdmin || false });
        const saved = await newUser.save();

        res.json({ message: '✅ User registered!', userId: saved._id });
    } catch (error) {
        res.status(500).json({ error: '❌ Registration failed', details: error.message });
    }
};
// console.log("🧪 Received body:", req.body);

const jwt = require('jsonwebtoken');
exports.loginUser = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if user exists
        const user = await User.findOne({ username });
        if (!user) return res.status(400).json({ error: 'User not found' });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign(
            { userId: user._id, username: user.username, isAdmin: user.isAdmin },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );
        // For now, just return success + user ID (token comes later)
        res.json({ message: '✅ Login successful!', token });
    } catch (error) {
        res.status(500).json({ error: '❌ Login_failed', details: error.message });
    }
};

