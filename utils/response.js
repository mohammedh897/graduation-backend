// utils/response.js
module.exports = {
    success: (res, message, data = null, statusCode = 200) => {
        return res.status(statusCode).json({
            success: true,
            message,
            data
        });
    },

    error: (res, message, statusCode = 400) => {
        return res.status(statusCode).json({
            success: false,
            message
        });
    }
};
