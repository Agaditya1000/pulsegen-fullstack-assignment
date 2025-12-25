const express = require('express');
const router = express.Router();
const { getAllUsers, deleteUser, updateUserRole } = require('../controllers/userController');
const { auth, checkRole } = require('../middleware/auth');

// Get all users (Admin & Editor)
router.get('/', auth, checkRole(['admin', 'editor']), getAllUsers);

// Admin Only Operations
router.delete('/:id', auth, checkRole(['admin']), deleteUser);
router.put('/:id/role', auth, checkRole(['admin']), updateUserRole);

module.exports = router;
