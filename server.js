const express = require('express');
const cors = require('cors');
const http = require('http');
const mongoose = require('mongoose');
require('dotenv').config();

const AIService = require('./services/aiService'); 
const Conversation = require('./models/Conversation');
const Feedback = require('./models/Feedback');

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected successfully.'))
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

app.post('/api/chat', async (req, res) => {
  try {
    const { message, sessionId } = req.body;
    if (!message || !sessionId) {
      return res.status(400).json({ error: 'Message and Session ID are required.' });
    }

    const aiServiceInstance = new AIService();
    await aiServiceInstance.initialize();
    const result = await aiServiceInstance.getResponse(message);

    // --- FIX: This logic now correctly finds a session or creates a new one, then pushes the new message. ---
    const newMessage = {
        human: message,
        ai: result.answer,
        sources: result.sources,
        suggestions: result.suggestions
    };

    await Conversation.findOneAndUpdate(
        { sessionId: sessionId },
        { 
            $push: { messages: newMessage },
            $set: { updatedAt: new Date() }
        },
        { upsert: true, new: true, setDefaultsOnInsert: true } // upsert creates the doc if it doesn't exist
    );

    res.json(result);

  } catch (error) {
    console.error('Chat API Error:', error);
    res.status(500).json({ error: 'An internal error occurred while processing your request.' });
  }
});

app.post('/api/feedback', async (req, res) => {
  try {
    const { query, answer, rating } = req.body;
    if (!query || !answer || !rating) {
      return res.status(400).json({ error: 'Query, answer, and rating are required.' });
    }
    await Feedback.create({ query, answer, rating });
    res.json({ success: true, message: 'Thank you for your feedback.' });
  } catch (error) {
    console.error('Feedback API Error:', error);
    res.status(500).json({ error: 'An internal error occurred while processing feedback.' });
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 Server is running and listening for requests at http://localhost:${PORT}`);
  console.log("Note: AI agents will be initialized on each user request for stability.");
});