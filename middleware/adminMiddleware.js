module.exports = function (req, res, next) {
    if (!req.user || !req.user.isAdmin) {
        console.log('User in adminMiddleware:', req.user);
        return res.status(403).json({ error: '❌ Access denied: Admins only' });
    }
    next();
};
