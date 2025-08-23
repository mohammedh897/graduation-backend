module.exports = (req, res, next) => {
    if (req.user.userType !== 'Supervisor') {
        return res.status(403).json({ error: 'Access denied. Supervisor only.' });
    }
    next();
};

