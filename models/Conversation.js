const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  human: { type: String, required: true },
  ai: { type: String, required: true },
  sources: [{
    title: String,
    url: String,
  }],
  suggestions: [String],
  timestamp: { type: Date, default: Date.now },
});

const conversationSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true, // Now this is correct, as we'll have one document per session
    index: true,
  },
  messages: [messageSchema], // An array of messages
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Conversation', conversationSchema);