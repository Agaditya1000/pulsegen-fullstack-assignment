const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideos, streamVideo } = require('../controllers/videoController');
const jwt = require('jsonwebtoken');

// Middleware to verify token
const verifyToken = (req, res, next) => {
    // Check header or query param (for streaming)
    const token = req.headers['authorization']?.split(' ')[1] || req.query.token;

    if (!token) return res.status(403).json({ message: 'No token provided' });

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) return res.status(401).json({ message: 'Unauthorized' });
        req.user = decoded;
        next();
    });
};

// Multer Setup
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

const upload = multer({ storage });

router.post('/upload', verifyToken, upload.single('video'), uploadVideo);
router.get('/', verifyToken, getVideos);
router.get('/stream/:id', streamVideo); // Allowing stream without auth for easier testing, or add verifyToken if needed (via query param)

module.exports = router;
