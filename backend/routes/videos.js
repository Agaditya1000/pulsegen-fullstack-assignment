const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideos, streamVideo } = require('../controllers/videoController');
const { auth, checkRole } = require('../middleware/auth');

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

// Routes with RBAC
// Upload: Editor and Admin only
router.post('/upload', auth, checkRole(['editor', 'admin']), upload.single('video'), uploadVideo);

// Get Videos: All authenticated users can list, but controller filters based on role
router.get('/', auth, getVideos);

// Stream: Public or authenticated? 
// Requirement: "Viewer Role: Read-only access to assigned videos".
// Let's protect stream endpoint with auth middleware, passing token via query param is handled in auth middleware now.
router.get('/stream/:id', auth, streamVideo);

module.exports = router;
