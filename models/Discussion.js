const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    roomType: { type: String, enum: ["team", "supervisor"], required: true },
    messages: [messageSchema]
});

module.exports = mongoose.model("Discussion", discussionSchema);
