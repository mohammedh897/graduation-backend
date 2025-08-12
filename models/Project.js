// const mongoose = require('mongoose');

// const projectSchema = new mongoose.Schema({
//     name: { type: String, required: true },
//     description: { type: String },
//     code: { type: String, required: true, unique: true }, // Random code for joining
//     creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The student who created the project
//     supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // The supervisor
//     teamMembers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], // All members including creator
//     invitedEmails: [{ type: String }], // Emails to send the code to
//     createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model('Project', projectSchema);
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    projectName: { type: String, required: true },
    description: { type: String },
    supervisor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    leader: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    teamCode: { type: String, required: true, unique: true },
    status: { type: String, enum: ['open', 'full'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);
