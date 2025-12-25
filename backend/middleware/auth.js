// Already included in videos.js but good to have separate or extracted.
// For now, it's inline in videos.js as per previous step, but I should probably extract it or just leave it if I don't use it elsewhere. 
// Actually, I'll validte that I don't strictly need a separate file if I keep it simple.
// But wait, I might need it for other routes? Currently only videos.
// I'll skip creating a separate middleware file for now to keep file count low, unless needed.
// Correction: I should create a simple separate file to be clean.

const jwt = require('jsonwebtoken');

const auth = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ message: 'No token, authorization denied' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (e) {
        res.status(400).json({ message: 'Token is not valid' });
    }
};

module.exports = auth;
