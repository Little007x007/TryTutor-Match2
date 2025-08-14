const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    type: {
        type: String,
        required: true,
        enum: ['login', 'logout', 'chat', 'match', 'ai_chat']
    },
    userId: String,
    username: String,
    details: {
        type: Object,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    ipAddress: String,
    userAgent: String
});

module.exports = mongoose.model('Log', logSchema);
