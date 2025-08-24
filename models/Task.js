const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: false },


    // userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
        type: String,
        enum: ['Pending', 'In Progress', 'Completed'],
        default: 'Pending'
    },
    progress: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },

    dueDate: {
        type: Date
    },
    reminderDate: {
        type: Date
    },
    createdAt: { type: Date, default: Date.now },

    updatedAt: {
        type: Date,
        default: Date.now
    },
    reminderSent: {
        type: Boolean,
        default: false
    }

});

module.exports = mongoose.model('Task', TaskSchema);
