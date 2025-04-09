const groqService = require('../../services/groq-service');
const messageModel = require('../../models/message');
const { getEmbedding } = require('../../services/embedding-service');
const { searchContextForQuery } = require('../../services/document-search');

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
            const context = await searchContextForQuery(subjectId, lastUserMessage.content);
            contextString = context.combinedContext;
          }
        }
        
        const userId = context.user ? context.user.id : null;


        const lastResponse = await groqService.createChatCompletion(userId, messages, contextString);

        if (lastResponse.content.includes("I need more information") || 
            lastResponse.content.includes("don't have enough context")) {
          const moreChunks = await documentModel.getAdditionalChunks(subjectId, queryEmbedding, 5);
          const extendedContext = contextString + "\n\n" + moreChunks.join("\n\n");
          
          return await groqService.createChatCompletion(userId, messages, extendedContext, model || 'llama-3.3-70b-versatile');
        }
        return lastResponse;
      } catch (error) {
        console.error("Error generating AI response:", error);
        throw new Error(`Failed to generate AI response: ${error.message}`);
      }
    }
  },      
};