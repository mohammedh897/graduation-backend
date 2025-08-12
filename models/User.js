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

}, { versionKey: false });

module.exports = mongoose.model('User', UserSchema);
