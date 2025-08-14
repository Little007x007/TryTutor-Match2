const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
    student1: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    student2: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true
    },
    grade: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'matched', 'completed'],
        default: 'pending'
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: {
        type: Date
    },
    matchTime: {
        type: Number, // เวลาที่ใช้ในการจับคู่ (วินาที)
        required: true
    }
});

module.exports = mongoose.model('Match', matchSchema);
