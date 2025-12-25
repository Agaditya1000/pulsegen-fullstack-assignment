const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const { auth, checkRole } = require('../middleware/auth');

// Get Settings (Authenticated users might need some, but Admin needs all. Let's return all for Admin)
// Or public endpoints for 'maintenanceMode' etc.
// For now, these are Admin Management routes.

// Helper to get singleton settings
const getSettingsDoc = async () => {
    let settings = await Setting.findOne();
    if (!settings) {
        settings = new Setting();
        await settings.save();
    }
    return settings;
};

// GET Settings (Admin only for full config, though some might be public in real app)
router.get('/', auth, checkRole(['admin']), async (req, res) => {
    try {
        const settings = await getSettingsDoc();
        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// UPDATE Settings (Admin only)
router.put('/', auth, checkRole(['admin']), async (req, res) => {
    try {
        let settings = await getSettingsDoc();

        // Update fields
        const { allowRegistration, maxUploadSizeMB, maintenanceMode, welcomeMessage } = req.body;

        if (allowRegistration !== undefined) settings.allowRegistration = allowRegistration;
        if (maxUploadSizeMB !== undefined) settings.maxUploadSizeMB = maxUploadSizeMB;
        if (maintenanceMode !== undefined) settings.maintenanceMode = maintenanceMode;
        if (welcomeMessage !== undefined) settings.welcomeMessage = welcomeMessage;

        settings.updatedAt = Date.now();
        await settings.save();

        res.json(settings);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
