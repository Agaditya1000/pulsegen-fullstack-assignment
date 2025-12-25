const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadVideo, getVideos, streamVideo, reviewVideo } = require('../controllers/videoController');
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

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only video files are allowed.'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024 // 100 MB limit
    }
});

// Routes with RBAC
// Upload: Editor and Admin only
router.post('/upload', auth, checkRole(['editor', 'admin']), (req, res, next) => {
    upload.single('video')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            // A Multer error occurred when uploading.
            console.error('Multer Error:', err);
            return res.status(400).json({ message: `Upload Error: ${err.message}` });
        } else if (err) {
            // An unknown error occurred when uploading.
            console.error('Upload Error:', err);
            return res.status(400).json({ message: err.message });
        }
        // Everything went fine.
        next();
    });
}, uploadVideo);

// Get Videos: All authenticated users can list, but controller filters based on role
router.get('/', auth, getVideos);

// Stream: Public or authenticated? 
// Requirement: "Viewer Role: Read-only access to assigned videos".
// Let's protect stream endpoint with auth middleware, passing token via query param is handled in auth middleware now.
// Stream
router.get('/stream/:id', auth, streamVideo);

// Admin Review
router.put('/:id/review', auth, checkRole(['admin']), reviewVideo);

// Update/Delete (Editor/Admin)
const { deleteVideo, updateVideo } = require('../controllers/videoController');
router.put('/:id', auth, checkRole(['editor', 'admin']), upload.single('video'), updateVideo);
router.delete('/:id', auth, checkRole(['editor', 'admin']), deleteVideo);

module.exports = router;
