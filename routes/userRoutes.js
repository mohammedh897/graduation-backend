const express = require('express');
const User = require('../models/User');
const Project = require('../models/Project');

const authMiddleware = require('../middleware/verifyToken');      // ✅ Auth only
const adminMiddleware = require('../middleware/adminMiddleware'); // ✅ Admin check
const supervisorMiddleware = require('../middleware/supervisorMiddleware');
const response = require("../utils/response");

const router = express.Router();
const { registerUser, loginUser } = require('../controllers/userController');

router.post('/register', registerUser);
router.post('/login', loginUser);

// router.get('/supervisor/dashboard', authMiddleware, supervisorMiddleware, (req, res) => {
//     res.json({ message: `Welcome Supervisor ${req.user.username}` });
// });

router.get('/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
    // const users = await User.find();
    // res.json(users);
    // res.json(users);
    try {
        const users = await User.find({}, "-password -__v"); // hide password and __v
        return response.success(res, "Users fetched successfully", users);
    } catch (error) {
        return response.error(res, error.message, 500);
    }
});
// });



router.delete('/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const userId = req.params.id;

        // Optional: prevent deleting self
        if (req.user.userId === userId) {
            return res.status(400).json({ error: '❌ You cannot delete your own account via admin route' });
        }

        const deletedUser = await User.findByIdAndDelete(userId);

        if (!deletedUser) {
            return res.status(404).json({ error: '❌ User not found' });
        }

        res.json({ message: `✅ User ${deletedUser.username} deleted successfully` });
    } catch (err) {
        res.status(500).json({ error: '❌ Failed to delete user', details: err.message });
    }
});
// router.get('/projects', authMiddleware, adminMiddleware, getAllProjects);

router.get('/projects', authMiddleware, adminMiddleware, async (req, res) => {
    // const users = await User.find();
    // res.json(users);
    // res.json(users);
    try {
        const project = await Project.find({}, "-password -__v"); // hide password and __v
        return response.success(res, "Project fetched successfully", project);
    } catch (error) {
        return response.error(res, error.message, 500);
    }
});
module.exports = router;
