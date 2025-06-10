const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  // The original question that received feedback
  query: {
    type: String,
    required: true
  },
  // The answer that was rated
  answer: {
    type: String,
    required: true
  },
  // The rating: 'positive' for 👍, 'negative' for 👎
  rating: {
    type: String,
    required: true,
    enum: ['positive', 'negative']
  },
  // Timestamp for when the feedback was given
  timestamp: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Feedback', feedbackSchema);