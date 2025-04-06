const groqService = require('../../services/groq');
const messageModel = require('../../models/message');
const { getEmbedding } = require('../../services/embedding');

module.exports = {
  Mutation: {
    generateAIResponse: async (_, { messages, subjectId, model }, context) => {
      if (!context.user) {
        throw new Error('Authentication required');
      }
      
      try {
        let contextString = "";
        
        if (subjectId && messages.length > 0) {
          const lastUserMessage = messages
            .filter(msg => msg.role === "user")
            .slice(-1)[0];
            
          if (lastUserMessage) {
            const queryEmbedding = await getEmbedding(lastUserMessage.content);
            
            const retrievedMessages = await messageModel.search(subjectId, queryEmbedding);
            
            contextString = groqService.buildContextString(retrievedMessages);
          }
        }
        
        if (context.user) {
          const hasExceededQuota = await groqService.hasExceededQuota(context.user.id);
          if (hasExceededQuota) {
            throw new Error('Usage quota exceeded');
          }
        }
        
        const userId = context.user ? context.user.id : null;
        const response = await groqService.createChatCompletion(
          userId,
          messages,
          contextString,
          model || 'llama-3.3-70b-versatile'
        );
        
        return response;
      } catch (error) {
        console.error("Error generating AI response:", error);
        throw new Error(`Failed to generate AI response: ${error.message}`);
      }
    }
  }
};