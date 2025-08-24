const User = require('../models/User');
const bcrypt = require('bcrypt');
const response = require("../utils/response");
const Project = require('../models/Project'); // <-- add this

exports.registerUser = async (req, res) => {
    try {
        const { username, password, email, isAdmin = false, userType = 'Student' } = req.body;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'All fields are required' });
        }
        // Check if user exists
        const existing = await User.findOne({
            $or: [{ username }, { email }]
        });
        if (existing) return res.status(400).json({ error: 'Username or email already exists' });

        // Hash password
        const hashed = await bcrypt.hash(password, 10);

        const newUser = new User({ username, password: hashed, email, isAdmin, userType });
        const saved = await newUser.save();

        // res.json({ message: '✅ User registered!', userId: saved._id });
        return response.success(res, "User registered successfully", {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            userType: newUser.userType,
            isAdmin: newUser.isAdmin
        }, 201);
    } catch (error) {
        return response.error(res, error.message, 400);
        // res.status(500).json({ error: '❌ Registration failed', details: error.message });
    }
};
// console.log("🧪 Received body:", req.body);

const jwt = require('jsonwebtoken');
exports.loginUser = async (req, res) => {
    try {
        const { emailOrUsername, password } = req.body;

        // Check if user exists
        const user = await User.findOne({
            $or: [
                { email: new RegExp(`^${emailOrUsername}$`, 'i') },
                { username: emailOrUsername }
            ]
        });

        // const user = await User.findOne({
        //     $or: [{ email: emailOrUsername }, { username: emailOrUsername }]
        // });
        // const user = await User.findOne({ username });
        if (!user) return response.error(res, "User not found", 401);
        // if (!user) return res.status(400).json({ error: 'User not found' });

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return response.error(res, "Invalid email/username or password", 401);
        // if (!isMatch) return res.status(400).json({ error: 'Invalid password' });

        const token = jwt.sign(
            // { userId: user._id, username: user.username, isAdmin: user.isAdmin },
            { id: user._id, isAdmin: user.isAdmin, userType: user.userType },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );
        let inProject = false;
        let projectId = null;

        if (user.userType === "Student") {
            const proj = await Project.findOne({
                $or: [{ leader: user._id }, { members: user._id }]
            }).select('_id');

            if (proj) {
                inProject = true;
                projectId = proj._id;
            }
        }
        // } else if (user.userType === "Supervisor") {
        //     const projs = await Project.find({ supervisor: user._id }).select('_id');

        //     if (projs.length > 0) {
        //         inProject = true;
        //         projectId = projs.map(p => p._id); // return array of IDs
        //     }
        // }

        //     else if (user.userType === "Supervisor") {
        //         console.log("🔍 Checking projects for supervisor:", user._id);

        //         const projects = await Project.find({ Supervisor: user._id }).select('_id supervisor');

        //         console.log("📝 Found projects:", projects);

        //         if (projects.length > 0) {
        //             inProject = true;
        //             projectId = projects.map(p => p._id);
        //         }
        //     }
        // }

        //     //working code
        // } else if (user.userType === "Supervisor") {
        //     const proj = await Project.findOne({ supervisor: user._id }).select('_id');
        //     if (proj) {
        //         inProject = true;
        //         projectId = proj._id;
        //     }
        // }
        //     else if (user.userType === "Supervisor") {
        //         const projects = await Project.find({ supervisor: user._id }).select('_id');
        //         if (projects.length > 0) {
        //             inProject = true;
        //             projectId = projects.map(p => p._id); // If supervisor can have multiple projects       
        //         }
        //     }
        // }


        // let inProject = false;
        // if (user.userType === "Student") {
        //     const proj = await Project.findOne({
        //         $or: [{ leader: user._id }, { members: user._id }]
        //     }).select('_id');
        //     inProject = !!proj;
        // } else if (user.userType === "Supervisor") {
        //     const proj = await Project.findOne({ supervisor: user._id }).select('_id');
        //     inProject = !!proj;
        // }

        // const project = await Project.findOne({
        //     $or: [
        //         { leader: user._id },
        //         { members: user._id }
        //     ]
        // }).select('_id');

        // const inProject = !!project; // true if found

        // const token = jwt.sign(
        //     process.env.JWT_SECRET,
        //     { expiresIn: '1h' }
        // );
        // For now, just return success + user ID (token comes later)
        // res.json({ message: '✅ Login successful!', token });
        // console.log("🧑 Logged in user:", {
        //     id: user._id,
        //     username: user.username,
        //     email: user.email,
        //     userType: user.userType
        // });sole.log("🧑 Logged in user:", {
        //     id: user._id,
        //     username: user.username,
        //     email: user.email,
        //     userType: user.userType
        // });

        return response.success(res, "Login successful", {
            id: user._id,
            username: user.username,
            email: user.email,
            userType: user.userType,
            isAdmin: user.isAdmin,
            inProject,
            projectId,
            token
        });
    } catch (error) {
        return response.error(res, error.message, 500);
        // res.status(500).json({ error: '❌ Login_failed', details: error.message });
    }
};

