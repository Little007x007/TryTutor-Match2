const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Chat = require('../models/Chat');
const Log = require('../models/Log');
const auth = require('../middleware/auth');

// Protected routes
router.use(auth);

// Get user profile
router.get('/profile', async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true });
        res.json(user);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Get logs
router.get('/logs', auth, async (req, res) => {                                             try {
        const query = {};
        
        // Filter options
        if (req.query.type) {
            query.type = req.query.type;
        }
        if (req.query.username) {
            query.username = new RegExp(req.query.username, 'i');
        }
        if (req.query.from) {
            query.timestamp = { $gte: new Date(req.query.from) };
        }
        if (req.query.to) {
            query.timestamp = { ...query.timestamp, $lte: new Date(req.query.to) };
        }

        const logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .limit(parseInt(req.query.limit) || 100);

        res.json(logs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
