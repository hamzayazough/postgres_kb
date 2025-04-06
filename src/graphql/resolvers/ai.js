const groqService = require('../../services/groq');
const messageModel = require('../../models/message');
const { getEmbedding } = require('../../services/embedding');

module.exports = {
  Mutation: {
    generateAIResponse: async (_, { messages, subjectId, model }, context) => {
      // Optional authentication check - can be enabled when Firebase auth is implemented
      // if (!context.user) {
      //   throw new Error('Authentication required');
      // }
      
      try {
        // Look for relevant context if a subjectId is provided
        let contextString = "";
        
        if (subjectId && messages.length > 0) {
          // Get the last user message to search for relevant context
          const lastUserMessage = messages
            .filter(msg => msg.role === "user")
            .slice(-1)[0];
            
          if (lastUserMessage) {
            // Generate embedding for the query
            const queryEmbedding = await getEmbedding(lastUserMessage.content);
            
            // Search for relevant messages
            const retrievedMessages = await messageModel.search(subjectId, queryEmbedding);
            
            // Build context string
            contextString = groqService.buildContextString(retrievedMessages);
          }
        }
        
        // Check if user has exceeded quota (if authenticated)
        if (context.user) {
          const hasExceededQuota = await groqService.hasExceededQuota(context.user.id);
          if (hasExceededQuota) {
            throw new Error('Usage quota exceeded');
          }
        }
        
        // Generate AI response
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