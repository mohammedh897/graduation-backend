const jwt = require("jsonwebtoken");

function socketAuth(io) {
    io.use((socket, next) => {
        try {
            // Token can arrive as handshake.auth.token or as header
            const token =
                socket.handshake.auth?.token ||
                socket.handshake.headers?.authorization?.replace(/^Bearer\s+/i, "");

            if (!token) return next(new Error("No auth token"));

            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            socket.user = { id: decoded.id }; // Match your verifyToken payload
            next();
        } catch (err) {
            next(new Error("Unauthorized"));
        }
    });
}

module.exports = { socketAuth };
