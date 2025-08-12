// controllers/supervisorController.js
const User = require('../models/User');
const response = require('../utils/response');

/**
 * Update supervisor availability status
 * Body: { status: "available" | "full" }
 */
const updateSupervisorStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const supervisorId = req.user.id; // From JWT payload

        // Validate input
        if (!status || !["available", "full"].includes(status)) {
            return response.error(res, "Invalid status value", 400);
        }

        const supervisor = await User.findById(supervisorId);
        if (!supervisor || supervisor.userType !== 'Supervisor') {
            return response.error(res, "Not a supervisor", 403);
        }

        supervisor.status = status;
        await supervisor.save();

        return response.success(res, "Status updated successfully", {
            id: supervisor._id,
            username: supervisor.username,
            status: supervisor.status
        });
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

/**
 * Get all available supervisors
 */
const getAvailableSupervisors = async (req, res) => {
    try {
        const supervisors = await User.find({
            userType: 'Supervisor',
            status: 'available'
        }).select('_id username email status');

        return response.success(res, "Available supervisors retrieved successfully", supervisors);
    } catch (err) {
        return response.error(res, err.message, 500);
    }
};

// Export both functions
module.exports = {
    updateSupervisorStatus,
    getAvailableSupervisors
};
