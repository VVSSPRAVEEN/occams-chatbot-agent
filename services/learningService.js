const Feedback = require('../models/Feedback');
const Conversation = require('../models/Conversation');

class LearningService {
  async saveConversation(sessionId, userMessage, aiResponse) {
    try {
      let conversation = await Conversation.findOne({ sessionId });
      
      if (!conversation) {
        conversation = new Conversation({
          sessionId,
          messages: []
        });
      }
      
      conversation.messages.push(
        { role: 'user', content: userMessage },
        { role: 'assistant', content: aiResponse }
      );
      
      await conversation.save();
      return conversation;
    } catch (error) {
      console.error('Error saving conversation:', error);
    }
  }

  async processFeedback(feedbackData) {
    try {
      const feedback = new Feedback(feedbackData);
      await feedback.save();
      return feedback;
    } catch (error) {
      console.error('Error processing feedback:', error);
    }
  }
}

module.exports = new LearningService();