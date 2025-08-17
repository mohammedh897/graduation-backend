const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    email: { type: String, required: true, unique: true },
    // type: { type: mongoose.Schema.Types.ObjectId, ref: 'Type', required: true }
    isAdmin: { type: Boolean, default: false },
    userType: { type: String, enum: ['Student', 'Supervisor'], default: 'Student', required: true },
    // supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // only for students
    status: {
        type: String, enum: ['available', 'full'], default: function () {
            return this.userType === 'Supervisor' ? 'available' : undefined;
        }
    },
    maxProjects: { type: Number, default: 7 },
    currentProjects: { type: Number, default: 0 }

}, { versionKey: false });

module.exports = mongoose.model('User', UserSchema);
