const mongoose = require('mongoose');

const SettingSchema = new mongoose.Schema({
    allowRegistration: { type: Boolean, default: true },
    maxUploadSizeMB: { type: Number, default: 50 },
    maintenanceMode: { type: Boolean, default: false },
    welcomeMessage: { type: String, default: "Welcome to StreamSure!" },
    updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Setting', SettingSchema);
